"use client"

import maplibregl from "maplibre-gl"
import { useEffect, useMemo, useState, type CSSProperties } from "react"

import {
  Map,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
  useMap,
} from "@/components/ui/map"
import type {
  LocationEducationPoint,
  LocationMapContent,
  LocationPoi,
  LocationRoute,
  LocationRouteDestinationKind,
  LocationRouteState,
  LocationRoad,
  MapCoordinate,
} from "@/lib/premium-content"

type LocationMapProps = {
  content: LocationMapContent
  selectedRoadId: string | null
  selectedPoiId: string | null
  selectedEducationId: string | null
  isTerrainSelected: boolean
  onRouteStateChange?: (state: LocationRouteState) => void
}

type PolygonLayerProperties = {
  fillColor: string
  fillOpacity: number
  lineColor: string
  lineOpacity: number
  lineWidth: number
}

const FALLBACK_LOCATION = {
  lat: 4.576306,
  lng: -75.646583,
}

const EMPTY_LOCATION_ROUTE_STATE: LocationRouteState = {
  destinationId: null,
  destinationKind: null,
  isLoading: false,
  error: null,
  route: null,
}

export function LocationMap({
  content,
  selectedRoadId,
  selectedPoiId,
  selectedEducationId,
  isTerrainSelected,
  onRouteStateChange,
}: LocationMapProps) {
  const [serverRoads, setServerRoads] = useState<LocationRoad[] | null>(null)
  const [routeCache, setRouteCache] = useState<
    Record<string, LocationRoute>
  >({})
  const projectOrigin = content.project

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

  useEffect(() => {
    const selectedRouteTarget = selectedPoiId
      ? { id: selectedPoiId, kind: "poi" as const }
      : selectedEducationId
        ? { id: selectedEducationId, kind: "education" as const }
        : null

    if (!selectedRouteTarget) {
      onRouteStateChange?.(EMPTY_LOCATION_ROUTE_STATE)
      return
    }

    const cacheKey = getRouteCacheKey(
      selectedRouteTarget.kind,
      selectedRouteTarget.id,
      projectOrigin
    )
    const cachedRoute = routeCache[cacheKey]

    if (cachedRoute) {
      onRouteStateChange?.({
        destinationId: selectedRouteTarget.id,
        destinationKind: selectedRouteTarget.kind,
        isLoading: false,
        error: null,
        route: cachedRoute,
      })
      return
    }

    let isCancelled = false

    const loadRoute = async () => {
      onRouteStateChange?.({
        destinationId: selectedRouteTarget.id,
        destinationKind: selectedRouteTarget.kind,
        isLoading: true,
        error: null,
        route: null,
      })

      try {
        const response = await fetch(
          `/api/location-poi-route?kind=${encodeURIComponent(selectedRouteTarget.kind)}&id=${encodeURIComponent(selectedRouteTarget.id)}&originLat=${encodeURIComponent(projectOrigin.lat)}&originLng=${encodeURIComponent(projectOrigin.lng)}`,
          {
            cache: "no-store",
          }
        )

        const payload = (await response.json()) as {
          error?: string
          route?: LocationRoute
        }

        if (!response.ok || !payload.route) {
          throw new Error(payload.error ?? "No pudimos calcular la ruta")
        }

        if (isCancelled) {
          return
        }

        setRouteCache((currentCache) => ({
          ...currentCache,
          [cacheKey]: payload.route!,
        }))

        onRouteStateChange?.({
          destinationId: selectedRouteTarget.id,
          destinationKind: selectedRouteTarget.kind,
          isLoading: false,
          error: null,
          route: payload.route,
        })
      } catch (error) {
        if (isCancelled) {
          return
        }

        onRouteStateChange?.({
          destinationId: selectedRouteTarget.id,
          destinationKind: selectedRouteTarget.kind,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "No pudimos calcular la ruta",
          route: null,
        })
      }
    }

    void loadRoute()

    return () => {
      isCancelled = true
    }
  }, [
    onRouteStateChange,
    projectOrigin,
    routeCache,
    selectedEducationId,
    selectedPoiId,
  ])

  const roads = serverRoads ?? content.roads
  const selectedRoad = roads.find((road) => road.id === selectedRoadId) ?? null
  const selectedPoi = content.pois.find((poi) => poi.id === selectedPoiId) ?? null
  const selectedEducationPoint =
    content.educationPoints.find(
      (educationPoint) => educationPoint.id === selectedEducationId
    ) ?? null
  const activeRoute = selectedPoiId
    ? routeCache[getRouteCacheKey("poi", selectedPoiId, projectOrigin)] ?? null
    : selectedEducationId
      ? routeCache[
          getRouteCacheKey("education", selectedEducationId, projectOrigin)
        ] ?? null
      : null
  const selectedRoutePreviewPath = useMemo(() => {
    const routeTarget =
      selectedPoi?.routeTarget ?? selectedEducationPoint?.routeTarget ?? null

    if (!routeTarget || activeRoute) {
      return null
    }

    return [projectOrigin, routeTarget]
  }, [activeRoute, projectOrigin, selectedEducationPoint, selectedPoi])

  const terrainLayerData = useMemo<
    GeoJSON.FeatureCollection<GeoJSON.Polygon, PolygonLayerProperties>
  >(
    () => ({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            fillColor: content.terrain.strokeColor,
            fillOpacity: isTerrainSelected ? 0.24 : 0.16,
            lineColor: content.terrain.strokeColor,
            lineOpacity: isTerrainSelected ? 1 : 0.9,
            lineWidth: isTerrainSelected ? 5 : 3,
          },
          geometry: {
            type: "Polygon",
            coordinates: [toClosedLngLatPath(content.terrain.path)],
          },
        },
      ],
    }),
    [content.terrain.path, content.terrain.strokeColor, isTerrainSelected]
  )

  const poiLayerData = useMemo<
    GeoJSON.FeatureCollection<GeoJSON.Polygon, PolygonLayerProperties>
  >(
    () => ({
      type: "FeatureCollection",
      features: content.pois.map((poi) => {
        const isActive = selectedPoiId === poi.id
        const isDimmed = Boolean(selectedPoiId) && !isActive

        return {
          type: "Feature" as const,
          properties: {
            fillColor: poi.color,
            fillOpacity: isActive ? 0.34 : isDimmed ? 0.08 : 0.18,
            lineColor: poi.color,
            lineOpacity: isActive ? 0.98 : isDimmed ? 0.4 : 0.7,
            lineWidth: isActive ? 4 : 2,
          },
          geometry: {
            type: "Polygon" as const,
            coordinates: [toClosedLngLatPath(poi.path)],
          },
        }
      }),
    }),
    [content.pois, selectedPoiId]
  )

  const terrainCenter = useMemo(
    () => getPolygonCenter(content.terrain.path),
    [content.terrain.path]
  )

  return (
    <div className="property-map-pane">
      <Map
        center={[content.initialView.lng, content.initialView.lat]}
        zoom={content.initialView.zoom}
        className="property-map-canvas"
        theme="light"
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
      >
        <MapViewportSync
          content={content}
          roads={roads}
          pois={content.pois}
          educationPoints={content.educationPoints}
          selectedRoad={selectedRoad}
          selectedRoute={activeRoute}
          selectedRoutePreviewPath={selectedRoutePreviewPath}
          isTerrainSelected={isTerrainSelected}
        />

        <PolygonLayer id="terrain" data={terrainLayerData} />
        <PolygonLayer id="pois" data={poiLayerData} />

        {roads.map((road) => (
          <MapRoute
            key={road.id}
            id={road.id}
            coordinates={toLngLatPath(road.path)}
            color={road.color}
            width={selectedRoadId === road.id ? 7 : 5}
            opacity={selectedRoadId === road.id ? 0.95 : 0.7}
            interactive={false}
          />
        ))}

        {activeRoute?.path.length ? (
          <MapRoute
            id={`location-route-${activeRoute.destinationKind}-${activeRoute.destinationId}`}
            coordinates={toLngLatPath(activeRoute.path)}
            color={selectedPoi?.color ?? selectedEducationPoint?.color ?? "#4285F4"}
            width={6}
            opacity={0.94}
            interactive={false}
          />
        ) : null}

        <MapMarker
          longitude={content.project.lng}
          latitude={content.project.lat}
          anchor="center"
        >
          <MarkerContent>
            <div className="property-map-marker">
              <div className="property-map-marker-shell">
                <span className="property-map-marker-core" />
              </div>
            </div>
          </MarkerContent>
        </MapMarker>

        <MapMarker longitude={terrainCenter.lng} latitude={terrainCenter.lat} anchor="center">
          <MarkerContent className="pointer-events-none">
            <span className="property-map-terrain-label inline-flex items-center px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              {content.terrain.label}
            </span>
          </MarkerContent>
        </MapMarker>

        {content.pois.map((poi) => {
          const center = getPolygonCenter(poi.path)
          const markerOffset = getPoiMarkerOffset(poi.id)
          const isActive = selectedPoiId === poi.id

          return (
            <MapMarker
              key={`poi-marker-${poi.id}`}
              longitude={center.lng}
              latitude={center.lat}
              anchor="bottom"
              offset={markerOffset}
            >
              <MarkerContent className="pointer-events-none">
                <div className="property-map-poi-chip-wrap">
                  <span
                    className={`property-map-poi-chip${
                      isActive ? " property-map-poi-chip-active" : ""
                    }`}
                    style={
                      {
                        "--poi-color": poi.color,
                      } as CSSProperties
                    }
                  >
                    <span className="property-map-poi-chip-dot" aria-hidden="true" />
                    {poi.name}
                  </span>
                </div>
              </MarkerContent>
            </MapMarker>
          )
        })}

        {content.educationPoints.map((educationPoint) => {
          const isActive = selectedEducationId === educationPoint.id

          return (
            <MapMarker
              key={educationPoint.id}
              longitude={educationPoint.location.lng}
              latitude={educationPoint.location.lat}
              anchor="center"
            >
              <MarkerContent>
                <div className="property-map-education-marker">
                  <div
                    className={`property-map-education-marker-shell${
                      isActive ? " property-map-education-marker-shell-active" : ""
                    }`}
                    style={{ color: educationPoint.color }}
                  >
                    <svg
                      className="property-map-education-marker-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21.42 10.922a1 1 0 0 0 0-1.844l-8-4a1 1 0 0 0-.894 0l-8 4a1 1 0 0 0 0 1.844l8 4a1 1 0 0 0 .894 0z" />
                      <path d="M22 10v6" />
                      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                    </svg>
                  </div>
                </div>
                {isActive ? (
                  <MarkerLabel
                    className="property-map-education-label rounded-full px-3 py-1 text-[11px] font-medium"
                  >
                    {educationPoint.name}
                  </MarkerLabel>
                ) : null}
              </MarkerContent>
            </MapMarker>
          )
        })}
      </Map>
    </div>
  )
}

