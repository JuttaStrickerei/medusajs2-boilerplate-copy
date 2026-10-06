import { getHomeLooks } from "@lib/data/home"
import {
  HOME_SPOTLIGHT_LOOK,
  RAIL_MAX_LOOKS,
  doorBands,
  pickRailLooks,
  pickSpotlight,
} from "@modules/home/lib/home-looks"
import LooksRail from "./looks-rail"
import WorldDoors from "./world-doors"

/**
 * Looks auf der Startseite: erst die Farbwelten als Türen, dann eine Reihe
 * weiterer Looks. Ohne Looks rendert der Abschnitt nichts (die Produkte
 * darunter bleiben).
 */
export default async function HomeLooks({
  countryCode,
}: {
  countryCode: string
}) {
  const { overview, season, looks } = await getHomeLooks(countryCode)

  if (!overview.ordered.length) {
    return null
  }

  const doors = doorBands(overview)
  const spotlight = pickSpotlight({
    overview,
    looks,
    preferred: HOME_SPOTLIGHT_LOOK,
  })
  const pieceCount = new Map(looks.map((l) => [l.handle, l.product_ids.length]))
  // Nichts doppelt: Aufmacher der Türen und der „Shop the Look“-Look fehlen
  const railLooks = pickRailLooks({
    bands: overview.bands,
    exclude: [
      ...doors.map((band) => band.looks[0].handle),
      ...(spotlight ? [spotlight.tile.handle] : []),
    ],
    pieceCountOf: (handle) => pieceCount.get(handle) ?? 0,
    max: RAIL_MAX_LOOKS,
  })
  const total = overview.ordered.length
  const eyebrow = season ? `Shop the Look · ${season.title}` : "Shop the Look"
  const hasDoors = doors.length > 0

  return (
    <>
      {hasDoors && (
        <WorldDoors bands={doors} eyebrow={eyebrow} lookCount={total} />
      )}
      {railLooks.length > 0 && (
        <LooksRail
          looks={railLooks}
          total={total}
          bands={doors}
          title={hasDoors ? "Looks der Saison" : "Unsere Looks"}
          eyebrow={hasDoors ? null : eyebrow}
        />
      )}
    </>
  )
}
