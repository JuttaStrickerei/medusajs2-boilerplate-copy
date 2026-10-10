import "server-only"

import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

import {
  buildOverview,
  minioHostFrom,
  type OverviewVM,
} from "@modules/looks/lib/overview"
import { looksOfSeason, type LookSeason } from "@modules/looks/lib/seasons"
import { getLookSeasonIndex } from "./look-seasons"
import { listLooksForOverview, type StoreLook } from "./looks"
import { listProducts } from "./products"

export type HomeLooks = {
  overview: OverviewVM
  /** null = keine Saisons bekannt */
  season: LookSeason | null
  /** Looks der aktuellen Saison (für Teile-Anzahl und Produkt-IDs) */
  looks: StoreLook[]
}

const NO_LOOKS: HomeLooks = {
  overview: { bands: [], ordered: [], showNav: false },
  season: null,
  looks: [],
}

/**
 * Looks der aktuellen Saison für die Startseite, einmal pro Anfrage
 * (Farbwelten, Looks-Reihe und „Shop the Look“ teilen sich das Ergebnis).
 * Gleiche Looks wie /looks, daher dieselbe Preisabfrage und derselbe
 * Cache-Eintrag. Scheitert etwas, zeigt die Startseite die Produkte.
 *
 * Keine „use server“-Datei: Die dürfte kein cache() exportieren.
 */
export const getHomeLooks = cache(
  async (countryCode: string): Promise<HomeLooks> => {
    try {
      const { looks, index } = await getLookSeasonIndex()
      const seasonLooks = looksOfSeason(
        looks,
        index,
        index.current?.handle ?? null
      )
      const { products } = await listLooksForOverview(countryCode, seasonLooks)
      const overview = buildOverview({
        looks: seasonLooks,
        products,
        minioHost: minioHostFrom(process.env.NEXT_PUBLIC_MINIO_ENDPOINT),
      })
      return { overview, season: index.current, looks: seasonLooks }
    } catch (error) {
      console.error("home: failed to load looks", error)
      return NO_LOOKS
    }
  }
)

/**
 * Produkte für Produktkarten in der Reihenfolge der IDs, mit den
 * Standardfeldern (zweites Foto, „Neu“, Lagerbestand, Farbpunkte).
 * null, wenn die Abfrage scheitert.
 */
export const listProductsInOrder = async (
  countryCode: string,
  ids: string[]
): Promise<HttpTypes.StoreProduct[] | null> => {
  if (!ids.length) return []
  try {
    const {
      response: { products },
    } = await listProducts({
      countryCode,
      // limit = Anzahl: der Standard (12) schnitte still Produkte ab
      queryParams: { id: ids, limit: ids.length },
    })
    const byId = new Map(products.map((p) => [p.id, p]))
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is HttpTypes.StoreProduct => !!p)
  } catch (error) {
    console.error("home: failed to load spotlight products", error)
    return null
  }
}
