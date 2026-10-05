import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getLookSeasonIndex } from "@lib/data/look-seasons"
import { listLooksForOverview } from "@lib/data/looks"
import { buildMetaDescription } from "@lib/util/seo"
import {
  buildOverview,
  minioHostFrom,
  MIN_LOOKS_FOR_WORLDS,
} from "@modules/looks/lib/overview"
import {
  looksOfSeason,
  type LookSeason,
  type LookSeasonIndex,
} from "@modules/looks/lib/seasons"
import { LOOK_WORLDS, LOOKS_OG_IMAGE } from "@modules/looks/lib/worlds"
import LooksOverview from "@modules/looks/templates/looks-overview"

type LooksSeasonPageProps = {
  countryCode: string
  /** null = aktuelle Saison (/looks) */
  seasonHandle: string | null
}

const OVERVIEW_TITLE = "Shop the Look – Outfits nach Farbwelten"
const META_DESCRIPTION_MAX = 155
const FALLBACK_DESCRIPTION =
  "Kombinierte Outfits der Strickerei Jutta – entdecken Sie abgestimmte Looks und kaufen Sie das ganze Outfit oder einzelne Teile."

/**
 * Ohne Handle die aktuelle Saison (null, wenn es keine Saisons gibt), mit
 * Handle die passende Saison; undefined = unbekanntes Handle.
 */
const resolveSeason = (
  index: LookSeasonIndex,
  seasonHandle: string | null
): LookSeason | null | undefined =>
  seasonHandle === null
    ? index.current
    : index.seasons.find((s) => s.handle === seasonHandle)

// Ein 2:3-Foto würde auf 1.91:1 schlecht beschnitten: ohne eigenes Bild
// bleibt das Standardbild der Seite
const openGraph = (): Pick<Metadata, "openGraph"> =>
  LOOKS_OG_IMAGE ? { openGraph: { images: [LOOKS_OG_IMAGE] } } : {}

const currentSeasonMetadata = (
  season: LookSeason | null,
  lookCount: number,
  countryCode: string
): Metadata => ({
  title: OVERVIEW_TITLE,
  description:
    lookCount >= MIN_LOOKS_FOR_WORLDS
      ? buildMetaDescription(
          [
            `${lookCount} abgestimmte Outfits der Strickerei Jutta aus Draßburg${
              season ? ` – ${season.title}` : ""
            }, geordnet nach Farbwelten: ${LOOK_WORLDS.map((w) => w.name).join(
              ", "
            )}`,
          ],
          META_DESCRIPTION_MAX
        )
      : FALLBACK_DESCRIPTION,
  // Auch /looks/saison/<aktuelle> zeigt auf /looks
  alternates: { canonical: `/${countryCode}/looks` },
  ...openGraph(),
})

const archiveSeasonMetadata = (
  season: LookSeason,
  countryCode: string
): Metadata => ({
  title: `Shop the Look – ${season.title}`,
  description: buildMetaDescription([
    `${season.lookCount} ${
      season.lookCount === 1 ? "Look" : "Looks"
    } der Kollektion ${
      season.title
    } der Strickerei Jutta – ganzes Outfit oder einzelne Teile kaufen.`,
  ]),
  alternates: { canonical: `/${countryCode}${season.href}` },
  ...openGraph(),
})

/** Metadaten für /looks und /looks/saison/[season] */
export async function looksSeasonMetadata({
  countryCode,
  seasonHandle,
}: LooksSeasonPageProps): Promise<Metadata> {
  const { looks, index } = await getLookSeasonIndex()
  const season = resolveSeason(index, seasonHandle)

  if (season === undefined) {
    notFound()
  }

  return season && !season.isCurrent
    ? archiveSeasonMetadata(season, countryCode)
    : currentSeasonMetadata(
        season,
        season?.lookCount ?? looks.length,
        countryCode
      )
}

/**
 * Looks-Übersicht einer Saison: /looks zeigt die aktuelle (samt Looks ohne
 * Kollektion), /looks/saison/<handle> eine ältere. Gemeinsam für beide
 * Routen, weil Seiten-Dateien keine Hilfsfunktionen exportieren dürfen.
 */
export default async function LooksSeasonPage({
  countryCode,
  seasonHandle,
}: LooksSeasonPageProps) {
  const { looks, index } = await getLookSeasonIndex()
  const season = resolveSeason(index, seasonHandle)

  if (season === undefined) {
    notFound()
  }

  const seasonLooks = looksOfSeason(looks, index, season?.handle ?? null)
  const { products } = await listLooksForOverview(countryCode, seasonLooks)
  const overview = buildOverview({
    looks: seasonLooks,
    products,
    minioHost: minioHostFrom(process.env.NEXT_PUBLIC_MINIO_ENDPOINT),
  })

  return (
    <LooksOverview
      overview={overview}
      season={season}
      isArchive={!!season && !season.isCurrent}
      countryCode={countryCode}
    />
  )
}
