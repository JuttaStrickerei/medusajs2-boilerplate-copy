import { HttpTypes } from "@medusajs/types"
import type { CSSProperties } from "react"

import type { StoreLook } from "@lib/data/looks"
import { BRAND, type GaItem } from "@lib/util/analytics"
import { COLOR_OPTION_TITLES, getColorGroupKeys } from "@lib/util/filter-groups"
import { getPhotoNotes } from "@lib/util/look-photo-notes"
import { colorThumbnail, getItemColors } from "@lib/util/look-item-colors"
import { sumLookPrices, type LookPriceSum } from "@lib/util/look-price"
import { formatPrice } from "@lib/utils"
import {
  ALL_LOOK_WORLDS,
  AUTO_WORLD_BY_COLOR,
  FALLBACK_WORLD,
  LOOK_ART,
  PIECE_TYPES,
  type LookWorld,
  type WorldSwatch,
  type WorldTheme,
} from "./worlds"

/**
 * Reine Hilfsfunktionen für die Looks-Übersicht (Server und Client).
 * Die Komponenten bekommen nur diese View-Models, nie ganze Produkte.
 */

// Unter so vielen Looks lohnt keine Aufteilung in Farbwelten
export const MIN_LOOKS_FOR_WORLDS = 8
const MIN_WORLDS = 2
// Ab so vielen Looks bekommt eine Welt den großen Aufmacher (2×2)
const MIN_LOOKS_FOR_LEAD = 4
const MAX_PACKSHOTS = 4
const MAX_TAGLINE_LENGTH = 120
const COVER_ZOOM_RANGE = [1, 1.3] as const
const COVER_POSITION_PATTERN = /^\d{1,3}% \d{1,3}%$/

export type LookCover = {
  src: string | null
  /** zweites Foto für Hover (Desktop); bei KI-Titelbild das Studiofoto */
  hoverSrc: string | null
  isAi: boolean
  position?: string
  zoom?: number
  origin?: string
  /** Hinweis „Nicht alle Teile im Bild …“ (geprüft am Studiofoto) */
  showNote: boolean
}

export type PriceLabel = {
  /** „3 Teile · zusammen € 210,00“ bzw. „1 Teil · € 80,00“ */
  text: string
  /** Originalpreis bei Aktion */
  original: string | null
}

export type LookTileVM = {
  id: string
  handle: string
  /** voller Titel („Look VIOLA“) für Alt-Text, SEO und Analytics */
  title: string
  /** sichtbarer Name ohne „Look “ */
  name: string
  alt: string
  cover: LookCover
  /** „Pullover · Rock · Schal“ (ohne Preise: „3 Teile“) */
  piecesLabel: string
  price: PriceLabel | null
  amount: number | null
  currency: string | null
  thumbs: string[]
  mood: string | null
  /** Position auf der Seite, 1-basiert */
  position: number
  worldKey: string
  worldName: string
}

export type EndSpans = { small: number; large: number }

export type WorldVM = {
  key: string
  name: string
  shortName: string
  tagline: string
  swatches: WorldSwatch[]
  theme: WorldTheme
  style: CSSProperties
  chipTint: string
  accent: string
  storeHref: string
  looks: LookTileVM[]
  hasLead: boolean
  metaLabel: string
  endSpans: EndSpans
  endClasses: string
}

export type OverviewVM = {
  bands: WorldVM[]
  ordered: LookTileVM[]
  /** Chip-Leiste nur bei mindestens zwei echten Farbwelten */
  showNav: boolean
}

// ---------------------------------------------------------------------------
// Texte

export const displayName = (title: string): string =>
  title.replace(/^Look\s+/i, "").trim()

/** Erstes Wort des Produkttitels, wenn es eine bekannte Teile-Art ist */
export const pieceType = (title: string): string => {
  const trimmed = title.trim()
  const first = trimmed.split(/\s+/)[0]?.toLowerCase()
  return PIECE_TYPES.find((type) => type.toLowerCase() === first) ?? trimmed
}

/** „A, B und C“ */
export const joinGerman = (parts: string[]): string => {
  if (parts.length <= 1) return parts[0] ?? ""
  return `${parts.slice(0, -1).join(", ")} und ${parts[parts.length - 1]}`
}

const countLabel = (count: number): string =>
  count === 1 ? "1 Teil" : `${count} Teile`

/** Preiszeile wie auf der Look-Seite */
export const metaLabel = (
  count: number,
  sum: LookPriceSum | null
): PriceLabel | null => {
  if (!sum || count === 0) return null
  const prefix = `${count > 1 ? "zusammen " : ""}${sum.from ? "ab " : ""}`
  const original =
    sum.onSale && sum.original > sum.amount
      ? formatPrice(sum.original, sum.currency)
      : null
  return {
    text: `${countLabel(count)} · ${prefix}${formatPrice(
      sum.amount,
      sum.currency
    )}`,
    original,
  }
}

