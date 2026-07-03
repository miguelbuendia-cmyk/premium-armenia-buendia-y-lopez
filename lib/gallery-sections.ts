import { readdir, stat } from "node:fs/promises"
import path from "node:path"

import type {
  FacadeSections,
  GalleryCard,
  GallerySections,
} from "@/lib/premium-content"

const IMAGE_EXTENSIONS = new Set([".avif", ".jpg", ".jpeg", ".png", ".webp"])

type AutoGallerySource = {
  emptyDescription: string
  emptyNote: string
  folderSegments: string[]
  idPrefix: string
  phase: string
}

const AUTO_GALLERY_SOURCES = {
  exteriores: {
    folderSegments: ["Exteriores"],
    idPrefix: "exteriores",
    phase: "Exterior",
    emptyDescription: "Imagen cargada automaticamente desde Exteriores.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
  fachadasDia: {
    folderSegments: ["Fachadas", "DIA"],
    idPrefix: "fachadas-dia",
    phase: "Dia",
    emptyDescription: "Imagen cargada automaticamente desde Fachadas/DIA.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
  fachadasNoche: {
    folderSegments: ["Fachadas", "NOCHE"],
    idPrefix: "fachadas-noche",
    phase: "Noche",
    emptyDescription: "Imagen cargada automaticamente desde Fachadas/NOCHE.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
  interiores: {
    folderSegments: ["Interiores"],
    idPrefix: "interiores",
    phase: "Interior",
    emptyDescription: "Imagen cargada automaticamente desde Interiores.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
} satisfies Record<
  "exteriores"
  | "fachadasDia"
  | "fachadasNoche"
  | "interiores",
  AutoGallerySource
>

const FACADE_DAY_FILE_NAMES = [
  "FRENTE 2 TORRE A SOLA_11zon.webp",
  "dia.2.webp",
]

export async function getGallerySections(): Promise<GallerySections> {
  const [exteriores, interiores] = await Promise.all([
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.exteriores),
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.interiores),
  ])

  return {
    exteriores,
    interiores,
  }
}

export async function getFacadeSections(): Promise<FacadeSections> {
  const [dia, noche] = await Promise.all([
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.fachadasDia, {
      includeFileNames: FACADE_DAY_FILE_NAMES,
    }),
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.fachadasNoche),
  ])

  return {
    dia,
    noche,
  }
}

async function readAutoGalleryCards(
  source: AutoGallerySource,
  options?: {
    excludeFileNames?: Set<string>
    includeFileNames?: string[]
  }
) {
  const directory = path.join(process.cwd(), "public", ...source.folderSegments)
  const includeOrder = options?.includeFileNames
    ? new Map(options.includeFileNames.map((name, index) => [name, index]))
    : null

  try {
    const entries = await readdir(directory, { withFileTypes: true })

    const imageEntries = entries
      .filter((entry) => {
        if (!entry.isFile()) {
          return false
        }

        const extension = path.extname(entry.name).toLowerCase()
        if (!IMAGE_EXTENSIONS.has(extension)) {
          return false
        }

        if (options?.excludeFileNames?.has(entry.name)) {
          return false
        }

        if (includeOrder && !includeOrder.has(entry.name)) {
          return false
        }

        return true
      })
      .sort((left, right) => {
        if (includeOrder) {
          return (
            (includeOrder.get(left.name) ?? Number.MAX_SAFE_INTEGER) -
            (includeOrder.get(right.name) ?? Number.MAX_SAFE_INTEGER)
          )
        }

        return left.name.localeCompare(right.name, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      })

    return Promise.all(
      imageEntries.map(async (entry) => {
        const fileStats = await stat(path.join(directory, entry.name))
        const cleanedTitle = cleanFileLabel(entry.name)

        return {
          id: `${source.idPrefix}-${slugify(cleanedTitle)}`,
          title: cleanedTitle,
          phase: source.phase,
          description: source.emptyDescription,
          note: source.emptyNote,
          image: {
            src: withReloadVersion(
              toPublicPath(...source.folderSegments, entry.name),
              fileStats.mtimeMs
            ),
            alt: cleanedTitle,
          },
        } satisfies GalleryCard
      })
    )
  } catch (error) {
    if (isMissingDirectoryError(error)) {
      return []
    }

    throw error
  }
}

function cleanFileLabel(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toPublicPath(...segments: string[]) {
  return `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`
}

function withReloadVersion(publicPath: string, mtimeMs: number) {
  return `${publicPath}?v=${Math.trunc(mtimeMs)}`
}

function isMissingDirectoryError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  )
}
