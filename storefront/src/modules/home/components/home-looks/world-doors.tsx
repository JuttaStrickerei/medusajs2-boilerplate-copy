import type { WorldVM } from "@modules/looks/lib/overview"
import { HOME_EYEBROW, HOME_H2, HOME_SUB } from "../section-styles"
import WorldDoor from "./world-door"

export const FARBWELTEN_TITLE_ID = "farbwelten-title"

type WorldDoorsProps = {
  bands: WorldVM[]
  eyebrow: string
  lookCount: number
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
 * „Finden Sie Ihre Farbe“: eine Tür je Farbwelt, direkt unter dem Hero.
 * Ohne Einblend-Animation, damit der Rand, der unter dem Hero hervorschaut,
 * nie springt.
 */
export default function WorldDoors({
  bands,
  eyebrow,
  lookCount,
}: WorldDoorsProps) {
  const worldCount = bands.length

  return (
    <section
      id="farbwelten"
      aria-labelledby={FARBWELTEN_TITLE_ID}
      className="bg-stone-50"
    >
      <ColorStrip swatches={bands.flatMap((band) => band.swatches)} />
      <div className="content-container pb-10 pt-6 small:pb-16 small:pt-7">
        <header className="mb-4 small:mb-7">
          <p className={HOME_EYEBROW}>{eyebrow}</p>
          <h2 id={FARBWELTEN_TITLE_ID} className={`mt-1.5 ${HOME_H2}`}>
            Finden Sie Ihre Farbe
          </h2>
          <p className={HOME_SUB}>
            {lookCount} Looks in {worldCount} Farbwelten – fertig kombiniert,
            jedes Teil auch einzeln.
          </p>
        </header>
        <ul className="grid grid-cols-2 gap-3 tablet:grid-cols-4 tablet:gap-4 small:gap-6">
          {bands.map((band) => (
            <WorldDoor key={band.key} band={band} />
          ))}
        </ul>
      </div>
    </section>
  )
}
