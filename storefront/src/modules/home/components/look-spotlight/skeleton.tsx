import type { CSSProperties } from "react"

import { cn } from "@lib/utils"
import { HOME_SPOTLIGHT_LOOK } from "@modules/home/lib/home-looks"
import { FALLBACK_WORLD, LOOK_WORLDS } from "@modules/looks/lib/worlds"
import {
  CARD_BODY,
  CARD_MAT,
} from "@modules/products/components/product-preview/card-styles"
import { SPOTLIGHT_GRID } from "../section-styles"
import { SUMMARY_LAYOUT } from "./spotlight-summary"

const PLACEHOLDER_CARDS = 4
const BAR = "animate-pulse rounded bg-black/[0.06]"

// Tönung schon beim Laden in der Farbe der Welt des Looks
const SPOTLIGHT_TOKENS = (LOOK_WORLDS.find((world) =>
  world.handles.includes(HOME_SPOTLIGHT_LOOK)
)?.tokens ?? FALLBACK_WORLD.tokens) as CSSProperties

/**
 * Platzhalter für „Shop the Look“: gleiche Abstände, Raster und Blockhöhen
 * wie der echte Abschnitt (Name, Teile, Preis; Summe, Button, Schritte).
 */
export default function LookSpotlightSkeleton() {
  return (
    <div
      style={SPOTLIGHT_TOKENS}
      className="bg-[color:var(--welt-bg)] py-10 small:py-16"
    >
      <p role="status" className="sr-only">
        Looks werden geladen …
      </p>
      <div aria-hidden className="content-container">
        <div className="mb-5 small:mb-8">
          <Line className="h-4" bar="h-2.5 w-28" />
          <Line
            className="mt-1.5 h-[34px] small:h-11"
            bar="h-6 w-48 small:h-8 small:w-64"
          />
          <Line className="mt-1 h-[22px] small:h-6" bar="h-3 w-72 max-w-full" />
          {/* Unterzeile: auf dem Handy zwei Zeilen */}
          <Line
            className="mt-1 h-11 tablet:h-[22px] small:h-6"
            bar="h-3 w-64 max-w-full"
          />
        </div>
        <div className="large:grid large:grid-cols-5 large:gap-x-6">
          <div className={SPOTLIGHT_GRID}>
            {Array.from({ length: PLACEHOLDER_CARDS }, (_, i) => (
              <div key={i} className={CARD_MAT}>
                <div className="aspect-[2/3] animate-pulse rounded-[4px] bg-stone-100" />
                {/* Höhe wie Name, Teile und Preis der Look-Kachel */}
                <div
                  className={cn(
                    CARD_BODY,
                    "min-h-[98px] gap-2 tablet:min-h-[106px] small:min-h-[100px]"
                  )}
                >
                  <span className={cn(BAR, "h-3.5 w-3/4")} />
                  <span className={cn(BAR, "h-3.5 w-1/3")} />
                </div>
              </div>
            ))}
          </div>
          <div className={SUMMARY_LAYOUT}>
            <Line className="h-7" bar="h-4 w-56 max-w-full" />
            <div className="mt-4 tablet:mt-0">
              <span
                className={cn(
                  BAR,
                  "block h-12 w-full rounded-lg tablet:w-60 large:w-full"
                )}
              />
            </div>
            <div className="mt-6 h-20 tablet:mt-0 tablet:h-6 large:h-20" />
            <div className="mt-3 h-[68px] tablet:mt-0" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Line({ className, bar }: { className: string; bar: string }) {
  return (
    <span className={cn("flex items-center", className)}>
      <span className={cn(BAR, bar)} />
    </span>
  )
}
