export type DockSection =
  | "overview"
  | "location"
  | "amenities"
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

export type LocationMapContent = {
  title: string
  project: MapCoordinate & { label: string }
  initialView: MapCoordinate & { zoom: number }
  roads: LocationRoad[]
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
const NEXT_MAIN_TOTAL_FRAMES = 110

function scaleMainFrame(frame: number) {
  return Math.round(
    (frame * (NEXT_MAIN_TOTAL_FRAMES - 1)) / (LEGACY_MAIN_TOTAL_FRAMES - 1)
  )
}

function scaleHotspotPositions(positions: HotspotPosition[]): HotspotPosition[] {
  return positions.map((position) => ({
    ...position,
    frame: scaleMainFrame(position.frame),
  }))
}

const torreAPositions: HotspotPosition[] = scaleHotspotPositions([
  { frame: 0, x: 0.43, y: 0.39 },
  { frame: 4, x: 0.45, y: 0.385 },
  { frame: 8, x: 0.47, y: 0.38 },
  { frame: 12, x: 0.485, y: 0.38 },
  { frame: 16, x: 0.49, y: 0.382 },
  { frame: 20, x: 0.48, y: 0.388 },
  { frame: 24, x: 0.465, y: 0.395 },
  { frame: 28, x: 0.44, y: 0.402 },
  { frame: 32, x: 0.405, y: 0.412 },
  { frame: 36, x: 0.37, y: 0.425 },
  { frame: 40, x: 0.34, y: 0.44 },
  { frame: 44, x: 0.315, y: 0.455 },
  { frame: 48, x: 0.295, y: 0.47 },
  { frame: 52, x: 0.29, y: 0.485 },
  { frame: 56, x: 0.3, y: 0.495 },
  { frame: 60, x: 0.325, y: 0.495 },
  { frame: 64, x: 0.355, y: 0.485 },
  { frame: 68, x: 0.39, y: 0.465 },
  { frame: 72, x: 0.415, y: 0.44 },
])

const torreCPositions: HotspotPosition[] = scaleHotspotPositions([
  { frame: 0, x: 0.63, y: 0.52 },
  { frame: 8, x: 0.65, y: 0.51 },
  { frame: 16, x: 0.63, y: 0.51 },
  { frame: 24, x: 0.58, y: 0.5 },
  { frame: 32, x: 0.51, y: 0.5 },
  { frame: 40, x: 0.46, y: 0.51 },
  { frame: 48, x: 0.43, y: 0.53 },
  { frame: 56, x: 0.45, y: 0.56 },
  { frame: 64, x: 0.53, y: 0.56 },
  { frame: 72, x: 0.6, y: 0.54 },
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
    residences: "Inmuebles",
    gallery: "Galeria",
  },
  panelTitles: {
    overview: "Vista general",
    location: "Ubicacion",
    amenities: "Amenidades del proyecto",
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
    residences:
      "Tipologias y torres preparadas para recibir inventario comercial, brochure o material de cierre.",
    gallery:
      "Reserva el espacio para renders finales, tomas interiores y piezas de campana.",
    contact:
      "Salida directa a WhatsApp, correo o llamada para convertir interes en conversacion.",
  },
  stats: [
    { label: "Estado", value: "Lanzamiento editorial" },
    { label: "Recorrido", value: "110 frames con drag" },
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
        color: "#e39a2d",
        path: [
          { lat: 4.5756549, lng: -75.6447951 },
          { lat: 4.5757882, lng: -75.6448017 },
          { lat: 4.5760607, lng: -75.6448151 },
          { lat: 4.5761028, lng: -75.6448172 },
          { lat: 4.5765396, lng: -75.6448387 },
          { lat: 4.5766019, lng: -75.6448418 },
          { lat: 4.5768158, lng: -75.6448523 },
          { lat: 4.5769492, lng: -75.6448589 },
          { lat: 4.5770928, lng: -75.6448455 },
          { lat: 4.5772167, lng: -75.6448251 },
          { lat: 4.5773281, lng: -75.6448009 },
          { lat: 4.5775018, lng: -75.6447403 },
          { lat: 4.5775909, lng: -75.6447023 },
          { lat: 4.5776954, lng: -75.6446589 },
          { lat: 4.5777921, lng: -75.6446091 },
          { lat: 4.5781291, lng: -75.6444695 },
          { lat: 4.5784759, lng: -75.6443198 },
          { lat: 4.5787178, lng: -75.6442382 },
          { lat: 4.5788552, lng: -75.6441966 },
          { lat: 4.5790148, lng: -75.644179 },
          { lat: 4.5791462, lng: -75.6441659 },
          { lat: 4.5792741, lng: -75.6441666 },
          { lat: 4.5798403, lng: -75.6441593 },
          { lat: 4.5801025, lng: -75.6441437 },
          { lat: 4.5802406, lng: -75.6441233 },
          { lat: 4.5803806, lng: -75.6440864 },
          { lat: 4.5805302, lng: -75.6440265 },
          { lat: 4.5807228, lng: -75.6439215 },
          { lat: 4.5808875, lng: -75.643835 },
          { lat: 4.5811633, lng: -75.6436872 },
          { lat: 4.5812531, lng: -75.6436457 },
          { lat: 4.5813875, lng: -75.643591 },
          { lat: 4.5815498, lng: -75.6435442 },
          { lat: 4.5821114, lng: -75.6433828 },
          { lat: 4.5829051, lng: -75.6432482 },
          { lat: 4.5829518, lng: -75.6432392 },
        ],
      },
      {
        id: "acceso-perimetral",
        name: "Via perimetral",
        color: "#4da864",
        path: [
          { lat: 4.576042, lng: -75.64805 },
          { lat: 4.575957, lng: -75.64798 },
          { lat: 4.575886, lng: -75.64792 },
          { lat: 4.575842, lng: -75.647835 },
          { lat: 4.575899, lng: -75.647745 },
          { lat: 4.576011, lng: -75.64766 },
          { lat: 4.576119, lng: -75.647616 },
          { lat: 4.576227, lng: -75.647585 },
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
      targetFrame: scaleMainFrame(12),
      media: {
        src: "/Galeria/piscina.webp",
        alt: "Render de piscina ninos y adultos",
        placeholderLabel: "Render de piscina",
        placeholderNote:
          "Visual listo para ampliar y usar como apoyo comercial de la zona humeda.",
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
      statusNote: "Pendiente asociar render interior del espacio humedo.",
      targetFrame: scaleMainFrame(18),
      media: {
        alt: "Render del turco",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Reserva este espacio para un render interior del turco con atmosfera, luz y acabados finales.",
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
      targetFrame: scaleMainFrame(22),
      media: {
        alt: "Render del parque de ninos",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Ideal para una escena familiar con mobiliario, juego seguro y paisajismo definitivo.",
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
      targetFrame: scaleMainFrame(28),
      media: {
        src: "/Jardines.webp",
        alt: "Render de jardines",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Este espacio queda listo para un visual paisajistico que conecte amenidad y entorno verde.",
      },
    },
    {
      id: "coworking",
      name: "Coworking",
      shortLabel: "Coworking",
      highlight:
        "Espacio flexible para trabajo remoto, reuniones y productividad.",
      description:
        "Refuerza una narrativa contemporanea de residencia con soporte para trabajo diario y encuentros profesionales.",
      statusNote: "Pendiente asociar visual interior del espacio colaborativo.",
      targetFrame: scaleMainFrame(34),
      media: {
        alt: "Render de coworking",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Prepara aqui un render interior del espacio colaborativo con branding y mobiliario final.",
      },
    },
    {
      id: "zona-juegos",
      name: "Zona de juegos",
      shortLabel: "Juegos",
      highlight: "Area social para entretenimiento y actividades compartidas.",
      description:
        "Sirve para comunicar comunidad, permanencia y momentos de ocio dentro del conjunto.",
      statusNote: "Pendiente sumar visuales de ambientacion y mobiliario.",
      targetFrame: scaleMainFrame(42),
      media: {
        alt: "Render de zona de juegos",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Espacio reservado para una escena de entretenimiento con ambientacion y uso compartido.",
      },
    },
    {
      id: "gym",
      name: "Gym",
      shortLabel: "Gym",
      highlight: "Bienestar cotidiano integrado a la propuesta residencial.",
      description:
        "Muestra una oferta activa y funcional para residentes que buscan entrenamiento sin salir del proyecto.",
      statusNote: "Pendiente incorporar visuales del equipamiento final.",
      targetFrame: scaleMainFrame(50),
      media: {
        alt: "Render del gimnasio",
        placeholderLabel: "Render pendiente",
        placeholderNote:
          "Aqui podra entrar un render del gimnasio con equipamiento, luz y acabados de cierre.",
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
      id: "portada-opcion-3",
      title: "Portada principal",
      phase: "Exterior",
      description:
        "Visual hero para presentar el proyecto desde la primera pantalla comercial.",
      note: "Lista para brochure, landing y piezas de campana.",
      image: {
        src: "/Galeria/opcion 3 portada FINAL IMPRIMIR.webp",
        alt: "Portada principal del proyecto",
      },
    },
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
      id: "sala-social",
      title: "Sala principal",
      phase: "Interior",
      description:
        "Render interior para mostrar amplitud, iluminacion y acabados del espacio social.",
      note: "Pensado para reforzar vida cotidiana y sensacion premium.",
      image: {
        src: "/Galeria/sala final opcion 3.1 actualizada sin viga borrosa (1).webp",
        alt: "Render de sala principal",
      },
    },
    {
      id: "cocina",
      title: "Cocina",
      phase: "Interior",
      description:
        "Visual de cocina para apoyar la lectura de acabados, funcionalidad y diseño.",
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
    totalFrames: 110,
    framesDir: "/2WEB",
    filePrefix: "360°.",
    fileSuffix: "_resultado.webp",
    padLength: 4,
    defaultFrame: 0,
    frameScale: 1,
    sourceInsetLeft: 0,
    sourceInsetRight: 0,
    dragSensitivity: 0.45,
    autoplayTurns: 0.18,
    preloadBatchSize: 8,
    preloadTickMs: 45,
    dragHint: "Arrastra para girar la vista del proyecto",
  },
}
