import { PropertyShell } from "@/components/premium/property-shell"
import { getGallerySections } from "@/lib/gallery-sections"
import { premiumContent } from "@/lib/premium-content"

export default async function Home() {
  const gallerySections = await getGallerySections()

  return <PropertyShell content={premiumContent} gallerySections={gallerySections} />
}
