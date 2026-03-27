import { NextResponse } from "next/server"

type OverpassElement =
  | {
      type: "node"
      id: number
      lat: number
      lon: number
    }
  | {
      type: "way"
      id: number
      nodes: number[]
      tags?: Record<string, string>
    }

type RoadDefinition = {
  id: string
  label: string
  match: {
    name?: string
    ref?: string
    highway?: string
  }
  preferredWayIds?: number[]
}

const ROAD_DEFINITIONS: RoadDefinition[] = [
  {
    id: "via-armenia-pereira",
    label: "Via Armenia - Pereira",
    match: {
      ref: "29",
      highway: "primary",
    },
    preferredWayIds: [333689403, 914975249, 1309160073, 541630190],
  },
]

const SEARCH_RADIUS_METERS = 1200
const OVERPASS_URL = "https://overpass.kumi.systems/api/interpreter"
const PROJECT_LOCATION = {
  lat: 4.576863,
  lng: -75.646213,
}

export async function GET() {
  try {
    const results = await Promise.all(
      ROAD_DEFINITIONS.map(async (definition) => {
        const query = buildRoadQuery(
          PROJECT_LOCATION.lat,
          PROJECT_LOCATION.lng,
          definition.match
        )
        const response = await fetch(OVERPASS_URL, {
          method: "POST",
          headers: {
            "content-type": "text/plain;charset=UTF-8",
          },
          body: query,
          next: {
            revalidate: 86400,
          },
        })

        if (!response.ok) {
          throw new Error(`Overpass request failed with ${response.status}`)
        }

        const payload = (await response.json()) as {
          elements?: OverpassElement[]
        }

        return extractBestRoad(payload.elements ?? [], definition)
      })
    )

    const roads = results.filter(
      (road): road is NonNullable<typeof road> => Boolean(road)
    )

    return NextResponse.json({ roads })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown map roads error"

    return NextResponse.json({ roads: [], error: message }, { status: 200 })
  }
}

function buildRoadQuery(
  lat: number,
  lng: number,
  match: RoadDefinition["match"]
) {
  const filters = [`["highway"]`]

  if (match.name) {
    filters.push(`["name"="${match.name}"]`)
  }

  if (match.ref) {
    filters.push(`["ref"="${match.ref}"]`)
  }

  if (match.highway) {
    filters[0] = `["highway"="${match.highway}"]`
  }

  return `[out:json][timeout:25];way${filters.join("")}(around:${SEARCH_RADIUS_METERS},${lat},${lng});(._;>;);out body;`
}

function extractBestRoad(
  elements: OverpassElement[],
  definition: RoadDefinition
) {
  const nodes = new Map<number, { lat: number; lng: number }>()

  elements.forEach((element) => {
    if (element.type === "node") {
      nodes.set(element.id, {
        lat: element.lat,
        lng: element.lon,
      })
    }
  })

  const candidates = elements
    .filter(
      (element): element is Extract<OverpassElement, { type: "way" }> =>
        element.type === "way" && matchesDefinition(element.tags, definition.match)
    )
    .map((way) => {
      const path = way.nodes
        .map((nodeId) => nodes.get(nodeId))
        .filter((point): point is { lat: number; lng: number } => Boolean(point))

      return {
        id: definition.id,
        name: definition.label,
        path,
        nearestDistance: Math.min(
          ...path.map((point) => getDistanceToProject(point.lat, point.lng))
        ),
      }
    })
    .filter((road) => road.path.length > 1)
    .sort((left, right) => left.nearestDistance - right.nearestDistance)

  if (definition.preferredWayIds?.length) {
    const mergedPath = mergePreferredWays(
      elements,
      nodes,
      definition.preferredWayIds
    )

    if (mergedPath.length > 1) {
      return {
        id: definition.id,
        name: definition.label,
        path: mergedPath,
      }
    }
  }

  const bestRoad = candidates[0]

  if (!bestRoad) {
    return null
  }

  return {
    id: bestRoad.id,
    name: bestRoad.name,
    path: bestRoad.path,
  }
}

function mergePreferredWays(
  elements: OverpassElement[],
  nodes: Map<number, { lat: number; lng: number }>,
  preferredWayIds: number[]
) {
  const ways = elements.filter(
    (element): element is Extract<OverpassElement, { type: "way" }> =>
      element.type === "way" && preferredWayIds.includes(element.id)
  )

  const orderedPaths = preferredWayIds
    .map((wayId) => ways.find((way) => way.id === wayId))
    .filter((way): way is Extract<OverpassElement, { type: "way" }> => Boolean(way))
    .map((way) =>
      way.nodes
        .map((nodeId) => nodes.get(nodeId))
        .filter((point): point is { lat: number; lng: number } => Boolean(point))
    )
    .filter((path) => path.length > 1)

  return orderedPaths.reduce<Array<{ lat: number; lng: number }>>((merged, path) => {
    if (!merged.length) {
      return [...path]
    }

    const lastPoint = merged[merged.length - 1]
    const firstPoint = path[0]
    const lastPathPoint = path[path.length - 1]
    const directDistance = getPointDistance(lastPoint, firstPoint)
    const reversedDistance = getPointDistance(lastPoint, lastPathPoint)
    const normalizedPath = reversedDistance < directDistance ? [...path].reverse() : path

    const startIndex =
      samePoint(lastPoint, normalizedPath[0]) ? 1 : 0

    return merged.concat(normalizedPath.slice(startIndex))
  }, [])
}

function matchesDefinition(
  tags: Record<string, string> | undefined,
  match: RoadDefinition["match"]
) {
  if (!tags) {
    return false
  }

  if (match.name && tags.name !== match.name) {
    return false
  }

  if (match.ref && tags.ref !== match.ref) {
    return false
  }

  if (match.highway && tags.highway !== match.highway) {
    return false
  }

  return true
}

function getDistanceToProject(lat: number, lng: number) {
  const latDiff = lat - PROJECT_LOCATION.lat
  const lngDiff = lng - PROJECT_LOCATION.lng

  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
}

function getPointDistance(
  left: { lat: number; lng: number },
  right: { lat: number; lng: number }
) {
  const latDiff = left.lat - right.lat
  const lngDiff = left.lng - right.lng

  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
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
