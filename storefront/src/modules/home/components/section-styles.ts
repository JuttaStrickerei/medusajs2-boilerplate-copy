// Gemeinsame Kopf-Klassen der Look-Abschnitte auf der Startseite, damit
// Farbwelten, Looks-Reihe und „Shop the Look“ gleich aussehen.

export const HOME_EYEBROW =
  "text-xs uppercase leading-4 tracking-[0.18em] text-stone-600"

export const HOME_H2 =
  "font-serif text-[1.75rem] font-normal leading-[2.125rem] text-stone-900 small:text-4xl small:leading-[2.75rem]"

export const HOME_SUB =
  "mt-1 text-pretty text-[15px] leading-[22px] text-stone-600"

/** „Shop the Look“: Look und Teile, Abstände wie Produktraster und Looks */
export const SPOTLIGHT_GRID =
  "grid grid-cols-2 gap-x-3 gap-y-6 tablet:grid-cols-4 tablet:gap-x-4 tablet:gap-y-8 small:gap-x-5 small:gap-y-10 medium:gap-x-6 large:col-span-4"

/**
 * Die Farbwelt-Türen schauen unten in den Hero hinein. --home-peek ist der
 * sichtbare Teil der Fotos, --home-label die Zeile „Finden Sie Ihre Farbe“
 * darüber. Gesetzt auf dem Wrapper um Hero und Looks (page.tsx), damit
 * Hero, Türen und ihr Platzhalter dieselben Maße nutzen.
 */
export const HOME_PEEK_VARS =
  "[--home-peek:8rem] [--home-label:3.5rem] [--home-overlap:calc(var(--home-peek)_+_var(--home-label))] small:[--home-peek:10rem] large:[--home-peek:12rem]"

/** Türen-Abschnitt: oben durchsichtig über dem Hero, darunter stone-50 */
export const DOORS_SECTION =
  "relative z-10 -mt-[var(--home-overlap)] bg-[linear-gradient(transparent_var(--home-overlap),#fafaf9_0)]"

/** Garn-Farbstreifen genau auf der Unterkante des Hero, hinter den Türen */
export const DOORS_SEAM = "absolute inset-x-0 top-[var(--home-overlap)]"

/** Zeile über den Türen, weiß auf dem Video */
export const DOORS_LABEL =
  "flex h-[var(--home-label)] items-end gap-3 pb-3 text-white [text-shadow:0_1px_12px_rgb(0_0_0/0.45)]"

export const DOORS_TITLE =
  "font-serif text-xl font-normal leading-7 small:text-2xl small:leading-8"

export const DOORS_META =
  "hidden text-sm leading-7 text-white/85 tablet:block small:leading-8"

export const DOORS_GRID =
  "relative grid grid-cols-2 gap-3 tablet:grid-cols-4 tablet:gap-4 small:gap-6"
