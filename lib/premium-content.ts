export type DockSection =
  | "overview"
  | "location"
  | "amenities"
  | "facades"
  | "residences"
  | "gallery"

export type PanelSection = DockSection | "contact"

export type Amenity = {
  id: string
  name: string
  shortLabel: string
  highlight: string
  description: string
  statusNote: string
  targetFrame: number
  marker: {
    frame: number
    x: number
    y: number
  }
  media: {
    src?: string
    alt: string
    placeholderLabel: string
    placeholderNote: string
  }
}

export type ResidenceCard = {
  id: string
  name: string
  format: string
  description: string
  statusNote: string
  targetFrame: number
}

export type GalleryCard = {
  id: string
  title: string
  phase: string
  description: string
  note: string
  image: {
    src: string
    alt: string
  }
}

export type GallerySectionKey = "exteriores" | "interiores" | "apartamentos"

export type GallerySections = Record<GallerySectionKey, GalleryCard[]>

export type FacadeSectionKey = "dia" | "noche"

export type FacadeSections = Record<FacadeSectionKey, GalleryCard[]>

export type ContactInfo = {
  projectName: string
  advisorLabel: string
  phoneDisplay: string
  phoneHref: string
  email: string
  emailHref: string
  whatsappHref: string
  location: string
  schedule: string
}

export type ViewerSequenceConfig = {
  totalFrames: number
  framesDir: string
  filePrefix: string
  fileSuffix: string
  padLength: number
  defaultFrame: number
  frameScale: number
  sourceInsetLeft: number
  sourceInsetRight: number
  dragSensitivity: number
  autoplayTurns: number
  autoplayMinReadyFrames: number
  preloadBatchSize: number
  preloadTickMs: number
  dragHint: string
}

export type ProjectStat = {
  label: string
  value: string
}

export type LocationPoint = {
  id: string
  title: string
  description: string
}

export type HotspotPosition = {
  frame: number
  x: number
  y: number
  visible?: boolean
}

export type Hotspot = {
  id: string
  label: string
  title: string
  description: string
  targetFrame: number
  linkedResidenceId?: string
  positions: HotspotPosition[]
  visibleFrameRange?: {
    start: number
    end: number
  }
}

export type MapCoordinate = {
  lat: number
  lng: number
}

export type LocationRoad = {
  id: string
  name: string
  color: string
  path: MapCoordinate[]
}

export type LocationPoi = {
  id: string
  category: "mall" | "restaurant"
  name: string
  distanceLabel: string
  color: string
  path: MapCoordinate[]
}

export type LocationEducationPoint = {
  id: string
  category: "school" | "university"
  name: string
  distanceLabel: string
  color: string
  location: MapCoordinate
}

export type LocationMapContent = {
  title: string
  project: MapCoordinate & { label: string }
  initialView: MapCoordinate & { zoom: number }
  roads: LocationRoad[]
  pois: LocationPoi[]
  educationPoints: LocationEducationPoint[]
  terrain: {
    label: string
    fillColor: string
    strokeColor: string
    path: MapCoordinate[]
  }
}

export type ProjectContent = {
  eyebrow: string
  name: string
  tagline: string
  location: string
  status: string
  availability: string
  summary: string
  viewerHeadline: string
  viewerBody: string
  contactCtaLabel: string
  dockLabels: Record<DockSection, string>
  panelTitles: Record<PanelSection, string>
  panelDescriptions: Record<PanelSection, string>
  stats: ProjectStat[]
  locationPoints: LocationPoint[]
  locationMap: LocationMapContent
  hotspots: Hotspot[]
  amenities: Amenity[]
  residences: ResidenceCard[]
  gallery: GalleryCard[]
  contact: ContactInfo
  mainViewer: ViewerSequenceConfig
}

const LEGACY_MAIN_TOTAL_FRAMES = 75
const PREVIOUS_MAIN_TOTAL_FRAMES = 110
const NEXT_MAIN_TOTAL_FRAMES = 190
const MAIN_SOURCE_INSET_LEFT = 0.123
const MAIN_SOURCE_INSET_RIGHT = 0.123

