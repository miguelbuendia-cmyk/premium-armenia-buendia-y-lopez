import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PanoTour } from "@/components/premium/pano-tour"
import { apartmentTours, getTourBySlug } from "@/lib/tours"

export function generateStaticParams() {
  return apartmentTours.map((tour) => ({ tipo: tour.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string }>
}): Promise<Metadata> {
  const { tipo } = await params
  const tour = getTourBySlug(tipo)
  if (!tour) {
    return { title: "Tour virtual" }
  }
  return {
    title: `${tour.title} · Tour virtual 360°`,
    description: `Recorrido virtual 360° del ${tour.title} en Premium Armenia Buendía y López.`,
  }
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ tipo: string }>
}) {
  const { tipo } = await params
  const tour = getTourBySlug(tipo)
  if (!tour) {
    notFound()
  }
  return <PanoTour tour={tour} />
}
