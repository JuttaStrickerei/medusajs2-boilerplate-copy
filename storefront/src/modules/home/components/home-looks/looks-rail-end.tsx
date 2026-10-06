import { ArrowRight } from "@components/icons"
import { cn } from "@lib/utils"
import { RAIL_ITEM } from "@modules/looks/components/overview/look-tile"
import TrackedLink from "@modules/looks/components/overview/tracked-link"
import type { WorldVM } from "@modules/looks/lib/overview"

// Ohne cn(): tailwind-merge 3 streicht sonst „focus-visible:outline“
const END_LINK =
  "group flex min-h-[12rem] w-full flex-col overflow-hidden rounded bg-stone-900 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900"

type LooksRailEndProps = {
  /** je Welt eine Reihe der Farbkarte */
  bands: WorldVM[]
  total: number
}

/** Schlusskarte der Looks-Reihe: alle Farbwelten als gestapelte Farbkarte */
export default function LooksRailEnd({ bands, total }: LooksRailEndProps) {
  return (
    <li className={cn(RAIL_ITEM, "flex")}>
      <TrackedLink
        href="/looks"
        event="select_content"
        params={{ content_type: "home_alle_looks", content_id: "end_card" }}
        className={END_LINK}
      >
        <div aria-hidden className="flex flex-1 flex-col">
          {bands.map((band) => (
            <div key={band.key} className="flex min-h-6 flex-1">
              {band.swatches.map((swatch) => (
                <span
                  key={swatch.hex}
                  className="flex-1"
                  style={{ backgroundColor: swatch.hex }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-end justify-between gap-4 p-5">
          <div>
            <p className="font-serif text-xl leading-7">
              Alle {total} Looks ansehen
            </p>
            {/* Ohne Farbwelten zeigt /looks ein einziges Band „Alle Looks“ */}
            {bands.length > 0 && (
              <p className="mt-1 text-sm opacity-90">
                Nach Farbwelten geordnet
              </p>
            )}
          </div>
          <span
            aria-hidden
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-stone-900 transition-transform duration-300 group-hover:translate-x-1"
          >
            <ArrowRight size={18} />
          </span>
        </div>
      </TrackedLink>
    </li>
  )
}
