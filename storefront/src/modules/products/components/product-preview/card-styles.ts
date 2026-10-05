// Gemeinsame Klassen der Produktkarte und der Übersichts-Kacheln, im Stil der
// Look-Kacheln (weißer Rahmen, Fotofläche im Packshot-Format, kleiner Name).
// Keine „focus-visible:outline …“-Klassen hier: tailwind-merge 3 streicht sie
// in cn(); der globale :focus-visible-Rahmen greift.

/** Weißer Passepartout-Rahmen wie die Look-Kacheln */
export const CARD_MAT =
  "group relative flex h-full flex-col rounded bg-white p-1.5 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow duration-300 [@media(hover:hover)]:hover:shadow-card-hover"

/** Bildfläche im Format der Packshots (2:3), leicht getönt; Fotos werden hineinmultipliziert */
export const CARD_MEDIA =
  "relative block aspect-[2/3] overflow-hidden rounded-[4px] bg-stone-100 isolate"

/** relative: der Fokusrahmen des Karten-Links liegt sonst oben unter der Bildfläche */
export const CARD_BODY =
  "relative flex flex-1 flex-col px-2 pb-1.5 pt-2 tablet:px-2.5 tablet:pb-2 tablet:pt-2.5"

export const CARD_NAME =
  "line-clamp-2 font-serif text-[15px] font-normal leading-5 text-stone-900 tablet:text-base"

export const CARD_NAME_UNDERLINE =
  "bg-gradient-to-r from-current to-current bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px] group-focus-within:bg-[length:100%_1px]"

export const CARD_SIZES = "(min-width: 768px) 300px, 50vw"

/** Raster mit Filterspalte; Abstände wie die Looks (12/16/20/24px) */
export const PRODUCT_GRID =
  "grid w-full grid-cols-2 gap-x-3 gap-y-6 tablet:grid-cols-3 tablet:gap-x-4 tablet:gap-y-8 small:gap-x-5 small:gap-y-10 medium:grid-cols-4 medium:gap-x-6"

/** ohne Filterspalte (Wunschliste, Suche, Ähnliche Produkte, Übersichten): 4 ab 1024, 5 ab 1440 wie die Looks */
export const PRODUCT_GRID_WIDE = `${PRODUCT_GRID} small:grid-cols-4 large:grid-cols-5`
