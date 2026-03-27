"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { startTransition, useMemo, useState } from "react"
import {
  Building2,
  CircleX,
  Dumbbell,
  Ellipsis,
  Gamepad2,
  GlassWater,
  Images,
  Landmark,
  Leaf,
  MapPinned,
  Maximize2,
  MessageCircleMore,
  Phone,
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
  GalleryCard,
  Hotspot,
  HotspotPosition,
  LocationRoad,
  PanelSection,
  ProjectContent,
  ResidenceCard,
} from "@/lib/premium-content"

import { SequenceViewer } from "./sequence-viewer"

const LocationMap = dynamic(
  () => import("./location-map").then((module) => module.LocationMap),
  { ssr: false }
)

type PropertyShellProps = {
  content: ProjectContent
}

const dockSections: DockSection[] = [
  "overview",
  "location",
  "amenities",
  "gallery",
]

const dockIcons = {
  overview: Sparkles,
  location: MapPinned,
  amenities: Trees,
  residences: Building2,
  gallery: Images,
} satisfies Record<DockSection, typeof Sparkles>

const amenityIcons = {
  piscina: WavesLadder,
  turco: SprayCan,
  "parque-ninos": TentTree,
  jardines: Leaf,
  coworking: Building2,
  "zona-juegos": Gamepad2,
  gym: Dumbbell,
} as const

const roadSwatches = {
  "via-armenia-pereira": "property-road-swatch-via-principal",
  "acceso-principal": "property-road-swatch-acceso-principal",
  "acceso-perimetral": "property-road-swatch-acceso",
} as const