function scaleFrame(
  frame: number,
  fromTotalFrames: number,
  toTotalFrames: number
) {
  return Math.round(
    (frame * (toTotalFrames - 1)) / Math.max(1, fromTotalFrames - 1)
  )
}

function scaleMainFrame(frame: number) {
  return scaleFrame(frame, LEGACY_MAIN_TOTAL_FRAMES, NEXT_MAIN_TOTAL_FRAMES)
}

function scalePreviousMainFrame(frame: number) {
  return scaleFrame(frame, PREVIOUS_MAIN_TOTAL_FRAMES, NEXT_MAIN_TOTAL_FRAMES)
}

function normalizeMainOverlayX(x: number) {
  const usableWidth = 1 - MAIN_SOURCE_INSET_LEFT - MAIN_SOURCE_INSET_RIGHT
  const normalized = (x - MAIN_SOURCE_INSET_LEFT) / usableWidth
  return Number(Math.max(0, Math.min(1, normalized)).toFixed(6))
}

function scaleVisibleFrameRange(range: { start: number; end: number }) {
  return {
    start: scalePreviousMainFrame(range.start),
    end: scalePreviousMainFrame(range.end),
  }
}

function frameFromSequenceName(fileName: string) {
  const match = fileName.match(/(\d{4})/)
  if (!match) {
    throw new Error(`No se pudo leer el frame desde "${fileName}"`)
  }

  return Number(match[1])
}

function scaleHotspotPositions(positions: HotspotPosition[]): HotspotPosition[] {
  return positions.map((position) => ({
    ...position,
    frame: scaleMainFrame(position.frame),
  }))
}

const torreAPositions: HotspotPosition[] = scaleHotspotPositions([
  { frame: 0, x: normalizeMainOverlayX(0.43), y: 0.39 },
  { frame: 4, x: normalizeMainOverlayX(0.45), y: 0.385 },
  { frame: 8, x: normalizeMainOverlayX(0.47), y: 0.38 },
  { frame: 12, x: normalizeMainOverlayX(0.485), y: 0.38 },
  { frame: 16, x: normalizeMainOverlayX(0.49), y: 0.382 },
  { frame: 20, x: normalizeMainOverlayX(0.48), y: 0.388 },
  { frame: 24, x: normalizeMainOverlayX(0.465), y: 0.395 },
  { frame: 28, x: normalizeMainOverlayX(0.44), y: 0.402 },
  { frame: 32, x: normalizeMainOverlayX(0.405), y: 0.412 },
  { frame: 36, x: normalizeMainOverlayX(0.37), y: 0.425 },
  { frame: 40, x: normalizeMainOverlayX(0.34), y: 0.44 },
  { frame: 44, x: normalizeMainOverlayX(0.315), y: 0.455 },
  { frame: 48, x: normalizeMainOverlayX(0.295), y: 0.47 },
  { frame: 52, x: normalizeMainOverlayX(0.29), y: 0.485 },
  { frame: 56, x: normalizeMainOverlayX(0.3), y: 0.495 },
  { frame: 60, x: normalizeMainOverlayX(0.325), y: 0.495 },
  { frame: 64, x: normalizeMainOverlayX(0.355), y: 0.485 },
  { frame: 68, x: normalizeMainOverlayX(0.39), y: 0.465 },
  { frame: 72, x: normalizeMainOverlayX(0.415), y: 0.44 },
])

const torreCPositions: HotspotPosition[] = scaleHotspotPositions([
  { frame: 0, x: normalizeMainOverlayX(0.63), y: 0.52 },
  { frame: 8, x: normalizeMainOverlayX(0.65), y: 0.51 },
  { frame: 16, x: normalizeMainOverlayX(0.63), y: 0.51 },
  { frame: 24, x: normalizeMainOverlayX(0.58), y: 0.5 },
  { frame: 32, x: normalizeMainOverlayX(0.51), y: 0.5 },
  { frame: 40, x: normalizeMainOverlayX(0.46), y: 0.51 },
  { frame: 48, x: normalizeMainOverlayX(0.43), y: 0.53 },
  { frame: 56, x: normalizeMainOverlayX(0.45), y: 0.56 },
  { frame: 64, x: normalizeMainOverlayX(0.53), y: 0.56 },
  { frame: 72, x: normalizeMainOverlayX(0.6), y: 0.54 },
])

