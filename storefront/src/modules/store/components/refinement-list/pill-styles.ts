// Filter-Pillen nach dem Vorbild der Farbwelt-Chips der Looks: ganz rund,
// stone-300-Rand, dunkler beim Überfahren, gefüllt wenn aktiv. Keine
// outline-Klassen: der globale :focus-visible-Rahmen greift.

export const PILL =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-medium transition-colors"
export const PILL_IDLE =
  "border-stone-300 bg-white text-stone-800 hover:border-stone-500"
export const PILL_ACTIVE =
  "border-stone-800 bg-stone-800 text-white hover:bg-stone-700"

/** Seitenleiste ab 1024px */
export const PILL_SM = "h-8 min-w-[2.5rem] px-3 text-xs"
/** Schublade und Handy: 44px Tippfläche wie die Looks-Chips */
export const PILL_MD = "h-11 min-w-[3rem] px-4 text-sm"

/** Farbfelder: feiner Ring statt dickem Rand; gewählt = dunkler Ring wie ein aktiver Chip */
export const SWATCH = "rounded-full transition-shadow"
export const SWATCH_IDLE = "ring-1 ring-black/10 hover:ring-black/30"
export const SWATCH_ACTIVE =
  "ring-2 ring-stone-800 ring-offset-2 ring-offset-white"