export function PropertyShell({ content }: PropertyShellProps) {
  const [activeSection, setActiveSection] = useState<PanelSection | null>(null)
  const [currentFrame, setCurrentFrame] = useState(content.mainViewer.defaultFrame)
  const [activeAmenityId, setActiveAmenityId] = useState<string | null>(null)
  const [activeResidenceId, setActiveResidenceId] = useState<string | null>(
    content.residences[0]?.id ?? null
  )
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [expandedAmenityId, setExpandedAmenityId] = useState<string | null>(null)
  const [expandedGalleryId, setExpandedGalleryId] = useState<string | null>(null)
  const [focusFrame, setFocusFrame] = useState<number | null>(null)
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null)

  const highlightedSection =
    activeSection && activeSection !== "contact" ? activeSection : "overview"

  const trackedHotspots = useMemo(() => {
    return content.hotspots
      .map((hotspot) => {
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

  const selectedRoad =
    content.locationMap.roads.find((road) => road.id === selectedRoadId) ?? null
  const selectedAmenity =
    content.amenities.find((amenity) => amenity.id === activeAmenityId) ?? null
  const expandedAmenity =
    content.amenities.find((amenity) => amenity.id === expandedAmenityId) ?? null
  const expandedGallery =
    content.gallery.find((item) => item.id === expandedGalleryId) ?? null

  const closeAmenities = () => {
    startTransition(() => {
      setActiveSection(null)
      setExpandedAmenityId(null)
      setExpandedGalleryId(null)
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
        setSelectedRoadId(null)
      }
    })
  }

  const handleAmenityFocus = (amenity: Amenity) => {
    startTransition(() => {
      setActiveSection("amenities")
      setActiveAmenityId(amenity.id)
      setActiveHotspotId(null)
      setFocusFrame(amenity.targetFrame)
    })
  }

  const handleResidenceFocus = (residence: ResidenceCard) => {
    startTransition(() => {
      setActiveSection("residences")
      setActiveResidenceId(residence.id)
      setActiveHotspotId(residence.id)
      setFocusFrame(residence.targetFrame)
    })
  }

  const handleHotspotFocus = (hotspotId: string) => {
    const hotspot = content.hotspots.find((item) => item.id === hotspotId)
    if (!hotspot) {
      return
    }

    startTransition(() => {
      setActiveSection("residences")
      setActiveHotspotId(hotspot.id)
      setActiveResidenceId(hotspot.linkedResidenceId ?? hotspot.id)
      setFocusFrame(hotspot.targetFrame)
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
          />
        </div>

        {activeSection === "location" ? (
          <LocationMap
            content={content.locationMap}
            selectedRoadId={selectedRoadId}
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

        {activeSection !== "location" ? (
          <div className="property-hotspot-layer" aria-label="Puntos destacados">
            {trackedHotspots.map(({ hotspot, position }) => (
              <button
                key={hotspot.id}
                type="button"
                className={cn(
                  "property-hotspot",
                  activeHotspotId === hotspot.id && "property-hotspot-active"
                )}
                style={{
                  left: `${position.x * 100}%`,
                  top: `${position.y * 100}%`,
                }}
                onClick={() => handleHotspotFocus(hotspot.id)}
              >
                <span className="property-hotspot-pill">{hotspot.label}</span>
                <span className="property-hotspot-ring" aria-hidden="true" />
              </button>
            ))}
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

        {expandedGallery?.image.src ? (
          <div
            className="property-amenity-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={expandedGallery.image.alt}
            onClick={() => setExpandedGalleryId(null)}
          >
            <button
              type="button"
              className="property-amenity-lightbox-close"
              aria-label="Cerrar imagen ampliada"
              onClick={() => setExpandedGalleryId(null)}
            >
              <CircleX />
            </button>

            <div
              className="property-amenity-lightbox-frame"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={expandedGallery.image.src}
                alt={expandedGallery.image.alt}
                fill
                sizes="100vw"
                className="property-amenity-lightbox-image"
              />
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
                  <button
                    type="button"
                    className="property-amenity-item property-amenity-item-featured"
                    onClick={() => {
                      startTransition(() => {
                        setActiveAmenityId(null)
                        setFocusFrame(content.mainViewer.defaultFrame)
                      })
                    }}
                  >
                    <span className="property-amenity-icon">
                      <Leaf />
                    </span>
                    <span>Ver todos</span>
                  </button>

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
                onClick={() => setActiveSection(null)}
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

              <div className="property-location-section">
                <div className="property-location-section-heading">
                  <Route />
                  <span>Vias de acceso</span>
                </div>

                <ScrollArea className="property-location-scroll">
                  <div className="property-location-list">
                    <button
                      type="button"
                      className={cn(
                        "property-location-item",
                        !selectedRoadId && "property-location-item-active"
                      )}
                      onClick={() => setSelectedRoadId(null)}
                    >
                      <span className="property-location-item-icon">
                        <Landmark />
                      </span>
                      <span>Ver todos</span>
                    </button>

                    {content.locationMap.roads.map((road) => (
                      <RoadItem
                        key={road.id}
                        road={road}
                        isActive={selectedRoadId === road.id}
                        onClick={() => setSelectedRoadId(road.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="property-location-summary">
                <p className="property-location-summary-label">
                  Punto del proyecto
                </p>
                <strong>{content.locationMap.project.label}</strong>
                <p>{content.location}</p>
                {selectedRoad ? (
                  <p className="property-location-summary-road">
                    Ruta destacada: {selectedRoad.name}
                  </p>
                ) : (
                  <p className="property-location-summary-road">
                    Vista general con el proyecto y sus accesos principales.
                  </p>
                )}
              </div>
            </div>
          </aside>
        ) : null}

        {activeSection === "gallery" ? (
          <GalleryViewport
            items={content.gallery}
            onExpand={(id) => setExpandedGalleryId(id)}
            onClose={() => setActiveSection(null)}
          />
        ) : null}

        {activeSection &&
        activeSection !== "amenities" &&
        activeSection !== "location" &&
        activeSection !== "gallery" ? (
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
          <div className="property-dock-chevron" aria-hidden="true">
            <span />
          </div>

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
                  onClick={() => openSection(section)}
                >
                  <Icon />
                  <span>{content.dockLabels[section]}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </main>
    </div>
  )
}

function GalleryViewport({
  items,
  onExpand,
  onClose,
}: {
  items: GalleryCard[]
  onExpand: (id: string) => void
  onClose: () => void
}) {
  return (
    <section className="property-gallery-viewport" aria-label="Galeria de renders">
      <button
        type="button"
        className="property-gallery-close"
        aria-label="Cerrar galeria"
        onClick={onClose}
      >
        <CircleX />
      </button>

      <div className="property-gallery-grid">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="property-gallery-tile"
            onClick={() => onExpand(item.id)}
          >
            <Image
              src={item.image.src}
              alt={item.image.alt}
              fill
              sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
              className="property-gallery-media-image"
            />
            <span className="property-amenity-media-expand">
              <Maximize2 />
              <span>Ver grande</span>
            </span>
          </button>
        ))}
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

function RoadItem({
  road,
  isActive,
  onClick,
}: {
  road: LocationRoad
  isActive: boolean
  onClick: () => void
}) {
  const swatchClass =
    roadSwatches[road.id as keyof typeof roadSwatches] ??
    "property-road-swatch-default"

  return (
    <button
      type="button"
      className={cn("property-location-item", isActive && "property-location-item-active")}
      onClick={onClick}
    >
      <span className={cn("property-location-road-swatch", swatchClass)} />
      <span>{road.name}</span>
    </button>
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

  return (
    <Card className="property-amenity-detail-panel">
      <CardHeader className="property-dock-panel-header">
        <div>
          <p className="property-panel-kicker">{amenity.shortLabel}</p>
          <CardTitle className="property-panel-title">{amenity.name}</CardTitle>
          <CardDescription className="property-panel-description">
            {amenity.highlight}
          </CardDescription>
        </div>
      </CardHeader>

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
              <span className="property-amenity-media-label">
                {amenity.media.placeholderLabel}
              </span>
              <p>{amenity.media.placeholderNote}</p>
            </div>
          )}
        </div>

        <div className="property-amenity-detail-copy">
          <p>{amenity.description}</p>
          <p className="property-footnote">{amenity.statusNote}</p>
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
