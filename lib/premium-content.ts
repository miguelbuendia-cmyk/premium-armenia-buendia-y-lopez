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
  hotspots: Hotspot[]
  amenities: Amenity[]
  residences: ResidenceCard[]
  gallery: GalleryCard[]
  contact: ContactInfo
  viewer: ViewerSequenceConfig
}

const torreAPositions: HotspotPosition[] = [
  { frame: 0, x: 0.46, y: 0.43 },
  { frame: 8, x: 0.48, y: 0.42 },
  { frame: 16, x: 0.49, y: 0.41 },
  { frame: 24, x: 0.46, y: 0.41 },
  { frame: 32, x: 0.4, y: 0.42 },
  { frame: 40, x: 0.34, y: 0.44 },
  { frame: 48, x: 0.3, y: 0.47 },
  { frame: 56, x: 0.31, y: 0.5 },
  { frame: 64, x: 0.37, y: 0.5 },
  { frame: 72, x: 0.43, y: 0.47 },
]

const torreCPositions: HotspotPosition[] = [
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
]

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
    location: "Ubicacion privilegiada",
    amenities: "Amenidades del proyecto",
    residences: "Inventario destacado",
    gallery: "Galeria comercial",
    contact: "Contacto comercial",
  },
  panelDescriptions: {
    overview:
      "Una lectura rapida del proyecto para abrir la conversacion antes de entrar al detalle.",
    location:
      "Argumentos breves para explicar contexto, conectividad y presencia urbana desde la misma escena.",
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
    { label: "Recorrido", value: "75 frames con drag" },
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
  hotspots: [
    {
      id: "torre-a",
      label: "Torre A",
      title: "Torre A",
      description:
        "La primera fase del conjunto, pensada para lectura residencial principal y visibilidad comercial.",
      targetFrame: 18,
      linkedResidenceId: "torre-a",
      positions: torreAPositions,
    },
    {
      id: "torre-c",
      label: "Torre C",
      title: "Torre C",
      description:
        "La fase complementaria del proyecto, integrada al relato de amenidades y experiencia del conjunto.",
      targetFrame: 25,
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
      statusNote: "Lista para vincularse con visuales finales de la zona humeda.",
      targetFrame: 12,
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
      targetFrame: 18,
    },
    {
      id: "parque-ninos",
      name: "Parque de ninos",
      shortLabel: "Parque",
      highlight: "Espacio exterior pensado para juego seguro y vida familiar.",
      description:
        "Ayuda a comunicar un proyecto pensado para familias, uso cotidiano y estancia prolongada.",
      statusNote: "Pendiente sumar escena de uso y paisajismo final.",
      targetFrame: 22,
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
      targetFrame: 28,
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
      targetFrame: 34,
    },
    {
      id: "zona-juegos",
      name: "Zona de juegos",
      shortLabel: "Juegos",
      highlight: "Area social para entretenimiento y actividades compartidas.",
      description:
        "Sirve para comunicar comunidad, permanencia y momentos de ocio dentro del conjunto.",
      statusNote: "Pendiente sumar visuales de ambientacion y mobiliario.",
      targetFrame: 42,
    },
    {
      id: "gym",
      name: "Gym",
      shortLabel: "Gym",
      highlight: "Bienestar cotidiano integrado a la propuesta residencial.",
      description:
        "Muestra una oferta activa y funcional para residentes que buscan entrenamiento sin salir del proyecto.",
      statusNote: "Pendiente incorporar visuales del equipamiento final.",
      targetFrame: 50,
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
      targetFrame: 18,
    },
    {
      id: "torre-c",
      name: "Torre C",
      format: "Residencias complementarias",
      description:
        "Una segunda fase vinculada a la experiencia del proyecto y a la lectura integral de amenidades.",
      statusNote: "Lista para brochure comercial y argumentos de cierre.",
      targetFrame: 25,
    },
    {
      id: "signature-units",
      name: "Signature units",
      format: "Plantas premium",
      description:
        "Un bloque para destacar unidades con mejores visuales, terrazas o configuraciones especiales.",
      statusNote: "Pendiente definir naming y ficha definitiva.",
      targetFrame: 31,
    },
  ],
  gallery: [
    {
      id: "campana-principal",
      title: "Hero de campana",
      phase: "Pendiente de arte final",
      description:
        "Reservado para la pieza principal de pauta, brochure o portada de presentacion comercial.",
      note: "Entrara aqui sin cambiar la navegacion ni la estructura del micrositio.",
    },
    {
      id: "interiores-clave",
      title: "Interiores clave",
      phase: "En espera de entrega",
      description:
        "Espacio destinado a lobby, fitness y zonas comunes con lectura rapida desde desktop o movil.",
      note: "El layout ya contempla tarjetas editoriales y desplazamiento suave.",
    },
    {
      id: "apoyo-comercial",
      title: "Piezas de apoyo",
      phase: "Listo para poblar",
      description:
        "Aqui podran entrar acabados, visuales complementarias o argumentos de cierre sin romper la experiencia.",
      note: "La base ya queda alineada con el look del ejemplo compartido.",
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
  viewer: {
    totalFrames: 75,
    framesDir: "/frames",
    defaultFrame: 0,
    frameScale: 1,
    sourceInsetLeft: 0.06,
    sourceInsetRight: 0.02,
    dragSensitivity: 0.45,
    autoplayTurns: 0.18,
    preloadBatchSize: 12,
    preloadTickMs: 20,
    dragHint: "Arrastra para girar la vista del proyecto",
  },
}
