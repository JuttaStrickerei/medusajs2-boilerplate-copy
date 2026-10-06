import { getBaseURL } from "@lib/util/env"
import { cn } from "@lib/utils"
import { ViewItemList } from "@modules/common/components/analytics"
import JsonLd from "@modules/common/components/json-ld"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PageBreadcrumb, {
  type Crumb,
} from "@modules/common/components/page-breadcrumb"
import LooksClosing from "@modules/looks/components/overview/looks-closing"
import LooksIntro from "@modules/looks/components/overview/looks-intro"
import {
  LOOKS_LIST_ID,
  LOOKS_LIST_NAME,
} from "@modules/looks/components/overview/look-tile"
import styles from "@modules/looks/components/overview/looks-overview.module.css"
import WorldBand from "@modules/looks/components/overview/world-band"
import WorldNav from "@modules/looks/components/overview/world-nav"
import {
  toGaItem,
  type LookTileVM,
  type OverviewVM,
} from "@modules/looks/lib/overview"
import type { LookSeason } from "@modules/looks/lib/seasons"

const INTRO_ID = "looks-intro"

type LooksOverviewProps = {
  overview: OverviewVM
  /** null = keine Saisons bekannt (alle Looks, ohne Saisonzeile) */
  season: LookSeason | null
  /** ältere Saison unter /looks/saison/<handle> */
  isArchive: boolean
  countryCode: string
}

// Ältere Saison: „Startseite / Looks / <Saison>“, sonst „Startseite / Looks“
const breadcrumbItems = (archiveSeason: LookSeason | null): Crumb[] =>
  archiveSeason
    ? [{ label: "Looks", href: "/looks" }, { label: archiveSeason.title }]
    : [{ label: "Looks" }]

const breadcrumbSchema = (
  baseUrl: string,
  countryCode: string,
  archiveSeason: LookSeason | null
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Startseite",
      item: `${baseUrl}/${countryCode}`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Looks",
      item: `${baseUrl}/${countryCode}/looks`,
    },
    ...(archiveSeason
      ? [
          {
            "@type": "ListItem",
            position: 3,
            name: archiveSeason.title,
            item: `${baseUrl}/${countryCode}${archiveSeason.href}`,
          },
        ]
      : []),
  ],
})

const itemListSchema = (
  looks: LookTileVM[],
  baseUrl: string,
  countryCode: string,
  season: LookSeason | null,
  isArchive: boolean
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `Shop the Look${season ? ` – ${season.title}` : ""}`,
  url: `${baseUrl}/${countryCode}${
    isArchive && season ? season.href : "/looks"
  }`,
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  numberOfItems: looks.length,
  itemListElement: looks.map((look) => ({
    "@type": "ListItem",
    position: look.position,
    name: look.title,
    url: `${baseUrl}/${countryCode}/looks/${look.handle}`,
    ...(look.cover.src ? { image: look.cover.src } : {}),
  })),
})

/** /looks: kurzer Gang durch die Farbwelten, jede Kachel führt zum Look */
export default function LooksOverview({
  overview,
  season,
  isArchive,
  countryCode,
}: LooksOverviewProps) {
  const { bands, ordered, showNav } = overview
  const baseUrl = getBaseURL()
  const archiveSeason = isArchive ? season : null

  if (!ordered.length) {
    return (
      <div className={cn(styles.root, "min-h-screen bg-stone-50")}>
        <JsonLd data={breadcrumbSchema(baseUrl, countryCode, archiveSeason)} />
        <PageBreadcrumb items={breadcrumbItems(archiveSeason)} />
        <LooksIntro
          id={INTRO_ID}
          count={0}
          worldCount={0}
          seasonTitle={season?.title ?? null}
        />
        <EmptyState />
      </div>
    )
  }

  return (
    <div className={cn(styles.root, "bg-stone-50")}>
      <JsonLd
        data={itemListSchema(ordered, baseUrl, countryCode, season, isArchive)}
      />
      <JsonLd data={breadcrumbSchema(baseUrl, countryCode, archiveSeason)} />
      <ViewItemList
        items={ordered.map(toGaItem)}
        listId={LOOKS_LIST_ID}
        listName={LOOKS_LIST_NAME}
      />
      <PageBreadcrumb items={breadcrumbItems(archiveSeason)} />
      <LooksIntro
        id={INTRO_ID}
        count={ordered.length}
        worldCount={showNav ? bands.length : 0}
        seasonTitle={season?.title ?? null}
      />
      {showNav && (
        <WorldNav
          sentinelId={INTRO_ID}
          worlds={bands.map((band) => ({
            key: band.key,
            name: band.name,
            shortName: band.shortName,
            count: band.looks.length,
            accent: band.accent,
            chipTint: band.chipTint,
            dots: band.swatches.slice(0, 3).map((s) => s.hex),
          }))}
        />
      )}
      {bands.map((band, i) => (
        <WorldBand key={band.key} world={band} index={i} />
      ))}
      <LooksClosing />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="content-container py-20 text-center">
      <h2 className="font-serif text-2xl font-medium text-stone-800 mb-3">
        Noch keine Looks verfügbar
      </h2>
      <p className="text-stone-600 max-w-md mx-auto">
        Unsere ersten Looks sind in Arbeit. Stöbern Sie in der Zwischenzeit
        gerne in unseren Produkten.
      </p>
      <div className="mt-6">
        <LocalizedClientLink
          href="/store"
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium
                     rounded-full bg-stone-800 text-white hover:bg-stone-700 transition-colors"
        >
          Alle Produkte ansehen
        </LocalizedClientLink>
      </div>
    </div>
  )
}
