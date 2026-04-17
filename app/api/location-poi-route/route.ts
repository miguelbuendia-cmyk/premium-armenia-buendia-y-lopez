import { NextRequest, NextResponse } from "next/server"

import {
  premiumContent,
  type LocationRoute,
  type LocationRouteDestinationKind,
} from "@/lib/premium-content"

const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving"

type OsrmRouteResponse = {
  code?: string
  routes?: Array<{
    distance: number
    duration: number
    geometry?: {
      coordinates?: number[][]
    }
  }>
}

export async function GET(request: NextRequest) {
  const destinationKind = (request.nextUrl.searchParams.get("kind") ??
    "poi") as LocationRouteDestinationKind
  const destinationId =
    request.nextUrl.searchParams.get("id") ??
    request.nextUrl.searchParams.get("poiId")

  if (!destinationId) {
    return NextResponse.json(
      { error: "Missing destination id query parameter" },
      { status: 400 }
    )
  }

  const destination =
    destinationKind === "education"
      ? premiumContent.locationMap.educationPoints.find(
          (item) => item.id === destinationId
        )
      : premiumContent.locationMap.pois.find((item) => item.id === destinationId)

  if (!destination) {
    return NextResponse.json({ error: "Location destination not found" }, { status: 404 })
  }

  const { project } = premiumContent.locationMap
  const origin = `${project.lng},${project.lat}`
  const destinationCoordinates = `${destination.routeTarget.lng},${destination.routeTarget.lat}`
  const url = `${OSRM_ROUTE_URL}/${origin};${destinationCoordinates}?overview=full&geometries=geojson&steps=false`

  try {
    const response = await fetch(url, {
      next: {
        revalidate: 86400,
      },
    })

    if (!response.ok) {
      throw new Error(`OSRM request failed with ${response.status}`)
    }

    const payload = (await response.json()) as OsrmRouteResponse
    const route = payload.routes?.[0]
    const coordinates = route?.geometry?.coordinates ?? []

    if (!route || coordinates.length < 2) {
      throw new Error("OSRM did not return a usable route")
    }

    const routePath = coordinates.map((coordinate) => ({
      lng: coordinate[0] ?? project.lng,
      lat: coordinate[1] ?? project.lat,
    }))

    const serializedRoute: LocationRoute = {
      destinationId: destination.id,
      destinationKind,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      path: buildDisplayRoutePath(project, routePath, destination.routeTarget),
    }

    return NextResponse.json({ route: serializedRoute })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown poi route error"

    return NextResponse.json({ error: message }, { status: 502 })
  }
}

function buildDisplayRoutePath(
  origin: { lat: number; lng: number },
  routePath: Array<{ lat: number; lng: number }>,
  destination: { lat: number; lng: number }
) {
  const points = [...routePath]

  if (!points.length) {
    return [origin, destination]
  }

  const firstPoint = points[0]
  if (!samePoint(origin, firstPoint)) {
    points.unshift(origin)
  }

  const lastPoint = points[points.length - 1]
  if (!samePoint(destination, lastPoint)) {
    points.push(destination)
  }

  return points
}

function samePoint(
  left: { lat: number; lng: number },
  right: { lat: number; lng: number }
) {
  return (
    Math.abs(left.lat - right.lat) < 0.000001 &&
    Math.abs(left.lng - right.lng) < 0.000001
  )
}
