import type { TowerAFloorMarkerMap, TowerAUnitMarker } from "@/lib/tower-a-types"
import { TOWER_A_FLOORS } from "@/lib/tower-a-types"

const TYPICAL_SEVEN_UNIT_FLOOR_MARKERS: TowerAUnitMarker[] = [
  { unitNumber: 1, x: 0.62, y: 0.25 },
  { unitNumber: 2, x: 0.62, y: 0.47 },
  { unitNumber: 3, x: 0.64, y: 0.75 },
  { unitNumber: 4, x: 0.37, y: 0.75 },
  { unitNumber: 5, x: 0.37, y: 0.56 },
  { unitNumber: 6, x: 0.37, y: 0.38 },
  { unitNumber: 7, x: 0.35, y: 0.2 },
]

const FIRST_FLOOR_MARKERS: TowerAUnitMarker[] = [
  { unitNumber: 1, x: 0.25, y: 0.44 },
  { unitNumber: 2, x: 0.3, y: 0.22 },
  { unitNumber: 3, x: 0.4, y: 0.12 },
  { unitNumber: 4, x: 0.55, y: 0.12 },
  { unitNumber: 5, x: 0.65, y: 0.29 },
  { unitNumber: 6, x: 0.65, y: 0.5 },
  { unitNumber: 7, x: 0.65, y: 0.75 },
  { unitNumber: 8, x: 0.55, y: 0.8 },
  { unitNumber: 9, x: 0.4, y: 0.8 },
  { unitNumber: 10, x: 0.31, y: 0.78 },
  { unitNumber: 11, x: 0.25, y: 0.55 },
]

export const towerAFloorMarkers: TowerAFloorMarkerMap = Object.fromEntries(
  TOWER_A_FLOORS.map((floor) => [
    floor,
    (floor === 1 ? FIRST_FLOOR_MARKERS : TYPICAL_SEVEN_UNIT_FLOOR_MARKERS).map(
      (marker) => ({ ...marker })
    ),
  ])
) as TowerAFloorMarkerMap
