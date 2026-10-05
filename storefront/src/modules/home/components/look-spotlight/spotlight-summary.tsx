import { ArrowRight, RefreshCw } from "@components/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import TrackedLink from "@modules/looks/components/overview/tracked-link"
import { toGaItem, type LookTileVM } from "@modules/looks/lib/overview"

const STEPS = [
  "Look wählen",
  "Größe einmal für alle Teile wählen",
  "Ganz oder einzeln in den Warenkorb",
]

// Link im Stil eines Buttons (kein <button> im <a>); ohne cn(), sonst
// streicht tailwind-merge 3 „focus-visible:outline“
const CTA =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--welt-end-bg)] px-6 text-sm font-medium text-[color:var(--welt-end-ink)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--welt-focus)] tablet:w-auto large:w-full"

// Gestapelt auf dem Handy, 2×2 ab 768px, ab 1440px die fünfte Spalte
export const SUMMARY_LAYOUT =
  "mt-8 border-t border-[color:var(--welt-track)] pt-6 tablet:grid tablet:grid-cols-[minmax(0,1fr)_auto] tablet:gap-x-10 tablet:gap-y-4 large:mt-0 large:flex large:flex-col large:justify-end large:gap-5 large:border-l large:border-t-0 large:pl-6 large:pt-0"

const extraLabel = (count: number): string =>
  count === 1 ? "+ 1 weiteres Teil im Look" : `+ ${count} weitere Teile im Look`

type SpotlightSummaryProps = {
  tile: LookTileVM
  extraCount: number
  listId: string
  listName: string
}

/**
 * Summe, Weg zum Look und die drei Schritte direkt neben den Teilen:
 * gestapelt auf dem Handy, 2×2 auf Tablet und Laptop, ab 1440px als fünfte
 * Spalte neben Look und Teilen.
 */
export default function SpotlightSummary({
  tile,
  extraCount,
  listId,
  listName,
}: SpotlightSummaryProps) {
  return (
    <div className={SUMMARY_LAYOUT}>
      <div>
        {tile.price && (
          <p className="text-lg font-medium tabular-nums text-[color:var(--welt-ink)]">
            {tile.price.text}
            {tile.price.original && (
              <>
                {" "}
                <span className="sr-only">statt</span>{" "}
                <s className="text-base font-normal opacity-70">
                  {tile.price.original}
                </s>
              </>
            )}
          </p>
        )}
        {extraCount > 0 && (
          <p className="mt-0.5 text-[13px] leading-[18px] text-[color:var(--welt-text)]">
            {extraLabel(extraCount)}
          </p>
        )}
      </div>

      <div className="mt-4 tablet:mt-0">
        <TrackedLink
          href={`/looks/${tile.handle}`}
          event="select_item"
          params={{
            item_list_id: listId,
            item_list_name: listName,
            items: [toGaItem(tile)],
          }}
          className={CTA}
        >
          Ganzen Look ansehen
          <ArrowRight size={16} aria-hidden />
        </TrackedLink>
      </div>

      <ol className="mt-6 flex flex-col gap-1 text-sm leading-6 text-[color:var(--welt-text)] tablet:mt-0 tablet:flex-row tablet:flex-wrap tablet:gap-x-6 large:flex-col large:gap-1">
        {STEPS.map((step, i) => (
          <li key={step}>
            <span className="mr-1.5 font-medium tabular-nums text-[color:var(--welt-ink)]">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-3 text-sm text-[color:var(--welt-text)] tablet:mt-0">
        <p className="flex items-start gap-2 leading-6">
          <RefreshCw size={14} aria-hidden className="mt-[5px] shrink-0" />
          Passt nicht? Wir tauschen unkompliziert.
        </p>
        <LocalizedClientLink
          href="/size-guide"
          className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-[color:var(--welt-ink)]"
        >
          Zur Größentabelle
        </LocalizedClientLink>
      </div>
    </div>
  )
}
