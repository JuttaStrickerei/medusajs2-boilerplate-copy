import type { CSSProperties } from "react"

import { ArrowRight } from "@components/icons"
import { cn } from "@lib/utils"
import { ViewItemList } from "@modules/common/components/analytics"
import LookTile from "@modules/looks/components/overview/look-tile"
import styles from "@modules/looks/components/overview/looks-overview.module.css"
import TrackedLink from "@modules/looks/components/overview/tracked-link"
import { RAIL_LIST } from "@modules/looks/components/overview/world-band"
import WorldRail from "@modules/looks/components/overview/world-rail"
import {
  toGaItem,
  type LookTileVM,
  type WorldVM,
} from "@modules/looks/lib/overview"
import { FALLBACK_WORLD } from "@modules/looks/lib/worlds"
import { HOME_EYEBROW, HOME_H2, HOME_SUB } from "../section-styles"
import LooksRailEnd from "./looks-rail-end"

export const HOME_LOOKS_LIST_ID = "home_looks"
export const HOME_LOOKS_LIST_NAME = "Startseite – Looks der Saison"
const TITLE_ID = "looks-der-saison-title"

// Ab 1024px eine Reihe: 3 Looks + Schlusskarte (4 Spalten), ab 1440px 4 + 1
const tileClass = (index: number): string | undefined => {
  if (index === 3) return "small:hidden large:block"
  return index > 3 ? "small:hidden" : undefined
}

type LooksRailProps = {
  looks: LookTileVM[]
  /** Anzahl aller Looks der Saison */
  total: number
  /** Welten für die Farbkarte der Schlusskarte */
  bands: WorldVM[]
  title: string
  /** Dachzeile, wenn es keine Farbwelten-Türen darüber gibt */
  eyebrow: string | null
}

/** „Looks der Saison“: wischbare Reihe weiterer Looks mit Gesamtpreis */
export default function LooksRail({
  looks,
  total,
  bands,
  title,
  eyebrow,
}: LooksRailProps) {
  return (
    <section
      id="looks-der-saison"
      aria-labelledby={TITLE_ID}
      // --welt-*-Variablen für Kacheln, Fortschrittsbalken und Pfeile
      style={FALLBACK_WORLD.tokens as CSSProperties}
      className="bg-white py-10 small:py-16"
    >
      <div className="content-container">
        <header
          className={cn(
            "mb-4 tablet:flex tablet:items-end tablet:justify-between tablet:gap-8 small:mb-7",
            styles.reveal
          )}
        >
          <div>
            {eyebrow && <p className={cn(HOME_EYEBROW, "mb-1.5")}>{eyebrow}</p>}
            <h2 id={TITLE_ID} className={HOME_H2}>
              {title}
            </h2>
            <p className={HOME_SUB}>
              Fertig kombiniert, mit Gesamtpreis – ganzer Look oder einzelne
              Teile.
            </p>
          </div>
          <TrackedLink
            href="/looks"
            event="select_content"
            params={{ content_type: "home_alle_looks" }}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            Alle {total} Looks
            <ArrowRight size={16} aria-hidden />
          </TrackedLink>
        </header>

        <WorldRail
          label={title}
          listId="home-looks-rail"
          listClassName={RAIL_LIST}
        >
          {looks.map((look, i) => (
            <LookTile
              key={look.id}
              look={look}
              isLead={false}
              isMirrored={false}
              loading="lazy"
              listId={HOME_LOOKS_LIST_ID}
              listName={HOME_LOOKS_LIST_NAME}
              className={tileClass(i)}
            />
          ))}
          <LooksRailEnd bands={bands} total={total} />
        </WorldRail>
        <ViewItemList
          listId={HOME_LOOKS_LIST_ID}
          listName={HOME_LOOKS_LIST_NAME}
          items={looks.map(toGaItem)}
        />
      </div>
    </section>
  )
}