function PolygonLayer({
  id,
  data,
}: {
  id: string
  data: GeoJSON.FeatureCollection<GeoJSON.Polygon, PolygonLayerProperties>
}) {
  const { map, isLoaded } = useMap()
  const sourceId = `${id}-source`
  const fillLayerId = `${id}-fill`
  const outlineLayerId = `${id}-outline`

  useEffect(() => {
    if (!isLoaded || !map) {
      return
    }

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      })
    }

    if (!map.getLayer(fillLayerId)) {
      map.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": ["get", "fillColor"],
          "fill-opacity": ["get", "fillOpacity"],
        },
      })
    }

    if (!map.getLayer(outlineLayerId)) {
      map.addLayer({
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": ["get", "lineColor"],
          "line-opacity": ["get", "lineOpacity"],
          "line-width": ["get", "lineWidth"],
        },
      })
    }

    return () => {
      if (!map.getStyle()) {
        return
      }

      if (map.getLayer(outlineLayerId)) {
        map.removeLayer(outlineLayerId)
      }

      if (map.getLayer(fillLayerId)) {
        map.removeLayer(fillLayerId)
      }

      if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    }
  }, [fillLayerId, isLoaded, map, outlineLayerId, sourceId])

  useEffect(() => {
    if (!isLoaded || !map) {
      return
    }

    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
    source?.setData(data)
  }, [data, isLoaded, map, sourceId])

  return null
}

