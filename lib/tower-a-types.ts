export const TOWER_A_FLOORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const

export type TowerAUnitStatus = "available" | "reserved" | "sold" | "unknown"

export type TowerAImage = {
  alt: string
  height: number
  src: string
  width: number
}

export type TowerAInventoryUnit = {
  bathrooms: number | null
  bedrooms: number | null
  floor: number
  furnishedStatus: string | null
  listingId: string
  marketValue: number | null
  orientation: string | null
  renderImage: TowerAImage | null
  rowName: string
  status: TowerAUnitStatus
  statusLabel: string
  totalArea: number | null
  unitCode: string
  unitNumber: number
}

export type TowerAFloorPlan = {
  floor: number
  image: TowerAImage | null
  units: TowerAInventoryUnit[]
}

export type TowerAUnitMarker = {
  unitNumber: number
  x: number
  y: number
}

export type TowerAFloorMarkerMap = Record<number, TowerAUnitMarker[]>

export type TowerAExplorerData = {
  csvSourceUrl: string
  floors: TowerAFloorPlan[]
  markerMap: TowerAFloorMarkerMap
}
