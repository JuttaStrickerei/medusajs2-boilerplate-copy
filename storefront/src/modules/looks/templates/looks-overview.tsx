import { Fragment } from "react"

import { cn } from "@lib/utils"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LooksClosing from "@modules/looks/components/overview/looks-closing"
import LooksInterlude from "@modules/looks/components/overview/looks-interlude"
import LooksIntro from "@modules/looks/components/overview/looks-intro"
import styles from "@modules/looks/components/overview/looks-overview.module.css"
import WorldBand from "@modules/looks/components/overview/world-band"
import WorldNav from "@modules/looks/components/overview/world-nav"
import type { OverviewVM } from "@modules/looks/lib/overview"

const INTRO_ID = "looks-intro"
// Der Zwischenteil steht nach der zweiten Welt (bzw. nach der letzten)
const INTERLUDE_AFTER = 1

type LooksOverviewProps = {
  overview: OverviewVM
}

/** /looks: kurzer Gang durch die Farbwelten, jede Kachel führt zum Look */
export default function LooksOverview({ overview }: LooksOverviewProps) {
  const { bands, ordered, showNav } = overview

  if (!ordered.length) {
    return (
      <div className={cn(styles.root, "min-h-screen bg-stone-50")}>
        <LooksIntro id={INTRO_ID} count={0} isGrouped={false} />
        <EmptyState />
      </div>
    )
  }

  const interludeAfter = Math.min(INTERLUDE_AFTER, bands.length - 1)

  return (
    <div className={cn(styles.root, "bg-stone-50")}>
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
