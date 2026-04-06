import { HomeIntroGate } from "@/components/premium/home-intro-gate"
import { getFacadeSections, getGallerySections } from "@/lib/gallery-sections"
import { premiumContent } from "@/lib/premium-content"

export default async function Home() {
  const [gallerySections, facadeSections] = await Promise.all([
    getGallerySections(),
    getFacadeSections(),
  ])

  return (
    <HomeIntroGate
      content={premiumContent}
      gallerySections={gallerySections}
      facadeSections={facadeSections}
    />
  )
}
