export interface TourHotspot {
  target: string
  yaw: number
  pitch: number
}

export interface TourSpace {
  id: string
  name: string
  image: string
  image4k: string
  preview: string
  initialYaw: number
  hotspots: TourHotspot[]
}

export interface ApartmentTour {
  slug: string
  unitNumber: number
  title: string
  start: string
  spaces: TourSpace[]
}

function spaceImages(slug: string, id: string) {
  const base = `/tours/${slug}/${id}`
  return {
    image: `${base}.webp`,
    image4k: `${base}-4k.webp`,
    preview: `${base}-preview.webp`,
  }
}

export const apartmentTours: ApartmentTour[] = [
  {
    slug: "tipo-5",
    unitNumber: 5,
    title: "Apartamento Tipo 5",
    start: "entrada",
    spaces: [
      {
        id: "entrada",
        name: "Entrada",
        ...spaceImages("tipo-5", "entrada"),
        initialYaw: -10,
        hotspots: [
          { target: "sala", yaw: -10, pitch: -22 },
          { target: "cuarto-principal", yaw: 3, pitch: -20 },
          { target: "bano", yaw: 69, pitch: -42 },
          { target: "home-office", yaw: 88, pitch: -40 },
        ],
      },
      {
        id: "sala",
        name: "Sala – Comedor",
        ...spaceImages("tipo-5", "sala"),
        initialYaw: -30,
        hotspots: [
          { target: "cuarto-principal", yaw: 25, pitch: -33 },
          { target: "bano", yaw: 125, pitch: -24 },
          { target: "home-office", yaw: 135, pitch: -18 },
          { target: "entrada", yaw: 156, pitch: -22 },
        ],
      },
      {
        id: "cuarto-principal",
        name: "Cuarto principal",
        ...spaceImages("tipo-5", "cuarto-principal"),
        initialYaw: 0,
        hotspots: [{ target: "sala", yaw: -125, pitch: -52 }],
      },
      {
        id: "bano",
        name: "Baño",
        ...spaceImages("tipo-5", "bano"),
        initialYaw: 0,
        hotspots: [
          { target: "entrada", yaw: -95, pitch: -44 },
          { target: "home-office", yaw: 166, pitch: -47 },
        ],
      },
      {
        id: "home-office",
        name: "Home office",
        ...spaceImages("tipo-5", "home-office"),
        initialYaw: 10,
        hotspots: [
          { target: "bano", yaw: -85, pitch: -54 },
          { target: "sala", yaw: -153, pitch: -24 },
          { target: "entrada", yaw: 150, pitch: -46 },
        ],
      },
    ],
  },
  {
    slug: "tipo-6",
    unitNumber: 6,
    title: "Apartamento Tipo 6",
    start: "entrada",
    spaces: [
      {
        id: "entrada",
        name: "Entrada",
        ...spaceImages("tipo-6", "entrada"),
        initialYaw: 5,
        hotspots: [
          { target: "sala", yaw: 9, pitch: -26 },
          { target: "cuarto-principal", yaw: -6, pitch: -21 },
          { target: "bano", yaw: -95, pitch: -42 },
          { target: "alcoba-2", yaw: -121, pitch: -44 },
        ],
      },
      {
        id: "sala",
        name: "Sala – Comedor",
        ...spaceImages("tipo-6", "sala"),
        initialYaw: 30,
        hotspots: [
          { target: "cuarto-principal", yaw: -32, pitch: -32 },
          { target: "bano", yaw: -118, pitch: -24 },
          { target: "alcoba-2", yaw: -132, pitch: -22 },
          { target: "entrada", yaw: -158, pitch: -20 },
        ],
      },
      {
        id: "cuarto-principal",
        name: "Cuarto principal",
        ...spaceImages("tipo-6", "cuarto-principal"),
        initialYaw: 0,
        hotspots: [{ target: "sala", yaw: 95, pitch: -50 }],
      },
      {
        id: "bano",
        name: "Baño",
        ...spaceImages("tipo-6", "bano"),
        initialYaw: 15,
        hotspots: [
          { target: "sala", yaw: 95, pitch: -28 },
          { target: "entrada", yaw: 140, pitch: -42 },
          { target: "alcoba-2", yaw: -157, pitch: -46 },
        ],
      },
      {
        id: "alcoba-2",
        name: "Alcoba 2",
        ...spaceImages("tipo-6", "alcoba-2"),
        initialYaw: 8,
        hotspots: [
          { target: "bano", yaw: 80, pitch: -47 },
          { target: "entrada", yaw: 117, pitch: -44 },
          { target: "sala", yaw: 150, pitch: -25 },
        ],
      },
    ],
  },
  {
    slug: "tipo-7",
    unitNumber: 7,
    title: "Apartamento Tipo 7",
    start: "entrada",
    spaces: [
      {
        id: "entrada",
        name: "Entrada",
        ...spaceImages("tipo-7", "entrada"),
        initialYaw: -10,
        hotspots: [
          { target: "sala", yaw: -10, pitch: -22 },
          { target: "bano-social", yaw: 36, pitch: -13 },
        ],
      },
      {
        id: "sala",
        name: "Sala – Comedor",
        ...spaceImages("tipo-7", "sala"),
        initialYaw: -30,
        hotspots: [
          { target: "entrada", yaw: 24, pitch: -24 },
          { target: "bano-social", yaw: 100, pitch: -56 },
          { target: "alcoba-2", yaw: -148, pitch: -30 },
        ],
      },
      {
        id: "bano-social",
        name: "Baño social",
        ...spaceImages("tipo-7", "bano-social"),
        initialYaw: 0,
        hotspots: [
          { target: "sala", yaw: -112, pitch: -38 },
          { target: "entrada", yaw: 152, pitch: -44 },
        ],
      },
      {
        id: "alcoba-2",
        name: "Alcoba 2",
        ...spaceImages("tipo-7", "alcoba-2"),
        initialYaw: -10,
        hotspots: [
          { target: "sala", yaw: -135, pitch: -24 },
          { target: "bano-social", yaw: -88, pitch: -40 },
        ],
      },
      {
        id: "cuarto-principal",
        name: "Cuarto principal",
        ...spaceImages("tipo-7", "cuarto-principal"),
        initialYaw: -30,
        hotspots: [
          { target: "bano-principal", yaw: 14, pitch: -47 },
          { target: "sala", yaw: 100, pitch: -32 },
        ],
      },
      {
        id: "bano-principal",
        name: "Baño principal",
        ...spaceImages("tipo-7", "bano-principal"),
        initialYaw: 0,
        hotspots: [{ target: "cuarto-principal", yaw: -112, pitch: -44 }],
      },
    ],
  },
]

export function getTourBySlug(slug: string) {
  return apartmentTours.find((tour) => tour.slug === slug) ?? null
}

export function getTourByUnitNumber(unitNumber: number) {
  return apartmentTours.find((tour) => tour.unitNumber === unitNumber) ?? null
}
