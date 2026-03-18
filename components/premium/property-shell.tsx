"use client"

import { startTransition, useMemo, useState } from "react"
import {
  ArrowUpRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Images,
  MessageCircleMore,
  MoveHorizontal,
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
  const [activeSection, setActiveSection] = useState<PanelSection>("amenities")
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
      setActiveSection(section)

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
      <div
        className={cn(
          "property-shell-grid",
          isRailCollapsed && "property-shell-grid-collapsed"
        )}
      >
        <aside className="property-rail">
          <div className="property-rail-header">
            <div className="property-brand-lockup">
              <Badge variant="outline" className="property-brand-badge">
                {content.eyebrow}
              </Badge>
              <div className="property-brand-copy">
                <p className="property-brand-location">{content.location}</p>
                <h1 className="property-brand-name">{content.name}</h1>
                <p className="property-brand-tagline">{content.tagline}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
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
          </div>

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

          <Card className="property-rail-summary">
            <CardHeader>
              <CardTitle>Presentación</CardTitle>
              <CardDescription>{content.summary}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="property-stat-row">
                <span>Estado</span>
                <Badge variant="secondary">{content.status}</Badge>
              </div>
              <div className="property-stat-row">
                <span>Activos</span>
                <Badge variant="outline">{content.availability}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="property-rail-footer">
            <MoveHorizontal className="property-rail-footer-icon" />
            <p>{content.railNote}</p>
          </div>
        </aside>

        <main className="property-viewer-pane">
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
            <div className="property-viewer-overlay-footer">
              <span>75 cuadros optimizados</span>
              <span>Control por arrastre y teclado</span>
            </div>
          </div>

          {activeAmenity ? (
            <div className="property-focus-pill">
              <span>En foco</span>
              <strong>{activeAmenity.name}</strong>
            </div>
          ) : null}
        </main>

        <aside className="property-panel-pane">
          <div className="property-panel-header">
            <div>
              <p className="property-panel-kicker">Panel contextual</p>
              <h2>{content.panelTitles[activeSection]}</h2>
            </div>
            <Badge variant="outline">{content.location}</Badge>
          </div>

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
                    <Card key={item.id}>
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
        </aside>
      </div>
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
    <Card size="sm">
      <CardHeader>
        <div className="property-card-badges">
          <Badge variant="outline">Frame {String(amenity.targetFrame).padStart(3, "0")}</Badge>
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
        <Button type="button" variant={isActive ? "secondary" : "outline"} onClick={onFocus}>
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
    <Card className="property-contact-card">
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
            <Building2 data-icon="inline-start" />
            Llamar ahora
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
