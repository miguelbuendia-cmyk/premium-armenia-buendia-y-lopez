"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import {
  Bath,
  BedDouble,
  BadgeDollarSign,
  CircleX,
  Home,
  ImageIcon,
  Layers3,
  Ruler,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type {
  TowerAExplorerData,
  TowerAInventoryUnit,
  TowerAUnitStatus,
} from "@/lib/tower-a-types"

type TowerAFloorExplorerProps = {
  data: TowerAExplorerData
  onClose: () => void
}

const statusLabels = {
  available: "Disponible",
  reserved: "Reservada",
  sold: "Vendida",
  unknown: "Sin estado",
} satisfies Record<TowerAUnitStatus, string>

const statusLegendItems = [
  { status: "available", label: statusLabels.available },
  { status: "sold", label: statusLabels.sold },
] satisfies Array<{ status: TowerAUnitStatus; label: string }>

export function TowerAFloorExplorer({
  data,
  onClose,
}: TowerAFloorExplorerProps) {
  const initialFloor =
    data.floors.find((floor) => floor.image || floor.units.length)?.floor ??
    data.floors[0]?.floor ??
    3
  const [selectedFloor, setSelectedFloor] = useState(initialFloor)
  const [selectedUnitCode, setSelectedUnitCode] = useState<string | null>(null)

  const activeFloor =
    data.floors.find((floor) => floor.floor === selectedFloor) ?? data.floors[0]
  const selectedUnit =
    activeFloor?.units.find((unit) => unit.unitCode === selectedUnitCode) ?? null
  const markers = useMemo(() => {
    return new Map(
      (data.markerMap[selectedFloor] ?? []).map((marker) => [
        marker.unitNumber,
        marker,
      ])
    )
  }, [data.markerMap, selectedFloor])
  const unitsWithMarkers = activeFloor?.units.filter((unit) =>
    markers.has(unit.unitNumber)
  )
  const missingMarkerCount =
    (activeFloor?.units.length ?? 0) - (unitsWithMarkers?.length ?? 0)

  return (
    <section
      className="tower-a-explorer"
      aria-label="Explorador Torre A"
      role="dialog"
      aria-modal="true"
    >
      <div className="tower-a-explorer-toolbar">
        <div className="tower-a-explorer-heading">
          <Badge variant="secondary">Torre A</Badge>
          <h2>Plantas disponibles</h2>
        </div>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="tower-a-explorer-close"
          aria-label="Cerrar Torre A"
          onClick={onClose}
        >
          <CircleX />
        </Button>
      </div>

      <div className="tower-a-explorer-stage">
        <div className="tower-a-plan-shell">
          {activeFloor?.image ? (
            <div
              className="tower-a-plan-frame"
              style={{
                aspectRatio: `${activeFloor.image.width} / ${activeFloor.image.height}`,
              }}
            >
              <Image
                src={activeFloor.image.src}
                alt={activeFloor.image.alt}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 82vw"
                className="tower-a-plan-image"
              />

              {unitsWithMarkers?.map((unit) => {
                const marker = markers.get(unit.unitNumber)
                if (!marker) {
                  return null
                }

                return (
                  <button
                    key={unit.unitCode}
                    type="button"
                    className={cn(
                      "tower-a-unit-marker",
                      `tower-a-unit-marker-${unit.status}`,
                      selectedUnit?.unitCode === unit.unitCode &&
                        "tower-a-unit-marker-active"
                    )}
                    style={{
                      left: `${marker.x * 100}%`,
                      top: `${marker.y * 100}%`,
                    }}
                    onClick={() => setSelectedUnitCode(unit.unitCode)}
                  >
                    <span className="tower-a-unit-status-dot" />
                    <span>{unit.unitCode}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="tower-a-plan-empty">
              <Layers3 />
              <span>Piso {selectedFloor}</span>
              <p>La planta de este piso aun no esta cargada.</p>
            </div>
          )}

          {missingMarkerCount > 0 ? (
            <p className="tower-a-plan-note">
              {missingMarkerCount} unidad(es) sin coordenadas manuales en este piso.
            </p>
          ) : null}
        </div>

        <aside className="tower-a-detail-panel">
          <Card className="tower-a-unit-card">
            <CardHeader>
              <CardTitle>Piso {selectedFloor}</CardTitle>
              <CardDescription>
                Selecciona una unidad sobre la planta para ver su informacion.
              </CardDescription>
            </CardHeader>
            <CardContent className="tower-a-floor-summary">
              <SummaryItem icon={Home} label="Unidades" value={activeFloor?.units.length ?? 0} />
              <SummaryItem
                icon={BadgeDollarSign}
                label="Disponibles"
                value={
                  activeFloor?.units.filter((unit) => unit.status === "available")
                    .length ?? 0
                }
              />
              <div className="tower-a-status-legend" aria-label="Leyenda de colores">
                <span className="tower-a-status-legend-title">Leyenda</span>
                <div className="tower-a-status-legend-items">
                  {statusLegendItems.map((item) => (
                    <span key={item.status} className="tower-a-status-legend-item">
                      <span
                        className={cn(
                          "tower-a-status-legend-dot",
                          `tower-a-status-legend-dot-${item.status}`
                        )}
                        aria-hidden="true"
                      />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {selectedUnit ? (
        <UnitDetailOverlay
          unit={selectedUnit}
          onClose={() => setSelectedUnitCode(null)}
        />
      ) : null}

      <nav className="tower-a-floor-rail" aria-label="Seleccionar piso">
        {data.floors
          .slice()
          .sort((left, right) => right.floor - left.floor)
          .map((floorPlan) => (
            <button
              key={floorPlan.floor}
              type="button"
              className={cn(
                "tower-a-floor-button",
                selectedFloor === floorPlan.floor && "tower-a-floor-button-active",
                !floorPlan.image && "tower-a-floor-button-missing"
              )}
              aria-pressed={selectedFloor === floorPlan.floor}
              onClick={() => {
                setSelectedFloor(floorPlan.floor)
                setSelectedUnitCode(null)
              }}
            >
              {floorPlan.floor}
            </button>
          ))}
      </nav>
    </section>
  )
}

function UnitDetailOverlay({
  unit,
  onClose,
}: {
  unit: TowerAInventoryUnit
  onClose: () => void
}) {
  return (
    <div
      className="tower-a-unit-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Unidad ${unit.unitCode}`}
      onClick={onClose}
    >
      <Card
        className="tower-a-unit-card tower-a-unit-modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="tower-a-unit-modal-header">
          <div>
            <div className="tower-a-unit-card-badges">
              <Badge variant="secondary">{unit.unitCode}</Badge>
              <span className={cn("tower-a-status-chip", `tower-a-status-chip-${unit.status}`)}>
                {unit.statusLabel || statusLabels[unit.status]}
              </span>
            </div>
            <CardTitle>Unidad {unit.unitCode}</CardTitle>
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="tower-a-unit-modal-close"
            aria-label="Cerrar informacion de unidad"
            onClick={onClose}
          >
            <CircleX />
          </Button>
        </CardHeader>
        <CardContent className="tower-a-unit-detail-body tower-a-unit-modal-body">
          {unit.renderImage ? (
            <div
              className="tower-a-unit-render-frame"
              style={{
                aspectRatio: `${unit.renderImage.width} / ${unit.renderImage.height}`,
              }}
            >
              <Image
                src={unit.renderImage.src}
                alt={unit.renderImage.alt}
                fill
                sizes="(max-width: 900px) 100vw, 68vw"
                className="tower-a-unit-render-image"
              />
              <span className="tower-a-unit-render-label">
                Tipo {unit.unitNumber}
              </span>
            </div>
          ) : (
            <div className="tower-a-unit-render-slot">
              <ImageIcon />
              <span>Render individual pendiente</span>
            </div>
          )}

          <div className="tower-a-unit-modal-info">
            <div className="tower-a-unit-detail-grid">
              <SummaryItem
                icon={Ruler}
                label="Area"
                value={unit.totalArea ? `${formatNumber(unit.totalArea)} m2` : "N/D"}
              />
              <SummaryItem icon={BedDouble} label="Alcobas" value={unit.bedrooms ?? "N/D"} />
              <SummaryItem icon={Bath} label="Baños" value={unit.bathrooms ?? "N/D"} />
            </div>

            <div className="tower-a-unit-meta">
              <span>Listing ID</span>
              <strong>{unit.listingId || "N/D"}</strong>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home
  label: string
  value: number | string
}) {
  return (
    <div className="tower-a-summary-item">
      <Icon />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 2,
  }).format(value)
}
