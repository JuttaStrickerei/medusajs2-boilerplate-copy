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
// Schrift auf einem Farbstreifen: dunkel auf hellen, weiß auf dunklen Farben
const inkFor = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#1C1917" : "#FFFFFF"
}

export default function WorldEndTile({ world }: { world: WorldVM }) {
  const hasColors = world.swatches.length > 0
  const title = hasColors
    ? "Alle Teile in diesen Farben"
    : "Alle Produkte ansehen"

  return (
    <li className={cn(RAIL_ITEM, "flex", world.endClasses)}>
      <TrackedLink
        href={world.storeHref}
        event="select_content"
        params={{ content_type: "farbwelt_einzelteile", content_id: world.key }}
        // sichtbarer Titel bleibt im Namen (WCAG 2.5.3), die Welt ergänzt ihn
        aria-label={hasColors ? `${title} – ${world.name}` : title}
        className="group flex min-h-[12rem] w-full flex-col overflow-hidden rounded bg-[color:var(--welt-end-bg)] text-[color:var(--welt-end-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--welt-focus)]"
      >
        {/* Farbkarte wie bei Garnen: jede Farbe der Welt als breiter Streifen,
            Name senkrecht – füllt die Kachel mit Farbe statt leerer Fläche */}
        {hasColors && (
          <span
            aria-hidden
            className="flex min-h-[7rem] flex-1"
            style={{
              borderBottom:
                "1px solid color-mix(in srgb, currentColor 18%, transparent)",
            }}
          >
            {world.swatches.map((swatch) => (
              <span
                key={swatch.hex}
                className="flex flex-1 items-end justify-center pb-3"
                style={{
                  backgroundColor: swatch.hex,
                  color: inkFor(swatch.hex),
                }}
              >
                <span className="rotate-180 text-[10px] uppercase tracking-[0.18em] [writing-mode:vertical-rl]">
                  {swatch.name}
                </span>
              </span>
            ))}
          </span>
        )}
        <span className="mt-auto flex items-end justify-between gap-4 p-5 small:p-6">
          <span className="flex flex-col gap-1.5">
            <span className="font-serif text-xl leading-7 medium:text-2xl medium:leading-8">
              {title}
            </span>
            <span className="text-sm opacity-90">
              Einzeln kaufen und frei kombinieren
            </span>
          </span>
          <span
            aria-hidden
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--welt-end-ink)] text-[color:var(--welt-end-bg)] transition-transform duration-300 group-hover:translate-x-1"
          >
            <ArrowRight size={18} />
          </span>
        </span>
      </TrackedLink>
    </li>
  )
}