/** „5 Looks · € 80 bis € 230“ (ganze Euro, abgerundet bzw. aufgerundet) */
export const worldRangeLabel = (looks: LookTileVM[]): string => {
  const count = looks.length === 1 ? "1 Look" : `${looks.length} Looks`
  const amounts = looks
    .map((l) => l.amount)
    .filter((a): a is number => typeof a === "number")
  if (!amounts.length) return count

  const currency = (
    looks.find((l) => l.currency)?.currency ?? "eur"
  ).toUpperCase()
  const euro = new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  const min = Math.floor(Math.min(...amounts))
  const max = Math.ceil(Math.max(...amounts))
  return min === max
    ? `${count} · ${euro.format(min)}`
    : `${count} · ${euro.format(min)} bis ${euro.format(max)}`
}

// ---------------------------------------------------------------------------
// Raster: Breite der Schlusskachel „Alle Teile in diesen Farben“

/**
 * Wie viele Spalten die Schlusskachel füllt, damit jede Welt ein
 * vollständiges Raster ergibt (small = 4 Spalten, large = 5 Spalten).
 * n = Anzahl Looks ohne den Aufmacher.
 */
export const endSpans = (n: number, hasLead: boolean): EndSpans => {
  if (!hasLead) {
    return { small: (4 - (n % 4)) % 4, large: (5 - (n % 5)) % 5 }
  }
  const smallRest = (n - 4) % 4
  const small = n <= 4 ? 4 - n : smallRest ? 4 - smallRest : 0
  const largeRest = (n - 6) % 5
  const large = n <= 6 ? 6 - n : largeRest ? 5 - largeRest : 0
  return { small, large }
}

// Wörtlich ausgeschrieben, sonst findet Tailwind die Klassen nicht
const SMALL_SPAN: Record<number, string> = {
  0: "small:hidden",
  1: "small:col-span-1",
  2: "small:col-span-2",
  3: "small:col-span-3",
}
const LARGE_SPAN: Record<number, string> = {
  0: "large:hidden",
  1: "large:flex large:col-span-1",
  2: "large:flex large:col-span-2",
  3: "large:flex large:col-span-3",
  4: "large:flex large:col-span-4",
}

export const endSpanClasses = ({ small, large }: EndSpans): string =>
  `${SMALL_SPAN[small] ?? ""} ${LARGE_SPAN[large] ?? ""}`.trim()

// ---------------------------------------------------------------------------
// metadata

export type LookOverrides = {
  colorWorld?: string
  coverIndex?: number
  coverImage?: string
  coverPosition?: string
  coverZoom?: number
  tagline?: string
}

/** NEXT_PUBLIC_MINIO_ENDPOINT ist ein Hostname oder eine URL */
export const minioHostFrom = (endpoint: string | undefined): string | null => {
  if (!endpoint) return null
  try {
    return endpoint.includes("://")
      ? new URL(endpoint).hostname
      : new URL(`https://${endpoint}`).hostname
  } catch {
    return null
  }
}

/**
 * Nur Bilder vom eigenen Bucket (oder localhost): next/image wirft bei
 * unbekannten Hosts und die ganze Seite fiele aus.
 */
const isAllowedImageUrl = (
  value: unknown,
  host: string | null
): value is string => {
  if (typeof value !== "string") return false
  try {
    const url = new URL(value)
    if (url.protocol === "http:" && url.hostname === "localhost") return true
    return url.protocol === "https:" && !!host && url.hostname === host
  } catch {
    return false
  }
}

const WORLD_KEYS = new Set(ALL_LOOK_WORLDS.map((w) => w.key))

// Zahl aus metadata (Zahl oder Ziffern-Text aus dem Admin), sonst null
const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value !== "string" || !value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Liest die optionalen Schlüssel; Ungültiges wird still ignoriert */
export const sanitizeLookMetadata = (
  metadata: StoreLook["metadata"],
  imageCount: number,
  minioHost: string | null
): LookOverrides => {
  if (!metadata || typeof metadata !== "object") return {}
  const m = metadata as Record<string, unknown>
  const out: LookOverrides = {}

  if (typeof m.color_world === "string" && WORLD_KEYS.has(m.color_world)) {
    out.colorWorld = m.color_world
  }
  const index = toNumber(m.cover_index)
  if (
    index !== null &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < imageCount
  ) {
    out.coverIndex = index
  }
  if (isAllowedImageUrl(m.cover_image, minioHost)) {
    out.coverImage = m.cover_image
  }
  if (
    typeof m.cover_position === "string" &&
    COVER_POSITION_PATTERN.test(m.cover_position)
  ) {
    out.coverPosition = m.cover_position
  }
  const zoom = toNumber(m.cover_zoom)
  if (
    zoom !== null &&
    zoom >= COVER_ZOOM_RANGE[0] &&
    zoom <= COVER_ZOOM_RANGE[1]
  ) {
    out.coverZoom = zoom
  }
  if (
    typeof m.tagline === "string" &&
    m.tagline.trim() &&
    m.tagline.trim().length <= MAX_TAGLINE_LENGTH
  ) {
    out.tagline = m.tagline.trim()
  }
  return out
}

