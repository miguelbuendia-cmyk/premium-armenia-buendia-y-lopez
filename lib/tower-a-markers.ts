import type { TowerAFloorMarkerMap, TowerAUnitMarker } from "@/lib/tower-a-types"
import { TOWER_A_FLOORS } from "@/lib/tower-a-types"

const TYPICAL_SEVEN_UNIT_FLOOR_MARKERS: TowerAUnitMarker[] = [
  { unitNumber: 1, x: 0.31, y: 0.2 },
  { unitNumber: 2, x: 0.62, y: 0.18 },
  { unitNumber: 3, x: 0.64, y: 0.36 },
  { unitNumber: 4, x: 0.63, y: 0.56 },
  { unitNumber: 5, x: 0.6, y: 0.82 },
  { unitNumber: 6, x: 0.37, y: 0.82 },
  { unitNumber: 7, x: 0.31, y: 0.54 },
]

export const towerAFloorMarkers: TowerAFloorMarkerMap = Object.fromEntries(
  TOWER_A_FLOORS.map((floor) => [
    floor,
    TYPICAL_SEVEN_UNIT_FLOOR_MARKERS.map((marker) => ({ ...marker })),
  ])
) as TowerAFloorMarkerMap
