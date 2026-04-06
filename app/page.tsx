import { PropertyShell } from "@/components/premium/property-shell"
import { getFacadeSections, getGallerySections } from "@/lib/gallery-sections"
import { premiumContent } from "@/lib/premium-content"

export default async function Home() {
  const [gallerySections, facadeSections] = await Promise.all([
    getGallerySections(),
    getFacadeSections(),
  ])

  return (
    <PropertyShell
      content={premiumContent}
      gallerySections={gallerySections}
      facadeSections={facadeSections}
    />
  )
}