export const premiumContent: ProjectContent = {
  eyebrow: "Residencias de altura",
  name: "Premium Armenia Buendia y Lopez",
  tagline:
    "Una portada inmersiva para presentar el proyecto desde una sola escena hero.",
  location: "Armenia, Quindio",
  status: "Vista interactiva",
  availability: "Secuencia 360 lista",
  summary:
    "Un micrositio comercial con una escena principal a pantalla completa, puntos de interes flotantes y una navegacion inferior inspirada en showroom inmobiliario.",
  viewerHeadline:
    "Explora la vista general y entra a los puntos clave desde la misma toma.",
  viewerBody:
    "El recorrido vive sobre la secuencia 360 existente, mientras la nueva interfaz organiza ubicacion, amenidades, inmuebles y galeria con una lectura mucho mas limpia.",
  contactCtaLabel: "Contactanos",
  dockLabels: {
    overview: "Inicio",
    location: "Ubicacion",
    amenities: "Amenidades",
    facades: "Fachadas",
    residences: "Inmuebles",
    gallery: "Galeria",
  },
  panelTitles: {
    overview: "Vista general",
    location: "Ubicacion",
    amenities: "Amenidades del proyecto",
    facades: "Fachadas del proyecto",
    residences: "Inventario destacado",
    gallery: "Galeria comercial",
    contact: "Contacto comercial",
  },
  panelDescriptions: {
    overview:
      "Una lectura rapida del proyecto para abrir la conversacion antes de entrar al detalle.",
    location:
      "Un modo cartografico para ubicar el proyecto en Armenia, destacar la implantacion y leer las vias de acceso cercanas.",
    amenities:
      "Cada amenidad puede enfocar la secuencia para guiar la presentacion sin cambiar de pantalla.",
    facades:
      "Un acceso directo a las carpetas de fachada dia y noche para revisar imagenes comerciales mas rapido.",
    residences:
      "Tipologias y torres preparadas para recibir inventario comercial, brochure o material de cierre.",
    gallery:
      "Reserva el espacio para renders finales, tomas interiores y piezas de campana.",
    contact:
      "Salida directa a WhatsApp, correo o llamada para convertir interes en conversacion.",
  },
  stats: [
    { label: "Estado", value: "Lanzamiento editorial" },
    { label: "Recorrido", value: "190 frames con drag" },
    { label: "Vista", value: "Hero a pantalla completa" },
  ],
  locationPoints: [
    {
      id: "entorno",
      title: "Entorno verde y abierto",
      description:
        "La composicion principal resalta un borde natural amplio, ideal para vender calma, visuales largas y sensacion de retiro.",
    },
    {
      id: "acceso",
      title: "Acceso inmediato",
      description:
        "La llegada queda conectada a vias principales y a una fachada comercial activa que ayuda a anclar el proyecto.",
    },
    {
      id: "lectura",
      title: "Lectura comercial clara",
      description:
        "Desde esta toma se entienden volumenes, implantacion y jerarquia de torres sin depender de renders adicionales.",
    },
  ],
  locationMap: {
    title: "Ubicacion",
    project: {
      lat: 4.576863,
      lng: -75.646213,
      label: "Premium Armenia Buendia y Lopez",
    },
    initialView: {
      lat: 4.5831,
      lng: -75.6503,
      zoom: 14,
    },
    terrain: {
      label: "Lote del proyecto",
      fillColor: "rgba(221, 198, 116, 0.22)",
      strokeColor: "#d2a646",
      path: [
        { lat: 4.577114, lng: -75.64642 },
        { lat: 4.577125, lng: -75.645712 },
        { lat: 4.57661, lng: -75.645739 },
        { lat: 4.576589, lng: -75.646416 },
      ],
    },
    roads: [
      {
        id: "via-armenia-pereira",
        name: "Via Armenia - Pereira",
        color: "#d6a33a",
        path: [
          { lat: 4.573982, lng: -75.643984 },
          { lat: 4.575201, lng: -75.643908 },
          { lat: 4.576514, lng: -75.643821 },
          { lat: 4.577861, lng: -75.643707 },
          { lat: 4.579226, lng: -75.643511 },
          { lat: 4.580554, lng: -75.643214 },
          { lat: 4.581823, lng: -75.642871 },
        ],
      },
      {
        id: "acceso-principal",
        name: "Acceso",
        color: "#d93b35",
        path: [
          { lat: 4.576343, lng: -75.646606 },
          { lat: 4.576616, lng: -75.646344 },
        ],
      },
    ],
    pois: [
      {
        id: "restaurante-el-solar",
        category: "restaurant",
        name: "Restaurante el solar",
        distanceLabel: "2.1 km",
        color: "#cf6540",
        path: [
          { lat: 4.59155, lng: -75.64089 },
          { lat: 4.591908, lng: -75.640814 },
          { lat: 4.591837, lng: -75.640593 },
          { lat: 4.591464, lng: -75.640698 },
        ],
      },
      {
        id: "mall-campestre",
        category: "mall",
        name: "Mall Campestre",
        distanceLabel: "600 m",
        color: "#5b8a5f",
        path: [
          { lat: 4.573313, lng: -75.646945 },
          { lat: 4.573846, lng: -75.646678 },
          { lat: 4.574125, lng: -75.647155 },
          { lat: 4.573859, lng: -75.647303 },
        ],
      },
      {
        id: "mall-portico",
        category: "mall",
        name: "Mall Portico",
        distanceLabel: "200 m",
        color: "#3f7fd8",
        path: [
          { lat: 4.574304, lng: -75.645676 },
          { lat: 4.574642, lng: -75.645165 },
          { lat: 4.574178, lng: -75.6451 },
          { lat: 4.573955, lng: -75.645254 },
        ],
      },
    ],
    educationPoints: [
      {
        id: "universidad-antonio-narino",
        category: "university",
        name: "Universidad Antonio Nari\u00F1o",
        distanceLabel: "290m",
        color: "#7a5ce0",
        location: {
          lat: 4.577247629672778,
          lng: -75.6450332430679,
        },
      },
      {
        id: "gi-school",
        category: "school",
        name: "GI School",
        distanceLabel: "2,42Km",
        color: "#4b82d9",
        location: {
          lat: 4.59532013542859,
          lng: -75.63482497533205,
        },
      },
      {
        id: "colegio-san-luis-rey",
        category: "school",
        name: "Colegio San Luis Rey",
        distanceLabel: "641m",
        color: "#3fa26d",
        location: {
          lat: 4.57148006987282,
          lng: -75.64737730604907,
        },
      },
    ],
  },
  hotspots: [
    {
      id: "torre-a",
      label: "Torre A",
      title: "Torre A",
      description:
        "La primera fase del conjunto, pensada para lectura residencial principal y visibilidad comercial.",
      targetFrame: scaleMainFrame(18),
      linkedResidenceId: "torre-a",
      positions: torreAPositions,
      visibleFrameRange: scaleVisibleFrameRange({
        start: 103,
        end: 13,
      }),
    },
    {
      id: "torre-c",
      label: "Torre C",
      title: "Torre C",
      description:
        "La fase complementaria del proyecto, integrada al relato de amenidades y experiencia del conjunto.",
      targetFrame: scaleMainFrame(25),
      linkedResidenceId: "torre-c",
      positions: torreCPositions,
      visibleFrameRange: scaleVisibleFrameRange({
        start: 103,
        end: 13,
      }),
    },
  ],
  amenities: [
    {
      id: "piscina",
      name: "Piscina ninos y adultos",
      shortLabel: "Piscina",
      highlight: "Zona acuatica principal para descanso familiar y permanencia.",
      description:
        "Presenta una amenidad de uso mixto que ayuda a vender bienestar, reunion familiar y tiempo libre dentro del proyecto.",
      statusNote: "Render listo para presentar la zona humeda dentro del recorrido principal.",
      targetFrame: frameFromSequenceName("360\u00B0.0107"),
      marker: {
        frame: frameFromSequenceName("360\u00B0.0107"),
        x: normalizeMainOverlayX(0.7),
        y: 0.779,
      },
      media: {
        src: "/Galeria/piscina.webp",
        alt: "Render de piscina ninos y adultos",
        placeholderLabel: "Render de piscina",
        placeholderNote:
          "Visual listo para ampliar y usar como apoyo comercial de la zona humeda.",
      },
    },
    {
      id: "jardines",
      name: "Jardines",
      shortLabel: "Jardines",
      highlight:
        "Paisajismo y zonas verdes como parte de la experiencia general.",
      description:
        "Los jardines amplifican la sensacion de calma y conectan visualmente el proyecto con el entorno natural.",
      statusNote: "Pendiente integrar renders con vegetacion definitiva.",
      targetFrame: frameFromSequenceName("360\u00B0.0135"),
      marker: {
        frame: frameFromSequenceName("360\u00B0.0135"),
        x: normalizeMainOverlayX(0.6),
        y: 0.74,
      },
      media: {
        src: "/Jardines.webp",
        alt: "Render de jardines",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Este espacio queda listo para un visual paisajistico que conecte amenidad y entorno verde.",
      },
    },
    {
      id: "gym",
      name: "Gym",
      shortLabel: "Gym",
      highlight: "Bienestar cotidiano integrado a la propuesta residencial.",
      description:
        "Un espacio disenado para el bienestar, la energia y la constancia.",
      statusNote: "",
      targetFrame: frameFromSequenceName("360\u00B0.0105"),
      marker: {
        frame: frameFromSequenceName("360\u00B0.0105"),
        x: normalizeMainOverlayX(0.7),
        y: 0.725,
      },
      media: {
        src: "/GYM.webp",
        alt: "Render del gimnasio",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Aqui podra entrar un render del gimnasio con equipamiento, luz y acabados de cierre.",
      },
    },
    {
      id: "zona-juegos",
      name: "Zona de juegos",
      shortLabel: "Juegos",
      highlight: "Area social para entretenimiento y actividades compartidas.",
      description:
        "Zona de juegos con ping pong, futbolito y billar para compartir y disfrutar.",
      statusNote: "",
      targetFrame: frameFromSequenceName("360\u00B0.0096"),
      marker: {
        frame: frameFromSequenceName("360\u00B0.0096"),
        x: normalizeMainOverlayX(0.637),
        y: 0.76,
      },
      media: {
        src: "/ZONA%20DE%20JUEGOS.webp",
        alt: "Render de zona de juegos",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Espacio reservado para una escena de entretenimiento con ambientacion y uso compartido.",
      },
    },
    {
      id: "coworking",
      name: "Coworking",
      shortLabel: "Coworking",
      highlight:
        "Espacio flexible para trabajo remoto, reuniones y productividad.",
      description:
        "Trabaja sin desplazarte en un ambiente comodo y profesional.",
      statusNote: "",
      targetFrame: frameFromSequenceName("360\u00B0.0107"),
      marker: {
        frame: frameFromSequenceName("360\u00B0.0107"),
        x: normalizeMainOverlayX(0.639),
        y: 0.735,
      },
      media: {
        src: "/COWORKING.webp",
        alt: "Render de coworking",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Prepara aqui un render interior del espacio colaborativo con branding y mobiliario final.",
      },
    },
    {
      id: "parque-ninos",
      name: "Parque de ninos",
      shortLabel: "Parque",
      highlight: "Espacio exterior pensado para juego seguro y vida familiar.",
      description:
        "Ayuda a comunicar un proyecto pensado para familias, uso cotidiano y estancia prolongada.",
      statusNote: "Pendiente sumar escena de uso y paisajismo final.",
      targetFrame: frameFromSequenceName("360\u00B0.0064"),
      marker: {
        frame: frameFromSequenceName("360\u00B0.0064"),
        x: normalizeMainOverlayX(0.46),
        y: 0.75,
      },
      media: {
        src: "/Turco.webp",
        alt: "Render del parque de ninos",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Ideal para una escena familiar con mobiliario, juego seguro y paisajismo definitivo.",
      },
    },
    {
      id: "turco",
      name: "Turco",
      shortLabel: "Turco",
      highlight:
        "Un complemento de bienestar orientado a relajacion y recuperacion.",
      description:
        "Se integra como argumento premium para reforzar la experiencia de descanso y el valor percibido del conjunto.",
      statusNote: "Rotacion focal sin tarjeta de render en esta etapa.",
      targetFrame: frameFromSequenceName("360\u00B0.0108"),
      marker: {
        frame: frameFromSequenceName("360\u00B0.0108"),
        x: normalizeMainOverlayX(0.655),
        y: 0.694,
      },
      media: {
        src: "/Parque%20ni%C3%B1os.webp",
        alt: "Visual de turco",
        placeholderLabel: "Sin render",
        placeholderNote:
          "Turco rota la secuencia para enfocar su zona, sin abrir tarjeta lateral.",
      },
    },
  ],
  residences: [
    {
      id: "torre-a",
      name: "Torre A",
      format: "Residencias principales",
      description:
        "La fase inicial del proyecto, preparada para comunicar implantacion, acceso y valor de conjunto.",
      statusNote: "Lista para poblar con metrajes, rangos y disponibilidad.",
      targetFrame: scaleMainFrame(18),
    },
    {
      id: "torre-c",
      name: "Torre C",
      format: "Residencias complementarias",
      description:
        "Una segunda fase vinculada a la experiencia del proyecto y a la lectura integral de amenidades.",
      statusNote: "Lista para brochure comercial y argumentos de cierre.",
      targetFrame: scaleMainFrame(25),
    },
    {
      id: "signature-units",
      name: "Signature units",
      format: "Plantas premium",
      description:
        "Un bloque para destacar unidades con mejores visuales, terrazas o configuraciones especiales.",
      statusNote: "Pendiente definir naming y ficha definitiva.",
      targetFrame: scaleMainFrame(31),
    },
  ],
  gallery: [
    {
      id: "portada-opcion-2",
      title: "Portada alternativa",
      phase: "Exterior",
      description:
        "Segunda opcion de fachada para comparar tono, encuadre y jerarquia visual.",
      note: "Funciona como alternativa editorial o visual comparativo.",
      image: {
        src: "/Galeria/Portada opcion 2 carpeta.webp",
        alt: "Portada alternativa del proyecto",
      },
    },
    {
      id: "cocina",
      title: "Cocina",
      phase: "Interior",
      description:
        "Visual de cocina para apoyar la lectura de acabados, funcionalidad y dise\u00F1o.",
      note: "Ideal para fichas comerciales y carruseles de interiores.",
      image: {
        src: "/Galeria/cocina frente 3.webp",
        alt: "Render de cocina",
      },
    },
    {
      id: "zona-social",
      title: "Zona social posterior",
      phase: "Interior",
      description:
        "Vista complementaria del area social para mostrar profundidad y continuidad espacial.",
      note: "Refuerza la lectura del apartamento desde otro angulo.",
      image: {
        src: "/Galeria/atras zona social.webp",
        alt: "Render posterior de zona social",
      },
    },
    {
      id: "habitacion",
      title: "Habitacion",
      phase: "Interior",
      description:
        "Escena interior para completar la galeria con una lectura mas residencial y privada.",
      note: "Sirve para balancear la galeria entre exterior e interior.",
      image: {
        src: "/Galeria/solawebpg.webp",
        alt: "Render interior de habitacion",
      },
    },
  ],
  contact: {
    projectName: "Premium Armenia Buendia y Lopez",
    advisorLabel: "Equipo comercial",
    phoneDisplay: "+57 300 000 0000",
    phoneHref: "tel:+573000000000",
    email: "info@proyecto.com",
    emailHref: "mailto:info@proyecto.com",
    whatsappHref: "https://wa.me/573000000000",
    location: "Armenia, Quindio",
    schedule: "Atencion de lunes a sabado, previa cita.",
  },
  mainViewer: {
    totalFrames: 190,
    framesDir: "/2579WPG",
    filePrefix: "360\u00B0.",
    fileSuffix: "_resultado.webp",
    padLength: 4,
    defaultFrame: 0,
    frameScale: 1,
    sourceInsetLeft: MAIN_SOURCE_INSET_LEFT,
    sourceInsetRight: MAIN_SOURCE_INSET_RIGHT,
    dragSensitivity: 0.45,
    autoplayTurns: 0,
    autoplayMinReadyFrames: 20,
    preloadBatchSize: 8,
    preloadTickMs: 45,
    dragHint: "Arrastra para girar la vista del proyecto",
  },
}
