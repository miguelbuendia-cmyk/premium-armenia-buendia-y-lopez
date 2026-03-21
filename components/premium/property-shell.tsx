"use client"

import { startTransition, useMemo, useState } from "react"
import {
  Building2,
  CircleX,
  Ellipsis,
  GlassWater,
  Images,
  Leaf,
  Dumbbell,
  MapPinned,
  MessageCircleMore,
  Phone,
  SprayCan,
  Sparkles,
  TentTree,
  Trees,
  WavesLadder,
  VenetianMask,
  Gamepad2,
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
  Hotspot,
  HotspotPosition,
  PanelSection,
  ProjectContent,
  ResidenceCard,
} from "@/lib/premium-content"

import { SequenceViewer } from "./sequence-viewer"

type PropertyShellProps = {
  content: ProjectContent
}

const dockSections: DockSection[] = [
  "overview",
  "location",
  "amenities",
  "residences",
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

export function PropertyShell({ content }: PropertyShellProps) {
  const [activeSection, setActiveSection] = useState<PanelSection | null>(null)
  const [currentFrame, setCurrentFrame] = useState(content.viewer.defaultFrame)
  const [activeAmenityId, setActiveAmenityId] = useState<string | null>(
    content.amenities[0]?.id ?? null
  )
  const [activeResidenceId, setActiveResidenceId] = useState<string | null>(
    content.residences[0]?.id ?? null
  )
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [focusFrame, setFocusFrame] = useState<number | null>(null)

  const highlightedSection =
    activeSection && activeSection !== "contact" ? activeSection : "overview"

  const trackedHotspots = useMemo(() => {
    return content.hotspots
      .map((hotspot) => {
        const position = resolveHotspotPosition(
          hotspot.positions,
          currentFrame,
          content.viewer.totalFrames
        )

        if (!position) {
          return null
        }

        return {
          hotspot,
          position,
        }
      })
      .filter((item): item is { hotspot: Hotspot; position: HotspotPosition } =>
        Boolean(item)
      )
  }, [content.hotspots, content.viewer.totalFrames, currentFrame])

  const openSection = (section: PanelSection) => {
    startTransition(() => {
      setActiveSection((currentSection) =>
        currentSection === section ? null : section
      )
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
        <div className="property-viewer-pane">
          <div className="property-viewer-scrim" aria-hidden="true" />
          <SequenceViewer
            config={content.viewer}
            focusFrame={focusFrame}
            onFrameChange={setCurrentFrame}
          />
        </div>

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

        {activeSection === "amenities" ? (
          <aside className="property-amenities-sidebar">
            <div className="property-amenities-sidebar-inner">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="property-amenities-close"
                aria-label="Cerrar amenidades"
                onClick={() => setActiveSection(null)}
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
                        setFocusFrame(content.viewer.defaultFrame)
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
                onClick={() => setActiveSection(null)}
              >
                <span />
              </button>
            </div>
          </aside>
        ) : null}

        {activeSection ? (
          activeSection === "amenities" ? null : (
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

                    {activeSection === "location" ? (
                      <>
                        {content.locationPoints.map((point) => (
                          <Card
                            key={point.id}
                            size="sm"
                            className="property-info-card"
                          >
                            <CardHeader>
                              <CardTitle>{point.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="property-panel-copy">
                                {point.description}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
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

                    {activeSection === "gallery" ? (
                      <>
                        {content.gallery.map((item) => (
                          <Card
                            key={item.id}
                            size="sm"
                            className="property-info-card"
                          >
                            <CardHeader>
                              <div className="property-card-badges">
                                <Badge variant="outline">{item.phase}</Badge>
                                <Badge variant="secondary">Reservado</Badge>
                              </div>
                              <CardTitle>{item.title}</CardTitle>
                              <CardDescription>
                                {item.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="property-panel-copy">{item.note}</p>
                            </CardContent>
                          </Card>
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
          )
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
