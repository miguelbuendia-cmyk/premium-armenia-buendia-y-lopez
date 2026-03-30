import { readdir } from "node:fs/promises"
import path from "node:path"

import type { GalleryCard, GallerySections } from "@/lib/premium-content"

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
  interiores: {
    folderName: "Interiores",
    idPrefix: "interiores",
    phase: "Interior",
    emptyDescription: "Imagen cargada automaticamente desde Interiores.",
    emptyNote: "Titulo generado desde el nombre del archivo.",
  },
} satisfies Record<
  "apartamentos" | "exterioresBase" | "exterioresExtra" | "interiores",
  AutoGallerySource
>

export async function getGallerySections(): Promise<GallerySections> {
  const [exterioresBase, exterioresExtra, interiores, apartamentos] = await Promise.all([
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.exterioresBase),
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.exterioresExtra),
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.interiores),
    readAutoGalleryCards(AUTO_GALLERY_SOURCES.apartamentos),
  ])

  return {
    exteriores: [...exterioresBase, ...exterioresExtra],
    interiores,
    apartamentos,
  }
}

async function readAutoGalleryCards(source: AutoGallerySource) {
  const directory = path.join(process.cwd(), "public", source.folderName)

  try {
    const entries = await readdir(directory, { withFileTypes: true })

    return entries
      .filter((entry) => {
        if (!entry.isFile()) {
          return false
        }

        const extension = path.extname(entry.name).toLowerCase()
        return IMAGE_EXTENSIONS.has(extension)
      })
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      )
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
