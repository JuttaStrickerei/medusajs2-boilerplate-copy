import { Skeleton } from "@components/ui"

const PLACEHOLDER_PIECES = 3

/**
 * Platzhalter der Look-Seite (die Route ist dynamisch und brauchte ohne ihn
 * rund eine Sekunde ohne Rückmeldung). Brotkrümel-Leiste, Spalten und
 * Fotobreite wie in look-template.tsx / look-gallery.tsx, damit die echte
 * Seite nicht springt.
 */
export default function LookLoading() {
  return (
    <div className="bg-stone-50 min-h-screen">
      <p role="status" className="sr-only">
        Look wird geladen …
      </p>
      {/* Brotkrümel-Leiste wie PageBreadcrumb */}
      <div aria-hidden className="border-b border-stone-200 bg-white">
        <div className="content-container flex h-10 items-center small:h-[52px]">
          <Skeleton className="h-3 w-40 small:w-48" />
        </div>
      </div>
      <div
        aria-hidden
        className="content-container grid grid-cols-1 pb-10 pt-4 tablet:grid-cols-[minmax(0,1fr)_340px] tablet:grid-rows-[auto_1fr] tablet:items-start tablet:gap-x-8 tablet:pt-6 small:grid-cols-[minmax(0,1fr)_minmax(380px,420px)] small:gap-x-10 small:pb-12 small:pt-8 medium:grid-cols-[minmax(0,1fr)_400px] medium:gap-x-12 large:gap-x-16"
      >
        {/* Kopf wie im Template: H1 (Zeilenhöhen wie dort) und Meta-Zeile */}
        <div className="tablet:col-start-2 tablet:row-start-1">
          <div className="flex h-9 items-center tablet:h-[2.6rem] small:h-10 medium:h-[3.025rem]">
            <Skeleton className="h-7 w-56 tablet:h-8 medium:h-10 medium:w-64" />
          </div>
          <div className="mt-1 flex h-5 items-center">
            <Skeleton className="h-3.5 w-48" />
          </div>
        </div>

        {/* Gleiche Breitenregeln wie der Foto-Slider (globals.css) */}
        <div className="-mx-6 mt-4 self-start tablet:col-start-1 tablet:row-span-2 tablet:row-start-1 tablet:mx-0 tablet:mt-0">
          <div className="look-gallery">
            <div className="flex gap-2 overflow-hidden px-6 tablet:px-0">
              <div className="look-gallery__slide aspect-[2/3] shrink-0 animate-pulse rounded-xl bg-gradient-to-br from-stone-100 to-stone-200" />
              <div className="look-gallery__slide aspect-[2/3] shrink-0 animate-pulse rounded-xl bg-gradient-to-br from-stone-100 to-stone-200" />
            </div>
          </div>
        </div>

        <div className="mt-3 tablet:col-start-2 tablet:row-start-2 tablet:mt-6">
          <ul className="divide-y divide-stone-200 border-t border-stone-200">
            {Array.from({ length: PLACEHOLDER_PIECES }, (_, i) => (
              <li
                key={i}
                className="grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3 py-4 small:grid-cols-[4.5rem_minmax(0,1fr)] small:gap-x-4"
              >
                <Skeleton className="aspect-[3/4] w-full rounded-md" />
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <div className="flex gap-1.5 pt-1">
                    {Array.from({ length: 4 }, (_, j) => (
                      <Skeleton key={j} className="h-9 w-11 rounded-md" />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Skeleton className="mt-4 h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
