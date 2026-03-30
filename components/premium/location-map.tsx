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
  LocationPoi,
  LocationRoad,
  MapCoordinate,
} from "@/lib/premium-content"

type LocationMapProps = {
  content: LocationMapContent
  selectedRoadId: string | null
  selectedPoiId: string | null
  isTerrainSelected: boolean
}

export function LocationMap({
  content,
  selectedRoadId,
  selectedPoiId,
  isTerrainSelected,
}: LocationMapProps) {
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
  const selectedPoi = content.pois.find((poi) => poi.id === selectedPoiId) ?? null

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
          pois={content.pois}
          selectedRoad={selectedRoad}
          selectedPoi={selectedPoi}
          isTerrainSelected={isTerrainSelected}
        />

        <Marker
          position={[content.project.lat, content.project.lng]}
          icon={projectMarkerIcon}
        />

        <Polygon
          positions={content.terrain.path.map((point) => [point.lat, point.lng] as const)}
          pathOptions={{
            color: content.terrain.strokeColor,
            weight: isTerrainSelected ? 5 : 3,
            opacity: isTerrainSelected ? 1 : 0.9,
            fillColor: content.terrain.fillColor,
            fillOpacity: isTerrainSelected ? 0.52 : 0.38,
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

        {content.pois.map((poi) => {
          const isActive = selectedPoiId === poi.id
          const isDimmed = Boolean(selectedPoiId) && !isActive

          return (
            <Polygon
              key={poi.id}
              positions={poi.path.map((point) => [point.lat, point.lng] as const)}
              pathOptions={{
                color: poi.color,
                weight: isActive ? 4 : 2,
                opacity: isActive ? 0.98 : isDimmed ? 0.4 : 0.7,
                fillColor: poi.color,
                fillOpacity: isActive ? 0.34 : isDimmed ? 0.08 : 0.18,
              }}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}

function MapViewportSync({
  content,
  roads,
  pois,
  selectedRoad,
  selectedPoi,
  isTerrainSelected,
}: {
  content: LocationMapContent
  roads: LocationRoad[]
  pois: LocationPoi[]
  selectedRoad: LocationRoad | null
  selectedPoi: LocationPoi | null
  isTerrainSelected: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (selectedRoad) {
      const bounds = L.latLngBounds(
        selectedRoad.path.map((point) => [point.lat, point.lng] as [number, number])
      )

      map.fitBounds(bounds, {
        padding: [56, 56],
        maxZoom: 17,
      })
      return
    }

    if (selectedPoi) {
      const center = getPolygonCenter(selectedPoi.path)
      map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 17), {
        animate: true,
        duration: 0.85,
      })
      return
    }

    if (isTerrainSelected) {
      const terrainBounds = L.latLngBounds(
        content.terrain.path.map((point) => [point.lat, point.lng] as [number, number])
      )

      map.fitBounds(terrainBounds, {
        padding: [56, 56],
        maxZoom: 18,
      })
      return
    }

    const initialBounds = buildLocationBounds(content, roads, pois)

    map.fitBounds(initialBounds, {
      padding: [80, 80],
      maxZoom: content.initialView.zoom,
    })
  }, [
    content.initialView.zoom,
    content.project.lat,
    content.project.lng,
    content.terrain.path,
    isTerrainSelected,
    map,
    pois,
    roads,
    selectedPoi,
    selectedRoad,
  ])

  return null
}

function buildLocationBounds(
  content: LocationMapContent,
  roads: LocationRoad[],
  pois: LocationPoi[]
) {
  const allPoints = [
    content.project,
    ...content.terrain.path,
    ...roads.flatMap((road) => road.path),
    ...pois.flatMap((poi) => poi.path),
  ]
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

function getPolygonCenter(path: MapCoordinate[]) {
  if (!path.length) {
    return { lat: 4.576863, lng: -75.646213 }
  }

  const totals = path.reduce(
    (accumulator, point) => ({
      lat: accumulator.lat + point.lat,
      lng: accumulator.lng + point.lng,
    }),
    { lat: 0, lng: 0 }
  )

  return {
    lat: totals.lat / path.length,
    lng: totals.lng / path.length,
  }
}
