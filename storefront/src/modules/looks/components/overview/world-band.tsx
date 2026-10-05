import { ArrowRight } from "@components/icons"
import { cn } from "@lib/utils"
import type { WorldVM } from "@modules/looks/lib/overview"
import LookTile from "./look-tile"
import type { ImageLoading } from "./look-tile-media"
import styles from "./looks-overview.module.css"
import TrackedLink from "./tracked-link"
import WorldEndTile from "./world-end-tile"
import WorldRail from "./world-rail"

// Unter 1024px eine wischbare Reihe, ab 1024px ein Raster mit 4 (ab 1440: 5)
// Spalten, alle Zeilen gleich hoch (auch eine Zeile nur mit der
// Schlusskachel). py-1.5 lässt Platz für Fokusrahmen innerhalb der Reihe.
const RAIL_LIST =
  "no-scrollbar relative -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-pl-6 px-6 py-1.5 tablet:gap-4 small:mx-0 small:grid small:auto-rows-fr small:snap-none small:grid-cols-4 small:gap-x-5 small:gap-y-10 small:overflow-visible small:p-0 medium:gap-x-6 large:grid-cols-5"

type WorldBandProps = {
  world: WorldVM
  /** Position auf der Seite (0 = erste Welt) */
  index: number
}

/** Bildladen: nur der Aufmacher der ersten Welt mit Priorität */
const imageLoading = (worldIndex: number, lookIndex: number): ImageLoading => {
  if (worldIndex > 0) return "lazy"
  if (lookIndex === 0) return "priority"
  return lookIndex === 1 ? "eager" : "lazy"
}

/** Eine Farbwelt: getöntes Band mit Kopf, Farbkarte und Looks */
export default function WorldBand({ world, index }: WorldBandProps) {
  const titleId = `${world.key}-title`
  const listId = `${world.key}-looks`
  const isMirrored = index % 2 === 1
  // Die erste Welt enthält das LCP-Bild und wird nie animiert
  const reveal = index > 0 ? styles.reveal : undefined
  const dots = world.swatches.slice(0, 3)
  const storeLabel = world.swatches.length
    ? "Alle Teile in diesen Farben"
    : "Alle Produkte ansehen"

  return (
    <section
      id={world.key}
      data-world={world.key}
      aria-labelledby={titleId}
      style={world.style}
      className="bg-[color:var(--welt-bg)] pb-8 pt-4 tablet:py-10 small:py-14 large:py-16"
    >
      <div className="content-container">
        <header
          className={cn(
            "mb-3 tablet:mb-6 tablet:flex tablet:items-end tablet:justify-between tablet:gap-8 small:mb-8",
            reveal
          )}
        >
          <div>
            <h2
              id={titleId}
              className="flex items-center gap-2.5 font-serif text-[1.625rem] font-normal leading-8 text-[color:var(--welt-ink)] tablet:text-4xl tablet:leading-[1.1] medium:text-5xl"
            >
              {dots.length > 0 && (
                <span aria-hidden className="flex -space-x-1 tablet:hidden">
                  {dots.map((swatch) => (
                    <span
                      key={swatch.hex}
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-[color:var(--welt-dot-ring)]"
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                </span>
              )}
              {world.name}
            </h2>
            {world.tagline && (
              <p className="mt-1 text-pretty text-sm leading-5 text-[color:var(--welt-text)] tablet:mt-2 tablet:text-base small:text-lg">
                {world.tagline}
              </p>
            )}
            {world.swatches.length > 0 && (
              <ul
                aria-label="Farben dieser Welt"
                className="mt-3 hidden flex-wrap gap-x-4 gap-y-1 tablet:flex"
              >
                {world.swatches.map((swatch) => (
                  <li
                    key={swatch.hex}
                    className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[color:var(--welt-muted)]"
                  >
                    <span
                      aria-hidden
                      className="h-3 w-3 rounded-full ring-1 ring-[color:var(--welt-dot-ring)]"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    {swatch.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hidden shrink-0 flex-col items-end gap-1 text-right tablet:flex">
            <p className="text-sm tabular-nums text-[color:var(--welt-muted)]">
              {world.metaLabel}
            </p>
            <TrackedLink
              href={world.storeHref}
              event="select_content"
              params={{
                content_type: "farbwelt_einzelteile",
                content_id: world.key,
              }}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[color:var(--welt-ink)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--welt-focus)]"
            >
              {storeLabel}
              <ArrowRight size={16} aria-hidden />
            </TrackedLink>
          </div>
        </header>

        <div className={reveal}>
          <WorldRail
            label={`Looks in ${world.name}`}
            listId={listId}
            listClassName={cn(
              RAIL_LIST,
              isMirrored && "small:grid-flow-row-dense"
            )}
          >
            {world.looks.map((look, i) => (
              <LookTile
                key={look.id}
                look={look}
                isLead={world.hasLead && i === 0}
                isMirrored={isMirrored}
                loading={imageLoading(index, i)}
              />
            ))}
            <WorldEndTile world={world} />
          </WorldRail>
        </div>
      </div>
    </section>
  )
}