// ---------------------------------------------------------------------------
// Titelbild

/**
 * Titelbild, Hover-Foto, Bildausschnitt und Foto-Hinweis eines Looks.
 * Der Hinweis prüft immer das Studiofoto, auch wenn ein KI-Titelbild
 * gezeigt wird (dort sind dieselben Teile zu sehen).
 */
export const resolveCover = (
  look: StoreLook,
  overrides: LookOverrides,
  products: HttpTypes.StoreProduct[] | null,
  minioHost: string | null
): LookCover => {
  const art = LOOK_ART[look.handle] ?? {}
  const images = look.images ?? []
  const lookColors = getItemColors(look.metadata)
  const artIndex =
    typeof art.coverIndex === "number" && images[art.coverIndex]
      ? art.coverIndex
      : 0
  const wanted = overrides.coverIndex ?? artIndex
  const studioIndex = images[wanted] ? wanted : images.length ? 0 : -1

  const studio =
    (studioIndex >= 0 ? images[studioIndex] : null) ??
    (products ?? [])
      .map((p) => colorThumbnail(p, lookColors[p.handle ?? ""]))
      .find((url): url is string => !!url) ??
    look.product_thumbnails[0] ??
    null

  const aiSrc =
    overrides.coverImage ??
    (isAllowedImageUrl(art.coverImage, minioHost) ? art.coverImage : undefined)
  const isAi = !!aiSrc

  const hoverSrc = isAi
    ? studio
    : images.find((_, i) => i !== studioIndex) ?? null

  const zoom = overrides.coverZoom ?? (isAi ? undefined : art.zoom)
  const origin = overrides.coverPosition ?? (isAi ? undefined : art.origin)
  const notes = getPhotoNotes(look.metadata)

  return {
    src: aiSrc ?? studio,
    hoverSrc: hoverSrc && hoverSrc !== (aiSrc ?? studio) ? hoverSrc : null,
    isAi,
    ...(overrides.coverPosition ? { position: overrides.coverPosition } : {}),
    ...(zoom && zoom !== 1 ? { zoom, origin } : {}),
    showNote: studioIndex >= 0 && notes.has(images[studioIndex]),
  }
}

// ---------------------------------------------------------------------------
// Farbwelt

const colorOfFirstPiece = (
  products: HttpTypes.StoreProduct[] | null
): string | null => {
  const option = products?.[0]?.options?.find((o) =>
    COLOR_OPTION_TITLES.includes((o.title ?? "").toLowerCase())
  )
  return option?.values?.[0]?.value ?? null
}

const CONFIG_WORLD_BY_HANDLE = new Map(
  ALL_LOOK_WORLDS.flatMap((w) => w.handles.map((h) => [h, w.key] as const))
)

/** metadata → Konfiguration → Farbe des ersten Teils → „Weitere Looks“ */
const assignWorld = (
  look: StoreLook,
  overrides: LookOverrides,
  products: HttpTypes.StoreProduct[] | null
): string => {
  if (overrides.colorWorld) return overrides.colorWorld
  const configured = CONFIG_WORLD_BY_HANDLE.get(look.handle)
  if (configured) return configured
  const color = colorOfFirstPiece(products)
  const group = color ? getColorGroupKeys(color)[0] : undefined
  return (group && AUTO_WORLD_BY_COLOR[group]) || FALLBACK_WORLD.key
}

// ---------------------------------------------------------------------------
// View-Model

type Entry = {
  look: StoreLook
  tile: Omit<LookTileVM, "position" | "worldName">
}

const buildTile = (
  look: StoreLook,
  products: HttpTypes.StoreProduct[] | null,
  minioHost: string | null
): Entry["tile"] => {
  const overrides = sanitizeLookMetadata(
    look.metadata,
    look.images?.length ?? 0,
    minioHost
  )
  const title = look.title
  const itemColors = getItemColors(look.metadata)
  const types = products ? products.map((p) => pieceType(p.title ?? "")) : []
  const count = products ? products.length : look.product_ids.length
  const sum = products ? sumLookPrices(products) : null

  return {
    id: look.id,
    handle: look.handle,
    title,
    name: displayName(title),
    alt: types.length ? `${title}: ${joinGerman(types)}` : title,
    cover: resolveCover(look, overrides, products, minioHost),
    piecesLabel: types.length
      ? types.join(" · ")
      : count > 0
      ? countLabel(count)
      : "",
    price: products ? metaLabel(count, sum) : null,
    amount: sum?.amount ?? null,
    currency: sum?.currency ?? null,
    thumbs: (products ?? [])
      .map((p) => colorThumbnail(p, itemColors[p.handle ?? ""]))
      .filter((t): t is string => !!t)
      .slice(0, MAX_PACKSHOTS),
    mood: overrides.tagline ?? LOOK_ART[look.handle]?.mood ?? null,
    worldKey: assignWorld(look, overrides, products),
  }
}

