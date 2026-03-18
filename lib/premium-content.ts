export type PanelSection = "amenities" | "gallery" | "contact"

export type Amenity = {
  id: string
  name: string
  shortLabel: string
  highlight: string
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
  dragSensitivity: number
  autoplayTurns: number
  preloadBatchSize: number
  preloadTickMs: number
  dragHint: string
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
  railNote: string
  panelTitles: Record<PanelSection, string>
  panelDescriptions: Record<PanelSection, string>
  amenities: Amenity[]
  gallery: GalleryCard[]
  contact: ContactInfo
  viewer: ViewerSequenceConfig
}

export const premiumContent: ProjectContent = {
  eyebrow: "Colección residencial",
  name: "Premium Armenia Buendía y López",
  tagline: "Una vitrina inmersiva para presentar el proyecto con presencia, calma y precisión.",
  location: "Armenia, Quindío",
  status: "Vista previa curada",
  availability: "Secuencia 360 activa",
  summary:
    "Un recorrido digital de tono editorial para ventas privadas: arquitectura cálida, interfaz contenida y una vista 360 que concentra toda la atención.",
  viewerHeadline: "Recorre la volumetría y cambia de enfoque sin salir de la misma escena.",
  viewerBody:
    "La experiencia principal vive en una secuencia real de 75 cuadros. El resto del sistema se diseñó para acompañar la presentación comercial mientras llegan los renders finales.",
  railNote:
    "Primera versión del micrositio. Las amenidades ya enfocan la secuencia; la galería queda preparada para recibir material definitivo.",
  panelTitles: {
    amenities: "Amenidades",
    gallery: "Galería",
    contact: "Contacto",
  },
  panelDescriptions: {
    amenities:
      "Selecciona una amenidad para llevar la cámara a un punto sugerido y revisar el relato comercial de cada espacio.",
    gallery:
      "El módulo queda listo para recibir renders de apoyo, tomas interiores o piezas de campaña sin tocar la estructura.",
    contact:
      "Un cierre comercial directo, con acceso inmediato a WhatsApp y correo para continuar la conversación desde esta misma presentación.",
  },
  amenities: [
    {
      id: "piscina",
      name: "Piscina",
      shortLabel: "Piscina",
      highlight: "Relajación exterior con lectura clara desde la vista general.",
      description:
        "Pensada como un remate visual de bienestar, la piscina introduce un momento de pausa dentro del recorrido y ayuda a explicar el carácter aspiracional del proyecto.",
      statusNote: "Pendiente incorporar renders cerrados y detalles de mobiliario.",
      targetFrame: 14,
    },
    {
      id: "lobby",
      name: "Lobby",
      shortLabel: "Lobby",
      highlight: "El punto de llegada que fija el tono de hospitalidad.",
      description:
        "La narrativa del acceso se concentra en materiales sobrios, iluminación contenida y una recepción que comunica orden, confianza y presencia de marca.",
      statusNote: "Pendiente sumar perspectiva interior de acceso principal.",
      targetFrame: 28,
    },
    {
      id: "gimnasio",
      name: "Gimnasio",
      shortLabel: "Gimnasio",
      highlight: "Bienestar cotidiano integrado al lenguaje del proyecto.",
      description:
        "La propuesta presenta el gimnasio como una extensión natural de la rutina residencial: funcional, limpio y con identidad visual coherente con el conjunto.",
      statusNote: "Pendiente incorporar visuales de equipamiento y ambientación.",
      targetFrame: 49,
    },
    {
      id: "zona-social",
      name: "Zona social",
      shortLabel: "Zona social",
      highlight: "Un espacio pensado para encuentros más que para circulación.",
      description:
        "Esta amenidad se describe como el corazón compartido del proyecto, ideal para mostrar valor de convivencia, eventos pequeños y vida comunitaria.",
      statusNote: "Pendiente agregar renders de uso y escenas con atmósfera.",
      targetFrame: 63,
    },
  ],
  gallery: [
    {
      id: "campana-principal",
      title: "Render hero de campaña",
      phase: "Pendiente de arte final",
      description:
        "Reservado para la pieza principal de comunicación, lista para abrir pauta, brochure o portada de presentación comercial.",
      note: "Se integrará aquí sin cambiar la navegación ni el comportamiento del shell.",
    },
    {
      id: "interiores-clave",
      title: "Interiores clave",
      phase: "En espera de entrega",
      description:
        "Espacio destinado a lobby, gimnasio y zonas comunes con composición vertical para lectura rápida desde escritorio o móvil.",
      note: "El diseño ya contempla tarjetas editoriales y desplazamiento fluido.",
    },
    {
      id: "apoyo-comercial",
      title: "Piezas de apoyo comercial",
      phase: "Listo para poblar",
      description:
        "Aquí podrán entrar vistas complementarias, acabados o argumentos visuales de cierre sin romper la jerarquía de la experiencia.",
      note: "La estructura funciona aunque el proyecto siga creciendo en activos.",
    },
  ],
  contact: {
    projectName: "Premium Armenia Buendía y López",
    advisorLabel: "Equipo comercial",
    phoneDisplay: "+57 300 000 0000",
    phoneHref: "tel:+573000000000",
    email: "info@proyecto.com",
    emailHref: "mailto:info@proyecto.com",
    whatsappHref: "https://wa.me/573000000000",
    location: "Armenia, Quindío",
    schedule: "Atención de lunes a sábado, previa cita.",
  },
  viewer: {
    totalFrames: 75,
    framesDir: "/frames",
    defaultFrame: 0,
    frameScale: 0.8,
    dragSensitivity: 0.45,
    autoplayTurns: 0.18,
    preloadBatchSize: 12,
    preloadTickMs: 20,
    dragHint: "Arrastra para girar la vista del proyecto",
  },
}
