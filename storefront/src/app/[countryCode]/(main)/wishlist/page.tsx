import { Metadata } from "next"
import { notFound } from "next/navigation"
import WishlistTemplate from "@modules/wishlist/templates"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Wunschliste",
  description: "Ihre gespeicherten Lieblingsprodukte",
}

type Props = { params: Promise<{ countryCode: string }> }

export default async function WishlistPage({ params }: Props) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)
  if (!region) notFound()

  return <WishlistTemplate region={region} countryCode={countryCode} />
}
