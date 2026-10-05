import { HttpTypes } from "@medusajs/types"

import { getHomeLooks } from "@lib/data/home"
import {
  HOME_SPOTLIGHT_LOOK,
  pickSpotlight,
} from "@modules/home/lib/home-looks"
import FeaturedProducts from "."

/**
 * „Ausgewählte Produkte“ auf der Startseite: ohne die Teile, die schon in
 * „Shop the Look“ stehen, und mit der Saison in der Dachzeile. Die Looks
 * kommen aus demselben Anfrage-Cache wie die Abschnitte darüber.
 */
export default async function HomeFeatured({
  countryCode,
  region,
}: {
  countryCode: string
  region: HttpTypes.StoreRegion
}) {
  const { overview, looks, season } = await getHomeLooks(countryCode)
  const spotlight = pickSpotlight({
    overview,
    looks,
    preferred: HOME_SPOTLIGHT_LOOK,
  })

  return (
    <FeaturedProducts
      region={region}
      excludeIds={spotlight?.productIds ?? []}
      seasonTitle={season?.title ?? null}
    />
  )
}
