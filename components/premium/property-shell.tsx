"use client"

import { startTransition, useMemo, useState } from "react"
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Compass,
  Images,
  MessageCircleMore,
  Phone,
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
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Amenity, PanelSection, ProjectContent } from "@/lib/premium-content"

import { SequenceViewer } from "./sequence-viewer"

type PropertyShellProps = {
  content: ProjectContent
}

const sectionIcons: Record<PanelSection, typeof Compass> = {
  amenities: Compass,
  gallery: Images,
  contact: MessageCircleMore,
}

const sectionOrder: PanelSection[] = ["amenities", "gallery", "contact"]

export function PropertyShell({ content }: PropertyShellProps) {
  const [activeSection, setActiveSection] = useState<PanelSection | null>(null)
  const [activeAmenityId, setActiveAmenityId] = useState<string | null>(
    content.amenities[0]?.id ?? null
  )
  const [isRailCollapsed, setIsRailCollapsed] = useState(false)

  const activeAmenity = useMemo(() => {
    return (
      content.amenities.find((amenity) => amenity.id === activeAmenityId) ?? null
    )
  }, [activeAmenityId, content.amenities])

  const handleSectionChange = (section: PanelSection) => {
    startTransition(() => {
      setActiveSection((currentSection) =>
        currentSection === section ? null : section
      )

      if (section !== "amenities") {
        setActiveAmenityId(null)
      }
    })
  }

  const handleAmenityFocus = (amenityId: string) => {
    startTransition(() => {
      setActiveSection("amenities")
      setActiveAmenityId((currentAmenityId) =>
        currentAmenityId === amenityId ? null : amenityId
      )
    })
  }

  return (
    <div className="property-page-shell">
      <main className="property-stage">
        <div className="property-viewer-pane">
          <div className="property-viewer-backdrop" aria-hidden="true" />
          <SequenceViewer
            amenities={content.amenities}
            config={content.viewer}
            activeAmenityId={activeAmenityId}
          />

          <div className="property-viewer-overlay">
            <div className="property-viewer-overlay-top">
              <Badge variant="secondary">{content.status}</Badge>
              <Badge variant="outline">{content.location}</Badge>
            </div>
            <div className="property-viewer-overlay-copy">
              <p className="property-viewer-kicker">Vista interactiva</p>
              <h2>{content.viewerHeadline}</h2>
              <p>{content.viewerBody}</p>
            </div>
          </div>

          {activeAmenity ? (
            <div className="property-focus-pill">
              <span>En foco</span>
              <strong>{activeAmenity.name}</strong>
            </div>
          ) : null}
        </div>

        <Card
          className={cn(
            "property-rail",
            isRailCollapsed && "property-rail-collapsed"
          )}
        >
          <CardHeader className="property-rail-header">
            <div className="property-brand-lockup">
              <Badge variant="outline" className="property-brand-badge">
                {content.eyebrow}
              </Badge>
              <div className="property-brand-copy">
                <p className="property-brand-location">{content.location}</p>
                <CardTitle className="property-brand-name">
                  {content.name}
                </CardTitle>
                <CardDescription className="property-brand-tagline">
                  {content.tagline}
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="property-collapse-button shrink-0"
              onClick={() => setIsRailCollapsed((current) => !current)}
              aria-expanded={!isRailCollapsed}
              aria-label={
                isRailCollapsed
                  ? "Expandir panel lateral"
                  : "Contraer panel lateral"
              }
            >
              {isRailCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </CardHeader>

          <CardContent className="property-rail-body">
            <Separator />

            <nav className="property-rail-nav" aria-label="Secciones del proyecto">
              {sectionOrder.map((section) => {
                const Icon = sectionIcons[section]
                const isActive = activeSection === section

                return (
                  <Button
                    key={section}
                    type="button"
                    variant={isActive ? "secondary" : "ghost"}
                    className="property-nav-button w-full justify-start"
                    onClick={() => handleSectionChange(section)}
                    title={content.panelTitles[section]}
                  >
                    <Icon data-icon="inline-start" />
                    <span className="property-nav-label">
                      {content.panelTitles[section]}
                    </span>
                  </Button>
                )
              })}
            </nav>
          </CardContent>

          <CardFooter className="property-rail-footer">
            <Badge variant="secondary">{content.availability}</Badge>
            <p>{content.railNote}</p>
          </CardFooter>
        </Card>

        {activeSection ? (
          <Card className="property-panel">
            <CardHeader className="property-panel-header">
              <div>
                <p className="property-panel-kicker">Panel contextual</p>
                <CardTitle className="property-panel-title">
                  {content.panelTitles[activeSection]}
                </CardTitle>
              </div>
              <div className="property-panel-actions">
                <Badge variant="outline">{content.location}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setActiveSection(null)}
                  aria-label="Cerrar panel"
                >
                  <CircleX />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="property-panel-body">
              <p className="property-panel-description">
                {content.panelDescriptions[activeSection]}
              </p>

              <Separator />

              <ScrollArea className="property-panel-scroll">
                <div className="property-panel-stack">
                  {activeSection === "amenities" ? (
                    <>
                      {content.amenities.map((amenity) => (
                        <AmenityCard
                          key={amenity.id}
                          amenity={amenity}
                          isActive={activeAmenityId === amenity.id}
                          onFocus={() => handleAmenityFocus(amenity.id)}
                        />
                      ))}
                    </>
                  ) : null}

                  {activeSection === "gallery" ? (
                    <>
                      {content.gallery.map((item) => (
                        <Card key={item.id} size="sm" className="property-list-card">
                          <CardHeader>
                            <div className="property-card-badges">
                              <Badge variant="outline">Galería reservada</Badge>
                              <Badge variant="secondary">{item.phase}</Badge>
                            </div>
                            <CardTitle>{item.title}</CardTitle>
                            <CardDescription>{item.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="property-panel-copy">{item.note}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : null}

                  {activeSection === "contact" ? (
                    <ContactCard content={content} />
                  ) : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  )
}

type AmenityCardProps = {
  amenity: Amenity
  isActive: boolean
  onFocus: () => void
}

function AmenityCard({ amenity, isActive, onFocus }: AmenityCardProps) {
  return (
    <Card size="sm" className="property-list-card">
      <CardHeader>
        <div className="property-card-badges">
          <Badge variant="outline">
            Frame {String(amenity.targetFrame).padStart(3, "0")}
          </Badge>
          {isActive ? <Badge variant="secondary">En foco</Badge> : null}
        </div>
        <CardTitle>{amenity.name}</CardTitle>
        <CardDescription>{amenity.highlight}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="property-panel-copy">{amenity.description}</p>
        <div className="property-status-line">
          <span>Estado visual</span>
          <strong>Render pendiente</strong>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="property-footnote">{amenity.statusNote}</p>
        <Button
          type="button"
          variant={isActive ? "secondary" : "outline"}
          onClick={onFocus}
        >
          <Compass data-icon="inline-start" />
          Enfocar
        </Button>
      </CardFooter>
    </Card>
  )
}

function ContactCard({ content }: { content: ProjectContent }) {
  const { contact } = content

  return (
    <Card className="property-contact-card property-list-card">
      <CardHeader>
        <div className="property-card-badges">
          <Badge variant="secondary">{contact.advisorLabel}</Badge>
          <Badge variant="outline">{contact.location}</Badge>
        </div>
        <CardTitle>Cierra la conversación con un contacto directo.</CardTitle>
        <CardDescription>
          Una salida comercial simple para continuar el recorrido por WhatsApp,
          correo o llamada.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="property-contact-grid">
          <div className="property-contact-row">
            <span>Proyecto</span>
            <strong>{contact.projectName}</strong>
          </div>
          <div className="property-contact-row">
            <span>Teléfono</span>
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
        </div>
      </CardContent>
      <CardFooter className="property-contact-actions">
        <Button asChild>
          <a href={contact.whatsappHref} target="_blank" rel="noreferrer">
            <MessageCircleMore data-icon="inline-start" />
            Abrir WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={contact.emailHref}>
            <ArrowUpRight data-icon="inline-start" />
            Enviar correo
          </a>
        </Button>
        <Button asChild variant="ghost">
          <a href={contact.phoneHref}>
            <Phone data-icon="inline-start" />
            Llamar ahora
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
