import { ArrowRight } from "@components/icons"
import { doorMeta, doorTint } from "@modules/home/lib/home-looks"
import LookTileMedia from "@modules/looks/components/overview/look-tile-media"
import TrackedLink from "@modules/looks/components/overview/tracked-link"
import type { WorldVM } from "@modules/looks/lib/overview"

// Breite des Fotos: 2 Spalten auf dem Handy, ab 768px 4 (Tür minus Rahmen)
const DOOR_SIZES =
  "(min-width:1440px) 314px, (min-width:1024px) calc(25vw - 32px), (min-width:768px) calc(25vw - 36px), calc(50vw - 42px)"

// Ohne cn(): tailwind-merge 3 streicht sonst „focus-visible:outline“ neben
// „outline-2“. Dunkler Rahmen mit weißem Saum (Schatten): sichtbar auf
// stone-50 und auf dem dunklen Video, in das die Türen hineinragen.
const DOOR_LINK =
  "group flex h-full w-full flex-col overflow-hidden rounded-md bg-[color:var(--welt-bg)] text-[color:var(--welt-ink)] ring-1 ring-black/5 transition-shadow duration-300 [@media(hover:hover)]:hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 focus-visible:shadow-[0_0_0_6px_#fff]"

/**
 * Tür zu einer Farbwelt: getönte Karte mit Farbkarte, dem Aufmacher-Look
 * und Anzahl samt Einstiegspreis. Führt zur Welt auf /looks.
 */
export default function WorldDoor({ band }: { band: WorldVM }) {
  const lead = band.looks[0]
  const nameId = `farbwelt-${band.key}-name`
  const metaId = `farbwelt-${band.key}-meta`

  return (
    <li className="flex">
      <TrackedLink
        href={`/looks#${band.key}`}
        event="select_content"
        params={{ content_type: "home_farbwelt", content_id: band.key }}
        style={band.style}
        aria-labelledby={nameId}
        aria-describedby={metaId}
        className={DOOR_LINK}
      >
        <div aria-hidden className="flex h-1.5">
          {band.swatches.map((swatch) => (
            <span
              key={swatch.hex}
              className="flex-1"
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
        <div className="mx-1.5 mt-1.5">
          <LookTileMedia
            cover={lead.cover}
            alt={lead.alt}
            isLead={false}
            // schaut schon im ersten Bildschirm aus dem Hero
            loading="eager"
            sizes={DOOR_SIZES}
            // KI-Titelbilder haben einen eigenen Hintergrund: nicht tönen
            tint={lead.cover.isAi ? undefined : doorTint(band)}
          />
        </div>
        <div className="flex flex-1 flex-col px-2.5 pb-3 pt-2.5 small:px-3.5 small:pb-4 small:pt-3.5">
          <h3
            id={nameId}
            className="flex items-start justify-between gap-1.5 font-serif text-lg font-normal leading-[22px] small:text-2xl small:leading-[30px]"
          >
            <span>{band.name}</span>
            <ArrowRight
              size={18}
              aria-hidden
              className="mt-0.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 small:mt-1.5"
            />
          </h3>
          {band.tagline && (
            <p className="mt-1 hidden text-pretty text-sm leading-5 text-[color:var(--welt-text)] small:block">
              {band.tagline}
            </p>
          )}
          {/* Unten bündig, damit Preise und „Looks ansehen“ in einer Reihe
              auf gleicher Höhe stehen */}
          <div className="mt-auto pt-1">
            <p
              id={metaId}
              className="text-[13px] leading-[18px] tabular-nums text-[color:var(--welt-text)]"
            >
              {doorMeta(band)}
            </p>
            {lead.cover.isAi && (
              <p className="mt-1 text-[11px] leading-4 text-[color:var(--welt-text)]">
                Hintergrund digital gestaltet
              </p>
            )}
            <p className="mt-2.5 hidden text-xs font-medium uppercase leading-4 tracking-[0.15em] small:block">
              Looks ansehen
            </p>
          </div>
        </div>
      </TrackedLink>
    </li>
  )
}