/** Konfigurierte Looks zuerst (in Konfig-Reihenfolge), dann nach rank */
const orderInWorld = (entries: Entry[], world: LookWorld): Entry[] => {
  const configIndex = (handle: string) => {
    const i = world.handles.indexOf(handle)
    return i === -1 ? Number.POSITIVE_INFINITY : i
  }
  return [...entries].sort(
    (a, b) =>
      configIndex(a.look.handle) - configIndex(b.look.handle) ||
      a.look.rank - b.look.rank
  )
}

const toWorldVM = (
  world: LookWorld,
  entries: Entry[],
  firstPosition: number,
  name = world.name
): WorldVM => {
  const looks: LookTileVM[] = entries.map(({ tile }, i) => ({
    ...tile,
    worldKey: world.key,
    worldName: name,
    position: firstPosition + i,
  }))
  const hasLead = looks.length >= MIN_LOOKS_FOR_LEAD
  const spans = endSpans(looks.length - (hasLead ? 1 : 0), hasLead)
  const storeHref = world.storeColors.length
    ? `/store?${new URLSearchParams({ colors: world.storeColors.join(",") })}`
    : "/store"

  return {
    key: world.key,
    name,
    shortName: world.shortName,
    tagline: world.tagline,
    swatches: world.swatches,
    theme: world.theme,
    style: world.tokens as CSSProperties,
    chipTint: world.chipTint,
    accent: world.tokens["--welt-accent"],
    storeHref,
    looks,
    hasLead,
    metaLabel: worldRangeLabel(looks),
    endSpans: spans,
    endClasses: endSpanClasses(spans),
  }
}

export const buildOverview = ({
  looks,
  products,
  minioHost,
}: {
  looks: StoreLook[]
  /** null = Preisabfrage fehlgeschlagen */
  products: HttpTypes.StoreProduct[] | null
  minioHost: string | null
}): OverviewVM => {
  const byId = new Map((products ?? []).map((p) => [p.id, p]))
  const entries: Entry[] = looks.map((look) => {
    // Nur Produkte, die im Verkaufskanal wirklich zurückkamen
    const lookProducts = products
      ? look.product_ids
          .map((id) => byId.get(id))
          .filter((p): p is HttpTypes.StoreProduct => !!p)
      : null
    return { look, tile: buildTile(look, lookProducts, minioHost) }
  })

  const grouped = ALL_LOOK_WORLDS.map((world) => ({
    world,
    entries: orderInWorld(
      entries.filter((e) => e.tile.worldKey === world.key),
      world
    ),
  })).filter((g) => g.entries.length > 0)
  const unassigned = entries
    .filter((e) => !WORLD_KEYS.has(e.tile.worldKey))
    .sort((a, b) => a.look.rank - b.look.rank)

  const useWorlds =
    looks.length >= MIN_LOOKS_FOR_WORLDS && grouped.length >= MIN_WORLDS

  let bands: WorldVM[]
  if (!useWorlds) {
    const all = [...entries].sort((a, b) => a.look.rank - b.look.rank)
    bands = all.length
      ? [
          toWorldVM(
            { ...FALLBACK_WORLD, key: "alle-looks", tagline: "" },
            all,
            1,
            "Alle Looks"
          ),
        ]
      : []
  } else {
    bands = []
    let position = 1
    for (const { world, entries: worldEntries } of grouped) {
      bands = [...bands, toWorldVM(world, worldEntries, position)]
      position += worldEntries.length
    }
    if (unassigned.length) {
      bands = [...bands, toWorldVM(FALLBACK_WORLD, unassigned, position)]
    }
  }

  return {
    bands,
    ordered: bands.flatMap((b) => b.looks),
    showNav: useWorlds && bands.length >= MIN_WORLDS,
  }
}

// ---------------------------------------------------------------------------
// Analytics

export const toGaItem = (tile: LookTileVM): GaItem => ({
  item_id: `look_${tile.handle}`,
  item_name: tile.title,
  item_brand: BRAND,
  item_category: "Look",
  item_category2: tile.worldName,
  ...(typeof tile.amount === "number" ? { price: tile.amount } : {}),
  index: tile.position,
})
