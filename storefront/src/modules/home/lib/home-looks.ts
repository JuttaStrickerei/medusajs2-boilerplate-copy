import type { StoreLook } from "@lib/data/looks"
import type {
  LookTileVM,
  OverviewVM,
  WorldVM,
} from "@modules/looks/lib/overview"

/**
 * Reine Hilfsfunktionen für die Looks auf der Startseite (Farbwelten,
 * „Looks der Saison“, „Shop the Look“). Ohne Abfragen; sie arbeiten auf dem
 * View-Model der Looks-Übersicht und liefern immer neue Objekte.
 */

/**
 * Look im Abschnitt „Shop the Look“; hier ändern, um einen anderen zu zeigen.
 * Am besten keiner, der schon eine Farbwelt-Tür anführt (dort steht dessen
 * Foto bereits); die Reihe „Looks der Saison“ lässt ihn von selbst aus.
 */
export const HOME_SPOTLIGHT_LOOK = "look-conte-aaron-tini"
export const RAIL_MAX_LOOKS = 8
const SPOTLIGHT_MAX_PIECES = 3
/** Anteil der Weltfarbe in der Tönung der Tür-Fotos (Rest Weiß) */
const DOOR_TINT_WEIGHT = 0.6
/** Ab so vielen Teilen gilt ein Look als ganzes Outfit */
const MIN_PIECES_FOR_LOOK = 2

const HEX_PATTERN = /^#([0-9a-f]{6})$/i
const WHITE_CHANNEL = 255

/**
 * Mischt eine Farbe mit Weiß (weight = Anteil der Farbe, 0–1). In TS statt
 * CSS color-mix(), damit auch ältere iPads die Tönung zeigen. Unbekannte
 * Formate kommen unverändert zurück.
 */
const mixWithWhite = (hex: string, weight: number): string => {
  const match = hex.match(HEX_PATTERN)
  if (!match) return hex
  const share = Math.min(1, Math.max(0, weight))
  const value = parseInt(match[1], 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  const mixed = channels.map((c) =>
    Math.round(c * share + WHITE_CHANNEL * (1 - share))
  )
  return `#${mixed
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`
}

/**
 * Hintergrund hinter dem Tür-Foto: helle Welten aufgehellt, dunkle wie die
 * Chip-Leiste. Nimmt auch die Welt-Konfiguration (für den Platzhalter).
 */
export const doorTint = (band: Pick<WorldVM, "theme" | "chipTint">): string =>
  band.theme === "dark"
    ? band.chipTint
    : mixWithWhite(band.chipTint, DOOR_TINT_WEIGHT)

const CENTS_PER_EURO = 100

/**
 * „5 Looks · ab € 80“: der niedrigste echte Look-Preis, nie abgerundet
 * (krumme Preise mit Cent, „ab € 89,90“). Ohne Preise nur die Anzahl.
 */
export const doorMeta = (band: WorldVM): string => {
  const { looks } = band
  const count = looks.length === 1 ? "1 Look" : `${looks.length} Looks`
  // in Cent, damit Gleitkomma-Reste (89.89999…) nicht zählen
  const cents = looks
    .map((l) => l.amount)
    .filter((a): a is number => typeof a === "number")
    .map((a) => Math.round(a * CENTS_PER_EURO))
  if (!cents.length) return count

  const currency = (
    looks.find((l) => l.currency)?.currency ?? "eur"
  ).toUpperCase()
  const minCents = Math.min(...cents)
  const digits = minCents % CENTS_PER_EURO === 0 ? 0 : 2
  const price = new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minCents / CENTS_PER_EURO)
  // „ab“ nur, wenn die Looks verschieden viel kosten; geschütztes Leerzeichen,
  // damit schmale Türen nicht zwischen „ab“ und dem Preis umbrechen
  const isSinglePrice = cents.every((c) => c === minCents)
  return `${count} · ${isSinglePrice ? "" : "ab\u00A0"}${price}`
}

export type Spotlight = {
  tile: LookTileVM
  band: WorldVM
  /** die ersten Teile in der Reihenfolge des Looks */
  productIds: string[]
  /** Teile, die nicht als Karte gezeigt werden */
  extraCount: number
}

/**
 * Look für „Shop the Look“: der gewünschte, sonst der erste Aufmacher einer
 * Welt, sonst der erste Look überhaupt – jeweils nur, wenn er aus mindestens
 * zwei Teilen besteht.
 */
export const pickSpotlight = ({
  overview,
  looks,
  preferred,
}: {
  overview: OverviewVM
  looks: StoreLook[]
  preferred: string
}): Spotlight | null => {
  const lookByHandle = new Map(looks.map((l) => [l.handle, l]))
  const candidates = [
    preferred,
    ...overview.bands.flatMap((b) => (b.looks[0] ? [b.looks[0].handle] : [])),
    ...overview.ordered.map((l) => l.handle),
  ]

  const handle = candidates.find(
    (h) =>
      (lookByHandle.get(h)?.product_ids.length ?? 0) >= MIN_PIECES_FOR_LOOK &&
      overview.ordered.some((l) => l.handle === h)
  )
  if (!handle) return null

  const band = overview.bands.find((b) =>
    b.looks.some((l) => l.handle === handle)
  )
  const tile = band?.looks.find((l) => l.handle === handle)
  if (!band || !tile) return null

  const productIds = lookByHandle.get(handle)?.product_ids ?? []
  return {
    tile,
    band,
    productIds: productIds.slice(0, SPOTLIGHT_MAX_PIECES),
    extraCount: Math.max(0, productIds.length - SPOTLIGHT_MAX_PIECES),
  }
}

// Reihum aus jeder Liste den nächsten Eintrag: Welt 1, Welt 2, … Welt 1, …
const interleave = <T>(lists: T[][]): T[] => {
  const rounds = Math.max(0, ...lists.map((list) => list.length))
  return Array.from({ length: rounds }, (_, round) =>
    lists.flatMap((list) => (round < list.length ? [list[round]] : []))
  ).flat()
}

/**
 * Looks für die Reihe „Looks der Saison“: reihum über die Welten (damit die
 * Reihe bunt ist), jede Welt in ihrer eigenen Reihenfolge. Zuerst ganze
 * Outfits (ab zwei Teilen), dann der Rest. Positionen beginnen bei 1.
 */
export const pickRailLooks = ({
  bands,
  exclude,
  pieceCountOf,
  max,
}: {
  bands: WorldVM[]
  /** Handles, die schon anderswo auf der Seite stehen */
  exclude: string[]
  pieceCountOf: (handle: string) => number
  max: number
}): LookTileVM[] => {
  const excluded = new Set(exclude)
  const perBand = bands.map((band) =>
    band.looks.filter((look) => !excluded.has(look.handle))
  )
  const isOutfit = (look: LookTileVM) =>
    pieceCountOf(look.handle) >= MIN_PIECES_FOR_LOOK

  const outfits = interleave(perBand.map((looks) => looks.filter(isOutfit)))
  const singles = interleave(
    perBand.map((looks) => looks.filter((look) => !isOutfit(look)))
  )

  return [...outfits, ...singles]
    .slice(0, max)
    .map((look, i) => ({ ...look, position: i + 1 }))
}

/** Bänder, die als Farbwelt-Tür taugen (echte Welt mit Farbkarte und Looks) */
export const doorBands = (overview: OverviewVM): WorldVM[] =>
  overview.showNav
    ? overview.bands.filter(
        (band) => band.swatches.length > 0 && band.looks.length > 0
      )
    : []
