import { Skeleton } from "@components/ui"
import { cn } from "@lib/utils"
import { RAIL_ITEM } from "@modules/looks/components/overview/look-tile"

const PLACEHOLDER_TILES = 5

/**
 * Platzhalter der Looks-Übersicht: gleiche Abstände wie Kopf, Chip-Leiste
 * und erste Farbwelt, damit beim Laden nichts springt. Liegt in der
 * Routengruppe (overview), erscheint also nie vor einer Look-Seite.
 */
export default function LooksOverviewLoading() {
  return (
    <div className="bg-stone-50">
      <p role="status" className="sr-only">
        Looks werden geladen …
      </p>
      <div aria-hidden>
        <div className="content-container pb-4 pt-4 tablet:pb-6 tablet:pt-8 small:flex small:items-end small:justify-between small:gap-12 small:pb-8 small:pt-10">
          <div>
            <Skeleton className="h-3 w-48 tablet:w-60" />
            <Skeleton className="mt-3 h-8 w-56 tablet:h-12 tablet:w-80 medium:h-14 medium:w-96" />
          </div>
          <div className="mt-3 space-y-2 small:mt-0 small:w-full small:max-w-lg">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        <div className="flex h-[54px] items-center gap-2 overflow-hidden border-y border-stone-200 px-6 tablet:h-[58px] small:justify-center medium:px-8">
          {["w-24", "w-32", "w-32", "w-24"].map((width, i) => (
            <Skeleton
              key={i}
              className={cn("h-11 shrink-0 rounded-full small:w-44", width)}
            />
          ))}
        </div>

        <div className="bg-[#EEDDE1] pb-8 pt-4 tablet:py-10 small:py-14 large:py-16">
          <div className="content-container">
            <div className="mb-3 tablet:mb-6 small:mb-8">
              <div className="h-8 w-60 animate-pulse rounded bg-black/[0.06] tablet:h-10 tablet:w-80 medium:h-12 medium:w-96" />
              <div className="mt-2 h-4 w-72 animate-pulse rounded bg-black/[0.06]" />
            </div>
            <ul className="-mx-6 flex gap-3 overflow-hidden px-6 py-1.5 tablet:gap-4 small:mx-0 small:grid small:grid-cols-4 small:gap-x-5 small:p-0 medium:gap-x-6 large:grid-cols-5">
              {Array.from({ length: PLACEHOLDER_TILES }, (_, i) => (
                <li
                  key={i}
                  className={cn(
                    RAIL_ITEM,
                    i === 3 && "hidden small:block",
                    i === 4 && "hidden large:block"
                  )}
                >
                  <div className="rounded bg-white p-1.5">
                    <div className="aspect-[2/3] animate-pulse rounded-[4px] bg-[#EFF2F5]" />
                    <div className="space-y-2 px-2 pb-2 pt-2.5">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
