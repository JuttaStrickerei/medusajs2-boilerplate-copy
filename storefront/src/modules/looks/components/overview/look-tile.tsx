import Image from "next/image"

import { ArrowRight, Info } from "@components/icons"
import { cn } from "@lib/utils"
import { toGaItem, type LookTileVM } from "@modules/looks/lib/overview"
import LookTileMedia, { type ImageLoading } from "./look-tile-media"
import TrackedLink from "./tracked-link"

/** Breite einer Karte in der wischbaren Reihe; ab 1024px bestimmt das Raster */
export const RAIL_ITEM =
  "snap-start shrink-0 w-[64vw] max-w-[300px] tablet:w-[300px] small:w-auto small:max-w-none"

export const LOOKS_LIST_ID = "looks_overview"
export const LOOKS_LIST_NAME = "Looks in Farbe"

// Der weiße Passepartout-Rahmen um das Studiofoto
const MAT =
  "group relative flex h-full flex-col rounded bg-white p-1.5 ring-1 ring-[color:var(--welt-mat-ring)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--welt-focus)] [@media(hover:hover)]:hover:shadow-card-hover"

// Unterstrich, der beim Überfahren unter dem Namen wächst
const NAME_UNDERLINE =
  "bg-gradient-to-r from-current to-current bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px] group-focus-visible:bg-[length:100%_1px]"

type LookTileProps = {
  look: LookTileVM
  isLead: boolean
  /** Aufmacher rechts statt links (jede zweite Welt) */
  isMirrored: boolean
  loading: ImageLoading
  /** GA-Liste, z. B. für die Startseite; ohne Angabe die Looks-Übersicht */
  listId?: string
  listName?: string
  /** zusätzliche Klassen am <li> (nach den Standardklassen) */
  className?: string
  /** eigene Bildbreiten für ein anderes Raster */
  sizes?: string
}

/** Eine Look-Kachel; die ganze Kachel ist ein Link zur Look-Seite */
export default function LookTile({
  look,
  isLead,
  isMirrored,
  loading,
  listId = LOOKS_LIST_ID,
  listName = LOOKS_LIST_NAME,
  className,
  sizes,
}: LookTileProps) {
  const nameId = `look-${look.handle}-name`
  const metaId = `look-${look.handle}-meta`

  return (
    <li
      className={cn(
        RAIL_ITEM,
        isLead && "small:col-span-2 small:row-span-2 small:flex small:flex-col",
        isLead && isMirrored && "small:col-start-3 large:col-start-4",
        className
      )}
    >
      <TrackedLink
        href={`/looks/${look.handle}`}
        event="select_item"
        params={{
          item_list_id: listId,
          item_list_name: listName,
          items: [toGaItem(look)],
        }}
        aria-labelledby={nameId}
        aria-describedby={metaId}
        // Ohne cn(): tailwind-merge 3 streicht sonst „focus-visible:outline“
        // neben „outline-2“ (Tailwind-4-Regel) und der Rahmen hinge am
        // globalen :focus-visible
        className={isLead ? `${MAT} small:flex-1` : MAT}
      >
        <LookTileMedia
          cover={look.cover}
          alt={look.alt}
          isLead={isLead}
          loading={loading}
          sizes={sizes}
        />
        <div
          className={cn(
            "flex flex-1 flex-col px-2 pb-1.5 pt-2 tablet:px-2.5 tablet:pb-2 tablet:pt-2.5",
            isLead &&
              "small:grid small:flex-none small:grid-cols-[minmax(0,1fr)_auto] small:items-end small:gap-x-6 small:px-3 small:pb-3 small:pt-4"
          )}
        >
          <div className="min-w-0">
            <h3
              id={nameId}
              className={cn(
                "line-clamp-2 font-serif text-[15px] font-normal uppercase leading-5 tracking-[0.06em] text-stone-900 tablet:text-base",
                isLead &&
                  "small:text-2xl small:leading-8 medium:text-[1.75rem] medium:leading-9"
              )}
            >
              <span className="sr-only">Look </span>
              <span className={NAME_UNDERLINE}>{look.name}</span>
            </h3>
            {isLead && look.mood && (
              <p className="mt-1 hidden text-[15px] leading-6 text-stone-700 small:block">
                {look.mood}
              </p>
            )}
            <div id={metaId}>
              {look.piecesLabel && (
                <p
                  className={cn(
                    "mt-1 line-clamp-1 text-[13px] leading-[18px] text-stone-600",
                    isLead && "small:mt-2"
                  )}
                >
                  {look.piecesLabel}
                </p>
              )}
              {look.price && (
                <p className="mt-0.5 text-sm font-medium leading-5 tabular-nums text-stone-900 small:text-[13px] medium:text-sm">
                  {look.price.text}
                  {look.price.original && (
                    <>
                      {" "}
                      <span className="sr-only">statt</span>{" "}
                      <s className="font-normal text-stone-500">
                        {look.price.original}
                      </s>
                    </>
                  )}
                </p>
              )}
              {look.cover.showNote && (
                // eine Zeile, damit alle Karten einer Reihe gleich hoch bleiben;
                // die Details stehen unter dem Foto auf der Look-Seite
                <p className="mt-1 flex min-w-0 gap-1 text-[11px] leading-4 text-stone-500">
                  <Info size={12} aria-hidden className="mt-0.5 shrink-0" />
                  <span className="truncate">
                    Nicht alles im Bild ist online
                  </span>
                </p>
              )}
              {look.cover.isAi && (
                <p className="mt-1 text-[11px] leading-4 text-stone-500">
                  Hintergrund digital gestaltet
                </p>
              )}
            </div>
          </div>
          {isLead && (
            <div className="hidden flex-col items-end gap-3 small:flex">
              {look.thumbs.length > 0 && (
                <div aria-hidden className="flex gap-1.5">
                  {look.thumbs.map((src) => (
                    <Image
                      key={src}
                      src={src}
                      alt=""
                      width={48}
                      height={72}
                      loading="lazy"
                      className="h-[72px] w-12 rounded-[3px] bg-white object-contain ring-1 ring-black/5"
                    />
                  ))}
                </div>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-[color:var(--welt-accent)]">
                Look ansehen
                <ArrowRight
                  size={14}
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </span>
            </div>
          )}
        </div>
      </TrackedLink>
    </li>
  )
}