function MapViewportSync({
  content,
  roads,
  pois,
  educationPoints,
  selectedRoad,
  selectedRoute,
  selectedRoutePreviewPath,
  isTerrainSelected,
}: {
  content: LocationMapContent
  roads: LocationRoad[]
  pois: LocationPoi[]
  educationPoints: LocationEducationPoint[]
  selectedRoad: LocationRoad | null
  selectedRoute: LocationRoute | null
  selectedRoutePreviewPath: MapCoordinate[] | null
  isTerrainSelected: boolean
}) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) {
      return
    }

    if (selectedRoad) {
      fitMapToPath(map, selectedRoad.path, 64, 17)
      return
    }

    if (selectedRoute?.path.length) {
      fitMapToPath(map, selectedRoute.path, 72, 17)
      return
    }

    if (selectedRoutePreviewPath?.length) {
      fitMapToPath(map, selectedRoutePreviewPath, 72, 17)
      return
    }

    if (isTerrainSelected) {
      fitMapToPath(map, content.terrain.path, 64, 18)
      return
    }

    const bounds = buildLocationBounds(content, roads, pois, educationPoints)
    map.stop()
    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: content.initialView.zoom,
    })
  }, [
    content,
    educationPoints,
    isLoaded,
    isTerrainSelected,
    map,
    pois,
    roads,
    selectedRoute,
    selectedRoutePreviewPath,
    selectedRoad,
  ])

  return null
}

