"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import {
  createElement,
  startTransition,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react"
import {
  ArrowLeft,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Dumbbell,
  Ellipsis,
  FlameKindling,
  Gamepad2,
  GlassWater,
  GraduationCap,
  Images,
  Landmark,
  Leaf,
  MapPinned,
  Maximize2,
  MessageCircleMore,
  Phone,
  PawPrint,
  Route,
  SprayCan,
  Sparkles,
  TentTree,
  Trees,
  VenetianMask,
  WavesLadder,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type {
  Amenity,
  DockSection,
  FacadeSectionKey,
  FacadeSections,
  GalleryCard,
  GallerySectionKey,
  GallerySections,
  Hotspot,
  HotspotPosition,
  LocationEducationPoint,
  LocationPoi,
  LocationRouteState,
  LocationRoad,
  PanelSection,
  ProjectContent,
  ResidenceCard,
} from "@/lib/premium-content"

import {
  SequenceViewer,
  type SequenceViewportGeometry,
} from "./sequence-viewer"

const LocationMap = dynamic(
  () => import("./location-map").then((module) => module.LocationMap),
  { ssr: false }
)

type PropertyShellProps = {
  content: ProjectContent
  facadeSections: FacadeSections
  gallerySections: GallerySections
  onViewerLoadingStateChange?: (state: {
    completedCount: number
    hasInitialFrame: boolean
    isReady: boolean
    loadingPct: number
  }) => void
  suppressViewerLoadingOverlay?: boolean
}

const dockSections: DockSection[] = [
  "overview",
  "location",
  "amenities",
  "gallery",
  "facades",
]

const dockIcons = {
  overview: Sparkles,
  location: MapPinned,
  amenities: Trees,
  facades: Landmark,
  residences: Building2,
  gallery: Images,
} satisfies Record<DockSection, typeof Sparkles>

const amenityIcons = {
  piscina: WavesLadder,
  turco: SprayCan,
  "parque-ninos": TentTree,
  jardines: Leaf,
  bbq: FlameKindling,
  "zona-mascotas": PawPrint,
  coworking: Building2,
  "zona-juegos": Gamepad2,
  "zona-lectura": BookOpen,
  gym: Dumbbell,
} as const

const amenityMediaDimensions = {
  "/Galeria/piscina.webp": { width: 5760, height: 3654 },
  "/Jardines.webp": { width: 5760, height: 3654 },
  "/7-BBQ.webp": { width: 3500, height: 1750 },
  "/8-PARQUE-DE-PERROS.webp": { width: 3500, height: 2190 },
  "/GYM.webp": { width: 3500, height: 2190 },
  "/zona-de-lectura.webp": { width: 5504, height: 3072 },
  "/ZONA%20DE%20JUEGOS.webp": { width: 3500, height: 2190 },
  "/COWORKING.webp": { width: 3500, height: 2190 },
  "/Turco.webp": { width: 2230, height: 990 },
  "/Parque%20ni%C3%B1os.webp": { width: 2680, height: 2065 },
} as const

const gallerySectionMeta = {
  exteriores: {
    badge: "Visuales urbanas",
    description: "Fachadas, implantacion y escenas exteriores cargadas desde Galeria y Galeria.2.",
    empty: "Aun no hay imagenes en Exteriores.",
    title: "Exteriores",
  },
  interiores: {
    badge: "Espacios interiores",
    description: "Recorrido de ambientes interiores cargados desde la carpeta Interiores.",
    empty: "Aun no hay imagenes en Interiores.",
    title: "Interiores",
  },
  apartamentos: {
    badge: "Planos y tipos",
    description: "Recorrido editorial para revisar distribuciones, plantas y configuraciones residenciales.",
    empty: "Aun no hay imagenes en Aptos Tipos.",
    title: "Apartamentos",
  },
} satisfies Record<
  GallerySectionKey,
  { badge: string; description: string; empty: string; title: string }
>

const galleryFolderOrder: GallerySectionKey[] = [
  "exteriores",
  "interiores",
  "apartamentos",
]

const facadeSectionMeta = {
  dia: {
    badge: "Fachadas dia",
    coverImageSrc: "/Galeria.2/dia.2.webp",
    description: "Imagenes de fachada con luz natural para lectura comercial y urbana.",
    empty: "Aun no hay imagenes en la carpeta DIA.",
    minimalHeader: true,
    title: "DIA",
  },
  noche: {
    badge: "Fachadas noche",
    coverImageSrc: "/Galeria.2/noche.2.webp",
    description: "Imagenes de fachada nocturna para revisar atmosfera e iluminacion del proyecto.",
    empty: "Aun no hay imagenes en la carpeta NOCHE.",
    minimalHeader: true,
    title: "NOCHE",
  },
} satisfies Record<
  FacadeSectionKey,
  {
    badge: string
    coverImageSrc?: string
    description: string
    empty: string
    minimalHeader?: boolean
    title: string
  }
>

const facadeFolderOrder: FacadeSectionKey[] = ["dia", "noche"]

type LocationAccordionSection = "roads" | "pois" | "education"

type ExpandedGalleryState = {
  index: number
  items: GalleryCard[]
}

const EMPTY_LOCATION_ROUTE_STATE: LocationRouteState = {
  destinationId: null,
  destinationKind: null,
  isLoading: false,
  error: null,
  route: null,
}

export function PropertyShell({
  content,
  facadeSections,
  gallerySections,
  onViewerLoadingStateChange,
  suppressViewerLoadingOverlay = false,
}: PropertyShellProps) {
  const [activeSection, setActiveSection] = useState<PanelSection | null>(null)
  const [currentFrame, setCurrentFrame] = useState(content.mainViewer.defaultFrame)
  const [activeAmenityId, setActiveAmenityId] = useState<string | null>(null)
  const [activeResidenceId, setActiveResidenceId] = useState<string | null>(
    content.residences[0]?.id ?? null
  )
  const [expandedAmenityId, setExpandedAmenityId] = useState<string | null>(null)
  const [expandedGallery, setExpandedGallery] =
    useState<ExpandedGalleryState | null>(null)
  const [focusFrame, setFocusFrame] = useState<number | null>(null)
  const [viewerGeometry, setViewerGeometry] =
    useState<SequenceViewportGeometry | null>(null)
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null)
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)
  const [selectedEducationId, setSelectedEducationId] = useState<string | null>(null)
  const [isTerrainSelected, setIsTerrainSelected] = useState(false)
  const [isDockCollapsed, setIsDockCollapsed] = useState(false)
  const [activeLocationRouteState, setActiveLocationRouteState] =
    useState<LocationRouteState>(EMPTY_LOCATION_ROUTE_STATE)
  const [openLocationSection, setOpenLocationSection] =
    useState<LocationAccordionSection | null>("roads")

  const highlightedSection =
    activeSection && activeSection !== "contact" ? activeSection : "overview"

  const trackedHotspots = useMemo(() => {
    return content.hotspots
      .map((hotspot) => {
        if (
          hotspot.visibleFrameRange &&
          !isFrameWithinRange(currentFrame, hotspot.visibleFrameRange)
        ) {
          return null
        }

        const position = resolveHotspotPosition(
          hotspot.positions,
          currentFrame,
          content.mainViewer.totalFrames
        )

        if (!position) {
          return null
        }

        return { hotspot, position }
      })
      .filter((item): item is { hotspot: Hotspot; position: HotspotPosition } =>
        Boolean(item)
      )
  }, [content.hotspots, content.mainViewer.totalFrames, currentFrame])

  const selectedPoi =
    content.locationMap.pois.find((poi) => poi.id === selectedPoiId) ?? null
  const selectedEducationPoint =
    content.locationMap.educationPoints.find(
      (educationPoint) => educationPoint.id === selectedEducationId
    ) ?? null
  const selectedAmenity =
    content.amenities.find((amenity) => amenity.id === activeAmenityId) ?? null
  const expandedAmenity =
    content.amenities.find((amenity) => amenity.id === expandedAmenityId) ?? null
  const selectedAmenityIcon =
    selectedAmenity &&
    (amenityIcons[selectedAmenity.id as keyof typeof amenityIcons] ?? GlassWater)
  const shouldShowSelectedAmenityMarker = Boolean(
    activeSection === "amenities" &&
    viewerGeometry &&
    selectedAmenity &&
    currentFrame === selectedAmenity.marker.frame
  )
  const selectedAmenityMarkerPosition =
    viewerGeometry && selectedAmenity
      ? {
          left: `${
            viewerGeometry.x + selectedAmenity.marker.x * viewerGeometry.width
          }px`,
          top: `${
            viewerGeometry.y + selectedAmenity.marker.y * viewerGeometry.height
          }px`,
        }
      : null
  const expandedGalleryItem = expandedGallery?.items[expandedGallery.index] ?? null
  const canNavigateExpandedGallery = (expandedGallery?.items.length ?? 0) > 1
  const canGoToPreviousExpandedGallery = (expandedGallery?.index ?? 0) > 0
  const canGoToNextExpandedGallery =
    expandedGallery !== null &&
    expandedGallery.index < expandedGallery.items.length - 1
  const displayedPoiRouteState =
    selectedPoi &&
    activeLocationRouteState.destinationKind === "poi" &&
    activeLocationRouteState.destinationId === selectedPoi.id
      ? activeLocationRouteState
      : EMPTY_LOCATION_ROUTE_STATE
  const displayedEducationRouteState =
    selectedEducationPoint &&
    activeLocationRouteState.destinationKind === "education" &&
    activeLocationRouteState.destinationId === selectedEducationPoint.id
      ? activeLocationRouteState
      : EMPTY_LOCATION_ROUTE_STATE

  const closeExpandedGallery = () => {
    setExpandedGallery(null)
  }

  const stepExpandedGallery = (direction: -1 | 1) => {
    startTransition(() => {
      setExpandedGallery((currentGallery) => {
        if (!currentGallery) {
          return null
        }

        const nextIndex = Math.min(
          Math.max(currentGallery.index + direction, 0),
          currentGallery.items.length - 1
        )

        if (nextIndex === currentGallery.index) {
          return currentGallery
        }

        return {
          ...currentGallery,
          index: nextIndex,
        }
      })
    })
  }

  const handleExpandedGalleryKeyDown = useEffectEvent(
    (event: KeyboardEvent) => {
      if (!expandedGallery) {
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        closeExpandedGallery()
        return
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        stepExpandedGallery(-1)
        return
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        stepExpandedGallery(1)
      }
    }
  )

  useEffect(() => {
    if (!expandedGallery) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      handleExpandedGalleryKeyDown(event)
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [expandedGallery])

  const closeAmenities = () => {
    startTransition(() => {
      setActiveSection(null)
      setExpandedAmenityId(null)
      setExpandedGallery(null)
    })
  }

  const openSection = (section: PanelSection) => {
    startTransition(() => {
      setActiveSection((currentSection) => {
        if (currentSection === section) {
          return null
        }

        return section
      })

      if (section === "amenities") {
        setActiveAmenityId(null)
      }

      if (section === "location") {
        setOpenLocationSection("roads")
        setSelectedRoadId(null)
        setSelectedPoiId(null)
        setSelectedEducationId(null)
        setIsTerrainSelected(true)
        setActiveLocationRouteState(EMPTY_LOCATION_ROUTE_STATE)
      }
    })
  }

  const toggleLocationSection = (section: LocationAccordionSection) => {
    setOpenLocationSection((currentSection) =>
      currentSection === section ? null : section
    )
  }

  const handleAmenityFocus = (amenity: Amenity) => {
    startTransition(() => {
      setActiveSection("amenities")
      setActiveAmenityId(amenity.id)
      setFocusFrame(amenity.targetFrame)
    })
  }

  const handleResidenceFocus = (residence: ResidenceCard) => {
    startTransition(() => {
      setActiveSection("residences")
      setActiveResidenceId(residence.id)
      setFocusFrame(residence.targetFrame)
    })
  }

  const handleReturnHome = () => {
    startTransition(() => {
      setActiveSection(null)
      setActiveAmenityId(null)
      setExpandedAmenityId(null)
      setExpandedGallery(null)
      setSelectedRoadId(null)
      setSelectedPoiId(null)
      setSelectedEducationId(null)
      setIsTerrainSelected(false)
      setActiveLocationRouteState(EMPTY_LOCATION_ROUTE_STATE)
      setFocusFrame((currentFocusFrame) =>
        currentFocusFrame === content.mainViewer.defaultFrame
          ? null
          : content.mainViewer.defaultFrame
      )
    })
  }

  return (
    <div className="property-page-shell">
      <main className="property-stage">
        <div
          className={cn(
            "property-viewer-pane",
            activeSection === "location" && "property-viewer-pane-hidden"
          )}
        >
          <div className="property-viewer-scrim" aria-hidden="true" />
          <SequenceViewer
            key={`${content.mainViewer.framesDir}:${content.mainViewer.totalFrames}`}
            config={content.mainViewer}
            focusFrame={focusFrame}
            onFrameChange={setCurrentFrame}
            onLoadingStateChange={onViewerLoadingStateChange}
            onViewportGeometryChange={setViewerGeometry}
            suppressLoadingOverlay={suppressViewerLoadingOverlay}
          />
        </div>

        {activeSection === "location" ? (
          <LocationMap
            content={content.locationMap}
            selectedRoadId={selectedRoadId}
            selectedPoiId={selectedPoiId}
            selectedEducationId={selectedEducationId}
            isTerrainSelected={isTerrainSelected}
            onRouteStateChange={setActiveLocationRouteState}
          />
        ) : null}

        <header className="property-topbar">
          <div className="property-top-actions">
            <Button
              type="button"
              className="property-contact-button"
              onClick={() => openSection("contact")}
            >
              <MessageCircleMore data-icon="inline-start" />
              {content.contactCtaLabel}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="property-menu-button"
              aria-label="Abrir informacion del proyecto"
              onClick={() => openSection("overview")}
            >
              <Ellipsis />
            </Button>
          </div>
        </header>

        {activeSection !== "location" && viewerGeometry ? (
          <div className="property-hotspot-layer" aria-label="Puntos destacados">
            {trackedHotspots.map(({ hotspot, position }) => (
              <div
                key={hotspot.id}
                className="property-hotspot"
                style={{
                  left: `${viewerGeometry.x + position.x * viewerGeometry.width}px`,
                  top: `${viewerGeometry.y + position.y * viewerGeometry.height}px`,
                }}
              >
                <span className="property-hotspot-pill">{hotspot.label}</span>
                <span className="property-hotspot-ring" aria-hidden="true" />
              </div>
            ))}
          </div>
        ) : null}

        {shouldShowSelectedAmenityMarker && selectedAmenity && selectedAmenityIcon ? (
          <div className="property-amenity-marker-layer" aria-hidden="true">
            <div
              className="property-amenity-marker"
              style={selectedAmenityMarkerPosition ?? undefined}
            >
              <span className="property-amenity-marker-badge">
                {selectedAmenityIcon ? createElement(selectedAmenityIcon) : null}
              </span>
              <span className="property-amenity-marker-dot" />
            </div>
          </div>
        ) : null}

        {activeSection === "amenities" && selectedAmenity ? (
          <AmenityMediaPanel
            amenity={selectedAmenity}
            onExpand={() => {
              if (selectedAmenity.media.src) {
                setExpandedAmenityId(selectedAmenity.id)
              }
            }}
          />
        ) : null}

        {expandedAmenity?.media.src ? (
          <div
            className="property-amenity-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={expandedAmenity.media.alt}
            onClick={() => setExpandedAmenityId(null)}
          >
            <button
              type="button"
              className="property-amenity-lightbox-close"
              aria-label="Cerrar render ampliado"
              onClick={() => setExpandedAmenityId(null)}
            >
              <CircleX />
            </button>

            <div
              className="property-amenity-lightbox-frame"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={expandedAmenity.media.src}
                alt={expandedAmenity.media.alt}
                fill
                sizes="100vw"
                className="property-amenity-lightbox-image"
              />
            </div>
          </div>
        ) : null}

        {expandedGalleryItem?.image.src ? (
          <div
            className="property-amenity-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={expandedGalleryItem.image.alt}
            onClick={closeExpandedGallery}
          >
            <button
              type="button"
              className="property-amenity-lightbox-close"
              aria-label="Cerrar imagen ampliada"
              onClick={(event) => {
                event.stopPropagation()
                closeExpandedGallery()
              }}
            >
              <CircleX />
            </button>

            <div
              className="property-gallery-lightbox-stage"
              onClick={(event) => event.stopPropagation()}
            >
              {canNavigateExpandedGallery ? (
                <>
                  <button
                    type="button"
                    className="property-gallery-lightbox-nav property-gallery-lightbox-nav-previous"
                    aria-label="Ver imagen anterior"
                    disabled={!canGoToPreviousExpandedGallery}
                    onClick={(event) => {
                      event.stopPropagation()
                      stepExpandedGallery(-1)
                    }}
                  >
                    <ChevronLeft />
                  </button>

                  <button
                    type="button"
                    className="property-gallery-lightbox-nav property-gallery-lightbox-nav-next"
                    aria-label="Ver siguiente imagen"
                    disabled={!canGoToNextExpandedGallery}
                    onClick={(event) => {
                      event.stopPropagation()
                      stepExpandedGallery(1)
                    }}
                  >
                    <ChevronRight />
                  </button>
                </>
              ) : null}

              <div className="property-amenity-lightbox-frame">
                <Image
                  src={expandedGalleryItem.image.src}
                  alt={expandedGalleryItem.image.alt}
                  fill
                  sizes="100vw"
                  className="property-amenity-lightbox-image"
                />
              </div>
            </div>
          </div>
        ) : null}

        {activeSection === "amenities" ? (
          <aside className="property-amenities-sidebar">
            <div className="property-amenities-sidebar-inner">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="property-amenities-close"
                aria-label="Cerrar amenidades"
                onClick={closeAmenities}
              >
                <CircleX />
              </Button>

              <div className="property-amenities-header">
                <div className="property-amenities-title-icon">
                  <VenetianMask />
                </div>
                <h2 className="property-amenities-title">
                  {content.panelTitles.amenities}
                </h2>
              </div>

              <ScrollArea className="property-amenities-scroll">
                <div className="property-amenities-list">
                  {content.amenities.map((amenity) => {
                    const Icon =
                      amenityIcons[amenity.id as keyof typeof amenityIcons] ??
                      GlassWater

                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        className={cn(
                          "property-amenity-item",
                          activeAmenityId === amenity.id &&
                            "property-amenity-item-active"
                        )}
                        onClick={() => handleAmenityFocus(amenity)}
                      >
                        <span className="property-amenity-icon">
                          <Icon />
                        </span>
                        <span>{amenity.name}</span>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>

              <button
                type="button"
                className="property-amenities-handle"
                aria-label="Cerrar sidebar de amenidades"
                onClick={closeAmenities}
              >
                <span />
              </button>
            </div>
          </aside>
        ) : null}

        {activeSection === "location" ? (
          <aside className="property-location-sidebar">
            <div className="property-location-sidebar-inner">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="property-location-close"
                aria-label="Cerrar ubicacion"
                onClick={() => {
                  setActiveSection(null)
                  setActiveLocationRouteState(EMPTY_LOCATION_ROUTE_STATE)
                }}
              >
                <CircleX />
              </Button>

              <div className="property-location-header">
                <div className="property-location-title-icon">
                  <MapPinned />
                </div>
                <h2 className="property-location-title">
                  {content.locationMap.title}
                </h2>
              </div>

              <div className="property-location-accordion">
                <LocationAccordionSectionCard
                  title="Vias de acceso"
                  icon={Route}
                  isOpen={openLocationSection === "roads"}
                  onToggle={() => toggleLocationSection("roads")}
                >
                  <ScrollArea className="property-location-scroll">
                    <div className="property-location-list">
                      <button
                        type="button"
                        className={cn(
                          "property-location-item",
                          !selectedRoadId &&
                            !selectedPoiId &&
                            !selectedEducationId &&
                            !isTerrainSelected &&
                            "property-location-item-active"
                        )}
                        onClick={() => {
                          setSelectedRoadId(null)
                          setSelectedPoiId(null)
                          setSelectedEducationId(null)
                          setIsTerrainSelected(false)
                          setActiveLocationRouteState(EMPTY_LOCATION_ROUTE_STATE)
                        }}
                      >
                        <span>Ver todos</span>
                      </button>

                      <button
                        type="button"
                        className={cn(
                          "property-location-item",
                          isTerrainSelected && "property-location-item-active"
                        )}
                        onClick={() => {
                          setIsTerrainSelected(true)
                          setSelectedRoadId(null)
                          setSelectedPoiId(null)
                          setSelectedEducationId(null)
                          setActiveLocationRouteState(EMPTY_LOCATION_ROUTE_STATE)
                        }}
                      >
                        <span
                          className="property-location-road-legend"
                          aria-hidden="true"
                          style={{ backgroundColor: content.locationMap.terrain.strokeColor }}
                        />
                        <span>Lote del proyecto</span>
                      </button>

                      {content.locationMap.roads.map((road) => (
                        <RoadItem
                          key={road.id}
                          road={road}
                          isActive={selectedRoadId === road.id}
                          onClick={() => {
                            setSelectedRoadId(road.id)
                            setSelectedPoiId(null)
                            setSelectedEducationId(null)
                            setIsTerrainSelected(false)
                            setActiveLocationRouteState(EMPTY_LOCATION_ROUTE_STATE)
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </LocationAccordionSectionCard>

                <LocationAccordionSectionCard
                  title="Malls y Restaurantes"
                  icon={Landmark}
                  isOpen={openLocationSection === "pois"}
                  onToggle={() => toggleLocationSection("pois")}
                >
                  <ScrollArea className="property-location-scroll">
                    <div className="property-location-list">
                      {content.locationMap.pois.map((poi) => (
                        <PoiItem
                          key={poi.id}
                          poi={poi}
                          isActive={selectedPoiId === poi.id}
                          routeState={
                            selectedPoiId === poi.id ? displayedPoiRouteState : null
                          }
                          onClick={() => {
                            setSelectedPoiId(poi.id)
                            setSelectedRoadId(null)
                            setSelectedEducationId(null)
                            setIsTerrainSelected(false)
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </LocationAccordionSectionCard>

                <LocationAccordionSectionCard
                  title="Colegios y universidades"
                  icon={GraduationCap}
                  isOpen={openLocationSection === "education"}
                  onToggle={() => toggleLocationSection("education")}
                >
                  <ScrollArea className="property-location-scroll">
                    <div className="property-location-list">
                      {content.locationMap.educationPoints.map((educationPoint) => (
                        <EducationPointItem
                          key={educationPoint.id}
                          educationPoint={educationPoint}
                          isActive={selectedEducationPoint?.id === educationPoint.id}
                          routeState={
                            selectedEducationPoint?.id === educationPoint.id
                              ? displayedEducationRouteState
                              : null
                          }
                          onClick={() => {
                            setSelectedEducationId(educationPoint.id)
                            setSelectedRoadId(null)
                            setSelectedPoiId(null)
                            setIsTerrainSelected(false)
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </LocationAccordionSectionCard>
              </div>

            </div>
          </aside>
        ) : null}

        {activeSection === "gallery" ? (
          <FolderViewport
            defaultFolder="exteriores"
            folderOrder={galleryFolderOrder}
            sectionMeta={gallerySectionMeta}
            sections={gallerySections}
            onExpand={(items, index) => setExpandedGallery({ items, index })}
            onClose={() => setActiveSection(null)}
            titlesOnly
            viewportLabel="Galeria del proyecto"
          />
        ) : null}

        {activeSection === "facades" ? (
          <FolderViewport
            defaultFolder="dia"
            folderOrder={facadeFolderOrder}
            sectionMeta={facadeSectionMeta}
            sections={facadeSections}
            onExpand={(items, index) => setExpandedGallery({ items, index })}
            onClose={() => setActiveSection(null)}
            viewportLabel="Fachadas del proyecto"
          />
        ) : null}

        {activeSection &&
        activeSection !== "amenities" &&
        activeSection !== "location" &&
        activeSection !== "gallery" &&
        activeSection !== "facades" ? (
          <Card className="property-dock-panel">
            <CardHeader className="property-dock-panel-header">
              <div>
                <p className="property-panel-kicker">{content.status}</p>
                <CardTitle className="property-panel-title">
                  {content.panelTitles[activeSection]}
                </CardTitle>
                <CardDescription className="property-panel-description">
                  {content.panelDescriptions[activeSection]}
                </CardDescription>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="property-panel-close"
                aria-label="Cerrar panel"
                onClick={() => setActiveSection(null)}
              >
                <CircleX />
              </Button>
            </CardHeader>

            <CardContent className="property-dock-panel-body">
              <ScrollArea className="property-dock-scroll">
                <div className="property-panel-stack">
                  {activeSection === "overview" ? (
                    <>
                      <Card size="sm" className="property-info-card">
                        <CardHeader>
                          <div className="property-card-badges">
                            <Badge variant="secondary">
                              {content.availability}
                            </Badge>
                            <Badge variant="outline">{content.location}</Badge>
                          </div>
                          <CardTitle>{content.viewerHeadline}</CardTitle>
                          <CardDescription>{content.summary}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="property-panel-copy">
                            {content.viewerBody}
                          </p>
                        </CardContent>
                      </Card>

                      <div className="property-stat-grid">
                        {content.stats.map((stat) => (
                          <Card
                            key={stat.label}
                            size="sm"
                            className="property-stat-card"
                          >
                            <CardContent className="property-stat-card-content">
                              <span>{stat.label}</span>
                              <strong>{stat.value}</strong>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {activeSection === "residences" ? (
                    <>
                      {content.residences.map((residence) => (
                        <ResidencePanelCard
                          key={residence.id}
                          residence={residence}
                          isActive={activeResidenceId === residence.id}
                          onFocus={() => handleResidenceFocus(residence)}
                        />
                      ))}
                    </>
                  ) : null}
                  {activeSection === "contact" ? (
                    <ContactPanelCard content={content} />
                  ) : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : null}

        <div className="property-dock-shell">
          <button
            type="button"
            className={cn(
              "property-dock-chevron",
              isDockCollapsed && "property-dock-chevron-collapsed"
            )}
            aria-label={
              isDockCollapsed
                ? "Mostrar menu principal"
                : "Ocultar menu principal"
            }
            aria-expanded={!isDockCollapsed}
            onClick={() => setIsDockCollapsed((current) => !current)}
          >
            <span />
          </button>

          {!isDockCollapsed ? (
            <nav className="property-dock" aria-label="Navegacion principal del proyecto">
              {dockSections.map((section) => {
                const Icon = dockIcons[section]
                const isActive = highlightedSection === section

                return (
                  <button
                    key={section}
                    type="button"
                    className={cn(
                      "property-dock-item",
                      isActive && "property-dock-item-active"
                    )}
                    onClick={() => {
                      if (section === "overview") {
                        handleReturnHome()
                        return
                      }

                      openSection(section)
                    }}
                  >
                    <Icon />
                    <span>{content.dockLabels[section]}</span>
                  </button>
                )
              })}
            </nav>
          ) : null}
        </div>
      </main>
    </div>
  )
}

function FolderViewport<SectionKey extends string>({
  defaultFolder,
  folderOrder,
  sectionMeta,
  sections,
  onExpand,
  onClose,
  titlesOnly,
  viewportLabel,
}: {
  defaultFolder: SectionKey
  folderOrder: SectionKey[]
  onExpand: (items: GalleryCard[], index: number) => void
  onClose: () => void
  sectionMeta: Record<
    SectionKey,
    {
      badge: string
      coverImageSrc?: string
      description: string
      empty: string
      minimalHeader?: boolean
      title: string
    }
  >
  sections: Record<SectionKey, GalleryCard[]>
  titlesOnly?: boolean
  viewportLabel: string
}) {
  const [selectedFolder, setSelectedFolder] = useState<SectionKey | null>(null)
  const activeSectionKey = selectedFolder ?? defaultFolder
  const activeItems = sections[activeSectionKey]
  const activeMeta = sectionMeta[activeSectionKey]

  return (
    <section className="property-gallery-viewport" aria-label={viewportLabel}>
      <button
        type="button"
        className="property-gallery-close"
        aria-label={`Cerrar ${viewportLabel.toLowerCase()}`}
        onClick={onClose}
      >
        <CircleX />
      </button>

      <div className="property-gallery-shell">
        {selectedFolder ? (
          <>
            <header className="property-gallery-header">
              <div className="property-gallery-copy">
                <button
                  type="button"
                  className="property-gallery-back"
                  onClick={() => setSelectedFolder(null)}
                >
                  <ArrowLeft />
                  <span>Volver a carpetas</span>
                </button>
                <h2 className="property-gallery-title">{activeMeta.title}</h2>
                {!titlesOnly && !activeMeta.minimalHeader ? (
                  <>
                    <span className="property-gallery-kicker">{activeMeta.badge}</span>
                    <p className="property-gallery-description">
                      {activeMeta.description}
                    </p>
                  </>
                ) : null}
              </div>
            </header>

            {activeItems.length ? (
              <div className="property-gallery-grid">
                {activeItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className="property-gallery-tile"
                    onClick={() => onExpand(activeItems, index)}
                  >
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      fill
                      sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                      className="property-gallery-media-image"
                    />
                    {!titlesOnly ? (
                      <span className="property-gallery-tile-copy">
                        <span className="property-gallery-tile-phase">{item.phase}</span>
                        <span className="property-gallery-tile-title">{item.title}</span>
                      </span>
                    ) : null}
                    <span className="property-amenity-media-expand">
                      <Maximize2 />
                      <span>Ver grande</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="property-gallery-empty">
                <span className="property-gallery-empty-label">{activeMeta.title}</span>
                <p>{activeMeta.empty}</p>
              </div>
            )}
          </>
        ) : (
          <div className="property-gallery-folders">
            {folderOrder.map((folderKey) => {
              const meta = sectionMeta[folderKey]
              const coverItem =
                sections[folderKey].find(
                  (item) => item.image.src === meta.coverImageSrc
                ) ??
                sections[folderKey][0] ??
                null

              return (
                <button
                  key={folderKey}
                  type="button"
                  className="property-gallery-folder-card"
                  onClick={() => setSelectedFolder(folderKey)}
                >
                  <div className="property-gallery-folder-preview">
                    {coverItem ? (
                      <Image
                        src={coverItem.image.src}
                        alt={coverItem.image.alt}
                        fill
                        sizes="(max-width: 900px) 100vw, 50vw"
                        className="property-gallery-media-image"
                      />
                    ) : (
                      <div className="property-gallery-folder-placeholder">
                        <span>{meta.title}</span>
                      </div>
                    )}
                    <span className="property-gallery-folder-title">{meta.title}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function resolveHotspotPosition(
  positions: HotspotPosition[],
  currentFrame: number,
  totalFrames: number
) {
  if (!positions.length) {
    return null
  }

  const ordered = [...positions].sort((a, b) => a.frame - b.frame)
  const exact = ordered.find((position) => position.frame === currentFrame)
  if (exact) {
    return exact.visible === false ? null : exact
  }

  let previous = ordered[ordered.length - 1]
  let next = ordered[0]

  for (let index = 0; index < ordered.length; index += 1) {
    const candidate = ordered[index]
    if (candidate.frame < currentFrame) {
      previous = candidate
      continue
    }

    next = candidate
    break
  }

  if (previous.visible === false || next.visible === false) {
    return null
  }

  const normalizedPrevious = previous.frame
  const normalizedNext =
    next.frame > previous.frame ? next.frame : next.frame + totalFrames
  const normalizedCurrent =
    currentFrame < previous.frame ? currentFrame + totalFrames : currentFrame
  const distance = normalizedNext - normalizedPrevious
  const progress =
    distance === 0 ? 0 : (normalizedCurrent - normalizedPrevious) / distance

  return {
    frame: currentFrame,
    x: previous.x + (next.x - previous.x) * progress,
    y: previous.y + (next.y - previous.y) * progress,
    visible: true,
  }
}

function isFrameWithinRange(
  frame: number,
  range: { start: number; end: number }
) {
  if (range.start <= range.end) {
    return frame >= range.start && frame <= range.end
  }

  return frame >= range.start || frame <= range.end
}

function RoadItem({
  road,
  isActive,
  onClick,
}: {
  road: LocationRoad
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn("property-location-item", isActive && "property-location-item-active")}
      onClick={onClick}
    >
      <span
        className="property-location-road-legend"
        aria-hidden="true"
        style={{ backgroundColor: road.color }}
      />
      <span>{road.name}</span>
    </button>
  )
}

function PoiItem({
  poi,
  isActive,
  routeState,
  onClick,
}: {
  poi: LocationPoi
  isActive: boolean
  routeState: LocationRouteState | null
  onClick: () => void
}) {
  const routeNote = getLocationRouteNote(routeState)

  return (
    <button
      type="button"
      className={cn("property-location-item", isActive && "property-location-item-active")}
      onClick={onClick}
    >
      <span
        className="property-location-road-legend"
        aria-hidden="true"
        style={{ backgroundColor: poi.color }}
      />
      <span className="property-location-item-copy">
        <span className="property-location-item-title">{poi.name}</span>
        <span className="property-location-item-note">{poi.distanceLabel}</span>
        {isActive && routeNote ? (
          <span className="property-location-item-note">{routeNote}</span>
        ) : null}
      </span>
    </button>
  )
}

function getLocationRouteNote(routeState: LocationRouteState | null) {
  if (!routeState) {
    return null
  }

  if (routeState.isLoading) {
    return "Calculando ruta en carro..."
  }

  if (routeState.route) {
    return `Ruta en carro: ${formatRouteDistance(routeState.route.distanceMeters)} · ${formatRouteDuration(routeState.route.durationSeconds)}`
  }

  if (routeState.error) {
    return "Ruta en carro no disponible en este momento"
  }

  return null
}

function formatRouteDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`
  }

  const kilometers = distanceMeters / 1000
  const formatter = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: kilometers >= 10 ? 0 : 1,
    minimumFractionDigits: kilometers >= 10 ? 0 : 1,
  })

  return `${formatter.format(kilometers)} km`
}

function formatRouteDuration(durationSeconds: number) {
  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60))

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (!minutes) {
    return `${hours} h`
  }

  return `${hours} h ${minutes} min`
}

function EducationPointItem({
  educationPoint,
  isActive,
  routeState,
  onClick,
}: {
  educationPoint: LocationEducationPoint
  isActive: boolean
  routeState: LocationRouteState | null
  onClick: () => void
}) {
  const routeNote = getLocationRouteNote(routeState)

  return (
    <button
      type="button"
      className={cn("property-location-item", isActive && "property-location-item-active")}
      onClick={onClick}
    >
      <span
        className="property-location-education-legend"
        aria-hidden="true"
        style={{ color: educationPoint.color }}
      >
        <GraduationCap />
      </span>
      <span className="property-location-item-copy">
        <span className="property-location-item-title">{educationPoint.name}</span>
        <span className="property-location-item-note">
          {educationPoint.distanceLabel}
        </span>
        {isActive && routeNote ? (
          <span className="property-location-item-note">{routeNote}</span>
        ) : null}
      </span>
    </button>
  )
}

function LocationAccordionSectionCard({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  icon: typeof Route
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "property-location-section",
        isOpen && "property-location-section-open"
      )}
    >
      <button
        type="button"
        className={cn(
          "property-location-section-toggle",
          isOpen && "property-location-section-toggle-open"
        )}
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="property-location-section-heading">
          <Icon />
          <span>{title}</span>
        </span>
        <ChevronDown
          className={cn(
            "property-location-section-chevron",
            isOpen && "property-location-section-chevron-open"
          )}
        />
      </button>

      {isOpen ? <div className="property-location-section-content">{children}</div> : null}
    </section>
  )
}

function AmenityMediaPanel({
  amenity,
  onExpand,
}: {
  amenity: Amenity
  onExpand: () => void
}) {
  const Icon =
    amenityIcons[amenity.id as keyof typeof amenityIcons] ?? GlassWater
  const mediaDimensions = amenity.media.src
    ? amenityMediaDimensions[
        amenity.media.src as keyof typeof amenityMediaDimensions
      ]
    : null
  const mediaAspectRatio = mediaDimensions
    ? `${mediaDimensions.width} / ${mediaDimensions.height}`
    : undefined

  return (
    <Card
      className="property-amenity-detail-panel"
      style={mediaAspectRatio ? { aspectRatio: mediaAspectRatio } : undefined}
    >
      <CardContent className="property-amenity-detail-body">
        <div className="property-amenity-media-shell">
          {amenity.media.src ? (
            <button
              type="button"
              className="property-amenity-media-frame property-amenity-media-button"
              onClick={onExpand}
            >
              <Image
                src={amenity.media.src}
                alt={amenity.media.alt}
                fill
                sizes="(max-width: 900px) 100vw, 40vw"
                className="property-amenity-media-image"
              />
              <span className="property-amenity-media-expand">
                <Maximize2 />
                <span>Ver grande</span>
              </span>
            </button>
          ) : (
            <div className="property-amenity-media-placeholder">
              <span className="property-amenity-media-icon">
                <Icon />
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

type ResidencePanelCardProps = {
  residence: ResidenceCard
  isActive: boolean
  onFocus: () => void
}

function ResidencePanelCard({
  residence,
  isActive,
  onFocus,
}: ResidencePanelCardProps) {
  return (
    <Card size="sm" className="property-info-card">
      <CardHeader>
        <div className="property-card-badges">
          <Badge variant="secondary">{residence.format}</Badge>
          {isActive ? <Badge variant="outline">En escena</Badge> : null}
        </div>
        <CardTitle>{residence.name}</CardTitle>
        <CardDescription>{residence.description}</CardDescription>
      </CardHeader>
      <CardFooter className="property-card-footer">
        <p className="property-footnote">{residence.statusNote}</p>
        <Button
          type="button"
          variant={isActive ? "secondary" : "outline"}
          onClick={onFocus}
        >
          <Building2 data-icon="inline-start" />
          Ver punto
        </Button>
      </CardFooter>
    </Card>
  )
}

function ContactPanelCard({ content }: { content: ProjectContent }) {
  const { contact } = content

  return (
    <Card className="property-info-card">
      <CardHeader>
        <div className="property-card-badges">
          <Badge variant="secondary">{contact.advisorLabel}</Badge>
          <Badge variant="outline">{contact.location}</Badge>
        </div>
        <CardTitle>Continua la conversacion desde este mismo micrositio.</CardTitle>
        <CardDescription>
          Una salida simple para WhatsApp, correo o llamada sin romper la
          experiencia principal.
        </CardDescription>
      </CardHeader>
      <CardContent className="property-contact-grid">
        <div className="property-contact-row">
          <span>Proyecto</span>
          <strong>{contact.projectName}</strong>
        </div>
        <div className="property-contact-row">
          <span>Telefono</span>
          <strong>{contact.phoneDisplay}</strong>
        </div>
        <div className="property-contact-row">
          <span>Correo</span>
          <strong>{contact.email}</strong>
        </div>
        <div className="property-contact-row">
          <span>Horario</span>
          <strong>{contact.schedule}</strong>
        </div>
      </CardContent>
      <CardFooter className="property-contact-actions">
        <Button asChild>
          <a href={contact.whatsappHref} target="_blank" rel="noreferrer">
            <MessageCircleMore data-icon="inline-start" />
            WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={contact.emailHref}>Correo</a>
        </Button>
        <Button asChild variant="ghost">
          <a href={contact.phoneHref}>
            <Phone data-icon="inline-start" />
            Llamar
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
