import { readdir } from "node:fs/promises"
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
  folderName: string
  idPrefix: string
  phase: string
}

const AUTO_GALLERY_SOURCES = {
  apartamentos: {
    folderName: "Aptos Tipos",
    idPrefix: "aptos-tipos",
    phase: "Apartamento",
    emptyDescription: "Imagen cargada automaticamente desde Aptos Tipos.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
  exterioresBase: {
    folderName: "Galeria",
    idPrefix: "galeria",
    phase: "Exterior",
    emptyDescription: "Imagen cargada automaticamente desde Galeria.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
  exterioresExtra: {
    folderName: "Galeria.2",
    idPrefix: "galeria-2",
    phase: "Exterior",
    emptyDescription: "Imagen cargada automaticamente desde Galeria.2.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
  fachadasDia: {
    folderName: "Galeria.2",
    idPrefix: "fachadas-dia",
    phase: "Dia",
    emptyDescription: "Imagen cargada automaticamente desde Galeria.2.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
  fachadasNoche: {
    folderName: "Galeria.2",
    idPrefix: "fachadas-noche",
    phase: "Noche",
    emptyDescription: "Imagen cargada automaticamente desde Galeria.2.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
  interiores: {
    folderName: "Interiores",
    idPrefix: "interiores",
    phase: "Interior",
    emptyDescription: "Imagen cargada automaticamente desde Interiores.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
} satisfies Record<
  | "apartamentos"
  | "exterioresBase"
  | "exterioresExtra"
  | "fachadasDia"
  | "fachadasNoche"
  | "interiores",
  AutoGallerySource
>

const FACADE_DAY_FILE_NAMES = [
  "FRENTE 2 TORRE A SOLA_11zon.webp",
  "dia.2.webp",
]

const FACADE_NIGHT_FILE_NAMES = [
  "noche.2.webp",
  "noche.webp",
]

const FACADE_FILE_NAMES = new Set([
  ...FACADE_DAY_FILE_NAMES,
  ...FACADE_NIGHT_FILE_NAMES,
])

const EXTERIORES_HIDDEN_FILE_NAMES = new Set([
  "Portada opcion 2 carpeta.webp",
])

export async function getGallerySections(): Promise<GallerySections> {
  const [exterioresBase, exterioresExtra, interiores, apartamentos] = await Promise.all([
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.exterioresBase, {
      excludeFileNames: EXTERIORES_HIDDEN_FILE_NAMES,
    }),
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.exterioresExtra, {
      excludeFileNames: FACADE_FILE_NAMES,
    }),
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.interiores),
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.apartamentos),
  ])

  return {
    exteriores: [...exterioresBase, ...exterioresExtra],
    interiores,
    apartamentos,
  }
}

export async function getFacadeSections(): Promise<FacadeSections> {
  const [dia, noche] = await Promise.all([
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.fachadasDia, {
      includeFileNames: FACADE_DAY_FILE_NAMES,
    }),
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.fachadasNoche, {
      includeFileNames: FACADE_NIGHT_FILE_NAMES,
    }),
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
  const directory = path.join(process.cwd(), "public", source.folderName)
  const includeOrder = options?.includeFileNames
    ? new Map(options.includeFileNames.map((name, index) => [name, index]))
    : null

  try {
    const entries = await readdir(directory, { withFileTypes: true })

    return entries
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
      .map((entry) => {
        const cleanedTitle = cleanFileLabel(entry.name)

        return {
          id: `${source.idPrefix}-${slugify(cleanedTitle)}`,
          title: cleanedTitle,
          phase: source.phase,
          description: source.emptyDescription,
          note: source.emptyNote,
          image: {
            src: toPublicPath(source.folderName, entry.name),
            alt: cleanedTitle,
          },
        } satisfies GalleryCard
      })
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

function isMissingDirectoryError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  )
}
