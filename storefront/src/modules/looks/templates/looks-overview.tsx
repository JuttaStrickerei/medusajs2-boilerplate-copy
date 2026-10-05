import { Fragment } from "react"

import { getBaseURL } from "@lib/util/env"
import { cn } from "@lib/utils"
import { ViewItemList } from "@modules/common/components/analytics"
import JsonLd from "@modules/common/components/json-ld"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LooksClosing from "@modules/looks/components/overview/looks-closing"
import LooksInterlude from "@modules/looks/components/overview/looks-interlude"
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
import { LOOKBOOK_SEASON } from "@modules/looks/lib/worlds"

const INTRO_ID = "looks-intro"
// Der Zwischenteil steht nach der zweiten Welt (bzw. nach der letzten)
const INTERLUDE_AFTER = 1

type LooksOverviewProps = {
  overview: OverviewVM
  countryCode: string
}

const breadcrumbSchema = (baseUrl: string, countryCode: string) => ({
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
  ],
})

const itemListSchema = (
  looks: LookTileVM[],
  baseUrl: string,
  countryCode: string
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `${LOOKS_LIST_NAME} – ${LOOKBOOK_SEASON}`,
  url: `${baseUrl}/${countryCode}/looks`,
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
  countryCode,
}: LooksOverviewProps) {
  const { bands, ordered, showNav } = overview
  const baseUrl = getBaseURL()

  if (!ordered.length) {
    return (
      <div className={cn(styles.root, "min-h-screen bg-stone-50")}>
        <JsonLd data={breadcrumbSchema(baseUrl, countryCode)} />
        <LooksIntro id={INTRO_ID} count={0} isGrouped={false} />
        <EmptyState />
      </div>
    )
  }

  const interludeAfter = Math.min(INTERLUDE_AFTER, bands.length - 1)

  return (
    <div className={cn(styles.root, "bg-stone-50")}>
      <JsonLd data={itemListSchema(ordered, baseUrl, countryCode)} />
      <JsonLd data={breadcrumbSchema(baseUrl, countryCode)} />
      <ViewItemList
        items={ordered.map(toGaItem)}
        listId={LOOKS_LIST_ID}
        listName={LOOKS_LIST_NAME}
      />
      <LooksIntro id={INTRO_ID} count={ordered.length} isGrouped={showNav} />
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
        <Fragment key={band.key}>
          <WorldBand world={band} index={i} />
          {i === interludeAfter && <LooksInterlude />}
        </Fragment>
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
