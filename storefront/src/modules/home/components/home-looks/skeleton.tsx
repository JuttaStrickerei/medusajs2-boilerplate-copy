import type { CSSProperties } from "react"

import { cn } from "@lib/utils"
import { doorTint } from "@modules/home/lib/home-looks"
import { RAIL_ITEM } from "@modules/looks/components/overview/look-tile"
import { LOOK_WORLDS } from "@modules/looks/lib/worlds"
import {
  DOORS_GRID,
  DOORS_LABEL,
  DOORS_META,
  DOORS_SEAM,
  DOORS_SECTION,
  DOORS_TITLE,
  HOME_H2,
  HOME_SUB,
} from "../section-styles"
import { ColorStrip } from "./world-doors"

const RAIL_PLACEHOLDERS = 4
const BAR = "animate-pulse rounded bg-black/[0.06]"

/**
 * Platzhalter für Farbwelten und Looks-Reihe, solange die Looks laden.
 * Gleiche Abstände, Schriftgrößen und Fotoformate wie die echten
 * Abschnitte (Welten aus der Konfiguration), damit beim Tausch nichts
 * springt – auch nicht der Rand, der unter dem Hero hervorschaut.
 */
export default function HomeLooksSkeleton() {
  return (
    <div>
      <p role="status" className="sr-only">
        Looks werden geladen …
      </p>
      <div aria-hidden>
        <DoorsPlaceholder />
        <RailPlaceholder />
      </div>
    </div>
  )
}

function DoorsPlaceholder() {
  return (
    <div className={DOORS_SECTION}>
      <div className={DOORS_SEAM}>
        <ColorStrip swatches={LOOK_WORLDS.flatMap((world) => world.swatches)} />
      </div>
      <div className="content-container pb-10 small:pb-16">
        <div className={DOORS_LABEL}>
          <p className={DOORS_TITLE}>Finden Sie Ihre Farbe</p>
          <p className={DOORS_META}>Looks werden geladen</p>
        </div>
        <ul className={DOORS_GRID}>
          {LOOK_WORLDS.map((world) => (
            <li key={world.key} className="flex">
              <div
                style={world.tokens as CSSProperties}
                className="flex w-full flex-col overflow-hidden rounded-md bg-[color:var(--welt-bg)] text-[color:var(--welt-ink)] ring-1 ring-black/5"
              >
                <ColorStrip swatches={world.swatches} />
                <div className="mx-1.5 mt-1.5">
                  <div
                    className="aspect-[2/3] animate-pulse rounded-[4px]"
                    style={{ backgroundColor: doorTint(world) }}
                  />
                </div>
                <div className="flex flex-1 flex-col px-2.5 pb-3 pt-2.5 small:px-3.5 small:pb-4 small:pt-3.5">
                  <p className="pr-6 font-serif text-lg leading-[22px] small:text-2xl small:leading-[30px]">
                    {world.name}
                  </p>
                  <p className="mt-1 hidden text-pretty text-sm leading-5 text-[color:var(--welt-text)] small:block">
                    {world.tagline}
                  </p>
                  <div className="mt-auto pt-1">
                    <span className="flex h-[18px] items-center">
                      <span
                        className={cn(
                          BAR,
                          "h-3 w-24 bg-[color:var(--welt-track)]"
                        )}
                      />
                    </span>
                    <p className="mt-2.5 hidden text-xs font-medium uppercase leading-4 tracking-[0.15em] small:block">
                      Looks ansehen
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function RailPlaceholder() {
  return (
    <div className="bg-white py-10 small:py-16">
      <div className="content-container">
        <div className="mb-4 tablet:flex tablet:items-end tablet:justify-between tablet:gap-8 small:mb-7">
          <div>
            <p className={HOME_H2}>Looks der Saison</p>
            <p className={HOME_SUB}>
              Fertig kombiniert, mit Gesamtpreis – ganzer Look oder einzelne
              Teile.
            </p>
          </div>
          <span className="flex min-h-11 items-center">
            <span className={cn(BAR, "h-3.5 w-28")} />
          </span>
        </div>
        <ul className="-mx-6 flex gap-3 overflow-hidden px-6 py-1.5 tablet:gap-4 small:mx-0 small:grid small:grid-cols-4 small:gap-x-5 small:p-0 medium:gap-x-6 large:grid-cols-5">
          {Array.from({ length: RAIL_PLACEHOLDERS }, (_, i) => (
            <li
              key={i}
              className={cn(RAIL_ITEM, i === 3 && "small:hidden large:block")}
            >
              <div className="rounded bg-white p-1.5 ring-1 ring-black/[0.06]">
                <div className="aspect-[2/3] animate-pulse rounded-[4px] bg-[#EFF2F5]" />
                {/* Höhe wie Name, Teile und Preis (lange Namen und Preise
                    brechen auf schmalen Kacheln um) */}
                <div className="min-h-[98px] px-2 pb-1.5 pt-2 tablet:min-h-[106px] tablet:px-2.5 tablet:pb-2 tablet:pt-2.5 small:min-h-[86px]">
                  <span className="flex h-5 items-center">
                    <span className={cn(BAR, "h-3.5 w-1/2")} />
                  </span>
                  <span className="mt-1 flex h-[18px] items-center">
                    <span className={cn(BAR, "h-3 w-3/4")} />
                  </span>
                  <span className="mt-0.5 flex h-5 items-center">
                    <span className={cn(BAR, "h-3.5 w-2/3")} />
                  </span>
                </div>
              </div>
            </li>
          ))}
          <li className={cn(RAIL_ITEM, "flex")}>
            <div className="min-h-[12rem] w-full animate-pulse rounded bg-stone-200" />
          </li>
        </ul>
        {/* Fortschrittsbalken (ab 768px mit Pfeilen) wie WorldRail */}
        <div className="mt-3 h-0.5 tablet:h-11 small:hidden" />
      </div>
    </div>
  )
}