function buildLocationBounds(
  content: LocationMapContent,
  roads: LocationRoad[],
  pois: LocationPoi[],
  educationPoints: LocationEducationPoint[]
) {
  const allPoints = [
    content.project,
    ...content.terrain.path,
    ...roads.flatMap((road) => road.path),
    ...pois.flatMap((poi) => poi.path),
    ...educationPoints.map((educationPoint) => educationPoint.location),
  ]

  return buildBoundsFromPoints(allPoints)
}

function fitMapToPath(
  map: maplibregl.Map,
  points: MapCoordinate[],
  padding: number,
  maxZoom: number
) {
  if (!points.length) {
    return
  }

  if (points.length === 1) {
    const point = points[0]
    map.stop()
    map.flyTo({
      center: [point.lng, point.lat],
      zoom: maxZoom,
      duration: 850,
    })
    return
  }

  map.stop()
  map.fitBounds(buildBoundsFromPoints(points), {
    padding,
    maxZoom,
  })
}

function buildBoundsFromPoints(points: MapCoordinate[]) {
  const firstPoint = points[0] ?? FALLBACK_LOCATION
  const bounds = new maplibregl.LngLatBounds(
    [firstPoint.lng, firstPoint.lat],
    [firstPoint.lng, firstPoint.lat]
  )

  points.forEach((point) => {
    bounds.extend([point.lng, point.lat])
  })

  return bounds
}

function toLngLatPath(path: MapCoordinate[]) {
  return path.map((point) => [point.lng, point.lat] as [number, number])
}

function toClosedLngLatPath(path: MapCoordinate[]) {
  const normalizedPath = toLngLatPath(path)

  if (!normalizedPath.length) {
    return normalizedPath
  }

  const firstPoint = normalizedPath[0]
  const lastPoint = normalizedPath[normalizedPath.length - 1]

  if (firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1]) {
    return normalizedPath
  }

  return [...normalizedPath, firstPoint]
}

function getRouteCacheKey(
  kind: LocationRouteDestinationKind,
  id: string,
  origin: MapCoordinate
) {
  return `${kind}:${id}:${origin.lat.toFixed(6)}:${origin.lng.toFixed(6)}`
}

function getPoiMarkerOffset(poiId: string): [number, number] {
  if (poiId === "mall-portico") {
    return [34, -8]
  }

  if (poiId === "mall-campestre") {
    return [-8, -6]
  }

  return [0, -6]
}

function getPolygonCenter(path: MapCoordinate[]) {
  if (!path.length) {
    return FALLBACK_LOCATION
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
