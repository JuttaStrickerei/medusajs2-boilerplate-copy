import type { WorldVM } from "@modules/looks/lib/overview"
import {
  DOORS_GRID,
  DOORS_LABEL,
  DOORS_META,
  DOORS_SEAM,
  DOORS_SECTION,
  DOORS_TITLE,
} from "../section-styles"
import WorldDoor from "./world-door"

const FARBWELTEN_TITLE_ID = "farbwelten-title"

type WorldDoorsProps = {
  bands: WorldVM[]
  /** z. B. „20 Looks · Herbst/Winter 2026“ */
  meta: string
}

/** Farbstreifen aller Welten über die volle Breite, wie eine Garn-Farbkarte */
export function ColorStrip({ swatches }: { swatches: { hex: string }[] }) {
  return (
    <div aria-hidden className="flex h-1.5">
      {swatches.map((swatch, i) => (
        <span
          key={`${swatch.hex}-${i}`}
          className="flex-1"
          style={{ backgroundColor: swatch.hex }}
        />
      ))}
    </div>
  )
}

/**
 * „Finden Sie Ihre Farbe“: eine Tür je Farbwelt. Die Türen schauen unten in
 * den Hero hinein, so zeigt schon der erste Bildschirm vier Outfits.
 * Ohne Einblend-Animation, damit dieser Rand nie springt.
 */
export default function WorldDoors({ bands, meta }: WorldDoorsProps) {
  return (
    <section
      id="farbwelten"
      aria-labelledby={FARBWELTEN_TITLE_ID}
      className={DOORS_SECTION}
    >
      <div className={DOORS_SEAM}>
        <ColorStrip swatches={bands.flatMap((band) => band.swatches)} />
      </div>
      <div className="content-container pb-10 small:pb-16">
        <header className={DOORS_LABEL}>
          <h2 id={FARBWELTEN_TITLE_ID} className={DOORS_TITLE}>
            Finden Sie Ihre Farbe
          </h2>
          <p className={DOORS_META}>{meta}</p>
        </header>
        <ul className={DOORS_GRID}>
          {bands.map((band) => (
            <WorldDoor key={band.key} band={band} />
          ))}
        </ul>
      </div>
    </section>
  )
}
