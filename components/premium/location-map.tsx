"use client"

import { useEffect, useMemo, useState } from "react"
import L from "leaflet"
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet"

import type {
  LocationMapContent,
  LocationRoad,
  MapCoordinate,
} from "@/lib/premium-content"

type LocationMapProps = {
  content: LocationMapContent
  selectedRoadId: string | null
}

export function LocationMap({ content, selectedRoadId }: LocationMapProps) {
  const [serverRoads, setServerRoads] = useState<LocationRoad[] | null>(null)

  useEffect(() => {
    let isCancelled = false

    const loadRoads = async () => {
      try {
        const response = await fetch("/api/location-roads", {
          cache: "no-store",
        })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as {
          roads?: Array<{ id: string; name: string; path: MapCoordinate[] }>
        }

        if (isCancelled || !payload.roads?.length) {
          return
        }

        const mergedRoads = content.roads.map((road) => {
          const serverRoad = payload.roads?.find((item) => item.id === road.id)
          return serverRoad
            ? {
                ...road,
                path: serverRoad.path,
              }
            : road
        })

        setServerRoads(mergedRoads)
      } catch {
        // Keep the curated fallback when the OSM geometry endpoint is unavailable.
      }
    }

    void loadRoads()

    return () => {
      isCancelled = true
    }
  }, [content.roads])

  const roads = serverRoads ?? content.roads
  const selectedRoad = roads.find((road) => road.id === selectedRoadId) ?? null

  const projectMarkerIcon = useMemo(() => {
    return L.divIcon({
      className: "property-map-marker",
      html: `
        <div class="property-map-marker-shell">
          <span class="property-map-marker-core"></span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
  }, [])

  return (
    <div className="property-map-pane">
      <MapContainer
        center={[content.initialView.lat, content.initialView.lng]}
        zoom={content.initialView.zoom}
        zoomControl={false}
        className="property-map-canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewportSync
          content={content}
          roads={roads}
          selectedRoad={selectedRoad}
        />

        <Marker
          position={[content.project.lat, content.project.lng]}
          icon={projectMarkerIcon}
        />

        <Polygon
          positions={content.terrain.path.map((point) => [point.lat, point.lng] as const)}
          pathOptions={{
            color: content.terrain.strokeColor,
            weight: 3,
            opacity: 0.9,
            fillColor: content.terrain.fillColor,
            fillOpacity: 0.38,
          }}
        >
          <Tooltip direction="center" permanent className="property-map-terrain-label">
            {content.terrain.label}
          </Tooltip>
        </Polygon>

        {roads.map((road) => (
          <Polyline
            key={road.id}
            positions={road.path.map((point) => [point.lat, point.lng] as const)}
            pathOptions={{
              color: road.color,
              weight: selectedRoadId === road.id ? 7 : 5,
              opacity: selectedRoadId === road.id ? 0.95 : 0.7,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}

function MapViewportSync({
  content,
  roads,
  selectedRoad,
}: {
  content: LocationMapContent
  roads: LocationRoad[]
  selectedRoad: LocationRoad | null
}) {
  const map = useMap()

  useEffect(() => {
    if (selectedRoad) {
      const bounds = L.latLngBounds(
        selectedRoad.path.map((point) => [point.lat, point.lng] as [number, number])
      )

      bounds.extend([content.project.lat, content.project.lng])

      map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 16,
      })
      return
    }

    const initialBounds = buildRoadBounds(roads)
    initialBounds.extend([content.project.lat, content.project.lng])

    map.fitBounds(initialBounds, {
      padding: [80, 80],
      maxZoom: content.initialView.zoom,
    })
  }, [
    content.initialView.zoom,
    content.project.lat,
    content.project.lng,
    map,
    roads,
    selectedRoad,
  ])

  return null
}

function buildRoadBounds(roads: LocationRoad[]) {
  const allPoints = roads.flatMap((road) => road.path)
  const firstPoint = allPoints[0] ?? { lat: 4.576863, lng: -75.646213 }
  const bounds = L.latLngBounds([
    [firstPoint.lat, firstPoint.lng],
    [firstPoint.lat, firstPoint.lng],
  ])

  allPoints.forEach((point: MapCoordinate) => {
    bounds.extend([point.lat, point.lng])
  })

  return bounds
}
