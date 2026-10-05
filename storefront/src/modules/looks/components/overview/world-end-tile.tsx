import { ArrowRight } from "@components/icons"
import { cn } from "@lib/utils"
import type { WorldVM } from "@modules/looks/lib/overview"
import { RAIL_ITEM } from "./look-tile"
import TrackedLink from "./tracked-link"

/**
 * Schlusskachel einer Welt: führt zu allen Einzelteilen in diesen Farben.
 * Füllt im Raster die Lücke nach dem letzten Look (Breite aus endSpans);
 * auf Handy und Tablet ist sie die letzte Karte der Reihe.
 */
export default function WorldEndTile({ world }: { world: WorldVM }) {
  const hasColors = world.swatches.length > 0
  const title = hasColors
    ? "Alle Teile in diesen Farben"
    : "Alle Produkte ansehen"
  const label = hasColors
    ? `Alle Teile in ${world.name} im Shop ansehen`
    : "Alle Produkte im Shop ansehen"

  return (
    <li className={cn(RAIL_ITEM, "flex", world.endClasses)}>
      <TrackedLink
        href={world.storeHref}
        event="select_content"
        params={{ content_type: "farbwelt_einzelteile", content_id: world.key }}
        aria-label={label}
        className="group flex min-h-[12rem] w-full flex-col justify-end gap-6 rounded bg-[color:var(--welt-end-bg)] p-5 text-[color:var(--welt-end-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--welt-focus)] small:p-6"
      >
        {/* Oben Farbkarte (dekorativ, der Link trägt sein eigenes
            aria-label) und Pfeil, unten der Titel über die volle Breite */}
        <span className="mb-auto flex items-start justify-between gap-4">
          {hasColors && (
            <span aria-hidden className="flex flex-col gap-2.5">
              {world.swatches.map((swatch) => (
                <span
                  key={swatch.hex}
                  className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.14em] opacity-90"
                >
                  <span
                    className={cn(
                      "h-6 w-6 shrink-0 rounded-full ring-1",
                      world.theme === "dark" ? "ring-black/15" : "ring-white/40"
                    )}
                    style={{ backgroundColor: swatch.hex }}
                  />
                  {swatch.name}
                </span>
              ))}
            </span>
          )}
          <span
            aria-hidden
            className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--welt-end-ink)] text-[color:var(--welt-end-bg)] transition-transform duration-300 group-hover:translate-x-1"
          >
            <ArrowRight size={18} />
          </span>
        </span>
        <span className="flex flex-col gap-1.5">
          <span className="font-serif text-xl leading-7 medium:text-2xl medium:leading-8">
            {title}
          </span>
          <span className="text-sm opacity-90">
            Einzeln kaufen und frei kombinieren
          </span>
        </span>
      </TrackedLink>
    </li>
  )
}
