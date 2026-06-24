import { connection } from "next/server"

import { HomeIntroGate } from "@/components/premium/home-intro-gate"
import { getFacadeSections, getGallerySections } from "@/lib/gallery-sections"
import { premiumContent } from "@/lib/premium-content"
import { getTowerAExplorerData } from "@/lib/tower-a-data"

export default async function Home() {
  await connection()

  const [gallerySections, facadeSections, towerAExplorerData] = await Promise.all([
    getGallerySections(),
    getFacadeSections(),
    getTowerAExplorerData(),
  ])

  return (
    <HomeIntroGate
      content={premiumContent}
      gallerySections={gallerySections}
      facadeSections={facadeSections}
      towerAExplorerData={towerAExplorerData}
    />
  )
}
