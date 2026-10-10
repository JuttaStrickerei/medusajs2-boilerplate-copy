import "server-only"

import { cache } from "react"

import { sdk } from "@lib/config"
import {
  buildSeasonIndex,
  type LookSeasonIndex,
  type SeasonCollection,
} from "@modules/looks/lib/seasons"
import { getCacheOptions } from "./cookies"
import { listLooks, type StoreLook } from "./looks"

// Wie die Looks: Ohne revalidate cacht Next 15 die Abfrage nicht (Tags allein
// reichen nicht), und force-dynamic nullt nur Abfragen ohne eigene Angabe
const SEASON_REVALIDATE_SECONDS = 60
const SEASON_COLLECTION_FIELDS =
  "id,handle,title,created_at,metadata,products.id"
const SEASON_COLLECTION_LIMIT = 100

const listSeasonCollections = async (): Promise<SeasonCollection[]> => {
  const next = {
    ...(await getCacheOptions("collections")),
    revalidate: SEASON_REVALIDATE_SECONDS,
  }

  return sdk.client
    .fetch<{ collections: SeasonCollection[] }>("/store/collections", {
      method: "GET",
      query: {
        limit: SEASON_COLLECTION_LIMIT,
        fields: SEASON_COLLECTION_FIELDS,
      },
      next,
    })
    .then(({ collections }) => collections)
}

/**
 * Looks plus Saison-Zuordnung, einmal pro Anfrage berechnet (Navigation,
 * Menü und Looks-Übersicht teilen sich das Ergebnis). Scheitert die
 * Kollektionsabfrage, gibt es keine Saisons: Die Navigation zeigt dann einen
 * einfachen Link, /looks alle Looks.
 *
 * Liegt bewusst nicht in looks.ts: Eine „use server“-Datei darf nur
 * async-Funktionen exportieren, kein cache().
 */
export const getLookSeasonIndex = cache(
  async (): Promise<{ looks: StoreLook[]; index: LookSeasonIndex }> => {
    const [looks, collections] = await Promise.all([
      listLooks(),
      listSeasonCollections().catch((error) => {
        console.error("looks: failed to load seasons", error)
        return [] as SeasonCollection[]
      }),
    ])

    return { looks, index: buildSeasonIndex(looks, collections) }
  }
)
