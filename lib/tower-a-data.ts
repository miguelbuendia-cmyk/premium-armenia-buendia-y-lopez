import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"

import type {
  TowerAExplorerData,
  TowerAFloorPlan,
  TowerAImage,
  TowerAInventoryUnit,
  TowerAUnitStatus,
} from "@/lib/tower-a-types"
import { TOWER_A_FLOORS } from "@/lib/tower-a-types"
import { towerAFloorMarkers } from "@/lib/tower-a-markers"

const GOOGLE_SHEET_ID = "1J5aVZVlxbjL4cGoZ88a-abpwtiOOdh3nr3RB_9-RPbY"
const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`
const FLOOR_PLAN_FOLDER_SEGMENTS = ["Torre A", "Plantas"]
const UNIT_RENDER_FOLDER_SEGMENTS = ["Torre A", "Aptos individuales"]
const FLOOR_PLAN_EXTENSIONS = new Set([".avif", ".jpg", ".jpeg", ".png", ".webp"])
const DEFAULT_PLAN_SIZE = { width: 2, height: 1 }

type CsvRecord = Record<string, string>

type FloorPlanImage = NonNullable<TowerAFloorPlan["image"]>

export async function getTowerAExplorerData(): Promise<TowerAExplorerData> {
  const [units, floorPlanImages, unitRenderImages] = await Promise.all([
    readTowerAInventoryUnits(),
    readTowerAFloorPlanImages(),
    readTowerAUnitRenderImages(),
  ])
  const unitsWithRenderImages = units.map((unit) => ({
    ...unit,
    renderImage: unitRenderImages.get(unit.unitNumber) ?? null,
  }))

  return {
    csvSourceUrl: GOOGLE_SHEET_CSV_URL,
    floors: TOWER_A_FLOORS.map((floor) => ({
      floor,
      image: floorPlanImages.get(floor) ?? null,
      units: unitsWithRenderImages.filter((unit) => unit.floor === floor),
    })),
    markerMap: towerAFloorMarkers,
  }
}

async function readTowerAInventoryUnits() {
  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      return []
    }

    const csv = await response.text()
    const records = parseCsv(csv)
    const floorUnitCounts = new Map<number, number>()

    return records
      .map((record) => normalizeInventoryRecord(record))
      .filter((unit): unit is TowerAInventoryUnit => Boolean(unit))
      .sort((left, right) => {
        if (left.floor !== right.floor) {
          return left.floor - right.floor
        }

        return Number(left.listingId) - Number(right.listingId)
      })
      .map((unit) => {
        const nextUnitNumber = (floorUnitCounts.get(unit.floor) ?? 0) + 1
        floorUnitCounts.set(unit.floor, nextUnitNumber)

        return {
          ...unit,
          unitNumber: nextUnitNumber,
          unitCode: `${unit.floor}-${String(nextUnitNumber).padStart(2, "0")}`,
        }
      })
  } catch {
    return []
  }
}

function normalizeInventoryRecord(record: CsvRecord): TowerAInventoryUnit | null {
  const floor = parseNumericValue(record["Floor Number"])

  if (!floor || !TOWER_A_FLOORS.includes(floor as (typeof TOWER_A_FLOORS)[number])) {
    return null
  }

  const statusLabel = record["Listing Status"]?.trim() || "Sin estado"

  return {
    bathrooms: parseNumericValue(record.Bathrooms),
    bedrooms: parseNumericValue(record.Bedrooms),
    floor,
    furnishedStatus: cleanOptionalValue(record["Furnished Status"]),
    listingId: record["Listing ID"]?.trim() || record["Row Name"]?.trim() || "",
    marketValue: parseNumericValue(record["Market Value"]),
    orientation: cleanOptionalValue(record.Orientation),
    renderImage: null,
    rowName: record["Row Name"]?.trim() || "",
    status: normalizeStatus(statusLabel),
    statusLabel,
    totalArea: parseNumericValue(record["Total Area"]),
    unitCode: "",
    unitNumber: 0,
  }
}

function normalizeStatus(value: string): TowerAUnitStatus {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()

  if (normalized.includes("disponible") || normalized.includes("available")) {
    return "available"
  }

  if (normalized.includes("reserv")) {
    return "reserved"
  }

  if (
    normalized.includes("sold") ||
    normalized.includes("vendido") ||
    normalized.includes("vendida")
  ) {
    return "sold"
  }

  return "unknown"
}

function parseNumericValue(value: string | undefined) {
  if (!value) {
    return null
  }

  const numericValue = Number(value.replace(/[^\d.-]/g, ""))
  return Number.isFinite(numericValue) ? numericValue : null
}

function cleanOptionalValue(value: string | undefined) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : null
}

function parseCsv(csv: string): CsvRecord[] {
  const rows: string[][] = []
  let currentField = ""
  let currentRow: string[] = []
  let isQuoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]
    const nextCharacter = csv[index + 1]

    if (character === '"') {
      if (isQuoted && nextCharacter === '"') {
        currentField += '"'
        index += 1
      } else {
        isQuoted = !isQuoted
      }
      continue
    }

    if (character === "," && !isQuoted) {
      currentRow.push(currentField)
      currentField = ""
      continue
    }

    if ((character === "\n" || character === "\r") && !isQuoted) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1
      }

      currentRow.push(currentField)
      rows.push(currentRow)
      currentField = ""
      currentRow = []
      continue
    }

    currentField += character
  }

  currentRow.push(currentField)
  rows.push(currentRow)

  const [headers = [], ...bodyRows] = rows.filter((row) =>
    row.some((field) => field.trim())
  )

  return bodyRows.map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [header.trim(), row[index]?.trim() ?? ""])
    )
  )
}

async function readTowerAFloorPlanImages() {
  const directory = path.join(process.cwd(), "public", ...FLOOR_PLAN_FOLDER_SEGMENTS)
  const imagesByFloor = new Map<number, FloorPlanImage>()

  try {
    const entries = await readdir(directory, { withFileTypes: true })
    const imageEntries = entries
      .filter((entry) => entry.isFile())
      .filter((entry) => FLOOR_PLAN_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      )

    await Promise.all(
      imageEntries.map(async (entry) => {
        const floor = parseFloorFromFileName(entry.name)
        if (!floor || !TOWER_A_FLOORS.includes(floor as (typeof TOWER_A_FLOORS)[number])) {
          return
        }

        const imagePath = path.join(directory, entry.name)
        const [dimensions, imageStats] = await Promise.all([
          readImageDimensions(imagePath),
          stat(imagePath),
        ])

        if (!imagesByFloor.has(floor)) {
          imagesByFloor.set(floor, {
            alt: `Planta piso ${floor} Torre A`,
            height: dimensions.height,
            src: withFileVersion(
              toPublicPath(...FLOOR_PLAN_FOLDER_SEGMENTS, entry.name),
              imageStats.mtimeMs
            ),
            width: dimensions.width,
          })
        }
      })
    )
  } catch (error) {
    if (!isMissingDirectoryError(error)) {
      throw error
    }
  }

  return imagesByFloor
}

async function readTowerAUnitRenderImages() {
  const directory = path.join(process.cwd(), "public", ...UNIT_RENDER_FOLDER_SEGMENTS)
  const imagesByUnitNumber = new Map<number, TowerAImage>()

  try {
    const entries = await readdir(directory, { withFileTypes: true })
    const imageEntries = entries
      .filter((entry) => entry.isFile())
      .filter((entry) => FLOOR_PLAN_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      )

    await Promise.all(
      imageEntries.map(async (entry) => {
        const unitNumber = parseUnitTypeFromFileName(entry.name)
        if (!unitNumber) {
          return
        }

        const imagePath = path.join(directory, entry.name)
        const [dimensions, imageStats] = await Promise.all([
          readImageDimensions(imagePath),
          stat(imagePath),
        ])

        if (!imagesByUnitNumber.has(unitNumber)) {
          imagesByUnitNumber.set(unitNumber, {
            alt: `Render apartamento tipo ${unitNumber} Torre A`,
            height: dimensions.height,
            src: withFileVersion(
              toPublicPath(...UNIT_RENDER_FOLDER_SEGMENTS, entry.name),
              imageStats.mtimeMs
            ),
            width: dimensions.width,
          })
        }
      })
    )
  } catch (error) {
    if (!isMissingDirectoryError(error)) {
      throw error
    }
  }

  return imagesByUnitNumber
}

function parseFloorFromFileName(fileName: string) {
  const explicitMatch = fileName.match(/piso\s*[-_ ]*(\d{1,2})/i)
  const fallbackMatch = fileName.match(/(\d{1,2})/)
  const floor = Number(explicitMatch?.[1] ?? fallbackMatch?.[1] ?? 0)
  return Number.isFinite(floor) ? floor : null
}

function parseUnitTypeFromFileName(fileName: string) {
  const explicitMatch = fileName.match(/tipo\s*[-_ ]*(\d{1,2})/i)
  const fallbackMatch = fileName.match(/(\d{1,2})/)
  const unitNumber = Number(explicitMatch?.[1] ?? fallbackMatch?.[1] ?? 0)
  return Number.isFinite(unitNumber) ? unitNumber : null
}

async function readImageDimensions(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()
  const buffer = await readFile(filePath)

  if (extension === ".png") {
    if (buffer.length >= 24) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      }
    }
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    const jpegDimensions = readJpegDimensions(buffer)
    if (jpegDimensions) {
      return jpegDimensions
    }
  }

  return DEFAULT_PLAN_SIZE
}

function readJpegDimensions(buffer: Buffer) {
  let offset = 2

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = buffer[offset + 1]
    const size = buffer.readUInt16BE(offset + 2)
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc

    if (isStartOfFrame && offset + 8 < buffer.length) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      }
    }

    offset += 2 + size
  }

  return null
}

function toPublicPath(...segments: string[]) {
  return `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`
}

function withFileVersion(src: string, mtimeMs: number) {
  return `${src}?v=${Math.round(mtimeMs)}`
}

function isMissingDirectoryError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  )
}
