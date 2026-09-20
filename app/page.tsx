import { connection } from "next/server"

import { HomeIntroGate } from "@/components/premium/home-intro-gate"
import { getFacadeSections, getGallerySections } from "@/lib/gallery-sections"
import { premiumContent } from "@/lib/premium-content"
import { getTowerAExplorerData } from "@/lib/tower-a-data"
import type { ExplorerReturnState } from "@/lib/tower-a-types"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ plantas?: string; unidad?: string }>
}) {
  await connection()

  const [gallerySections, facadeSections, towerAExplorerData, params] =
    await Promise.all([
      getGallerySections(),
      getFacadeSections(),
      getTowerAExplorerData(),
      searchParams,
    ])

  // /?plantas=<piso>&unidad=<codigo>: regreso desde un tour virtual directo al
  // explorador de plantas, saltando la intro.
  const floor = Number(params.plantas)
  const returnToExplorer: ExplorerReturnState | null =
    params.plantas !== undefined
      ? {
          floor: Number.isFinite(floor) && floor > 0 ? floor : null,
          unitCode: params.unidad ?? null,
        }
      : null

  return (
    <HomeIntroGate
      content={premiumContent}
      gallerySections={gallerySections}
      facadeSections={facadeSections}
      towerAExplorerData={towerAExplorerData}
      returnToExplorer={returnToExplorer}
    />
  )
}
