import type { StoreLook } from "@lib/data/looks"

/**
 * Saisons der Looks: Die Saison eines Looks ist die Produkt-Kollektion
 * seiner Teile (Mehrheit, bei Gleichstand das erste Teil). Kein eigenes
 * Admin-Feld nötig. Rein und ohne Abfragen, damit Server und Client es
 * gleich nutzen können.
 */

/** Ausschnitt aus /store/collections mit products.id */
export type SeasonCollection = {
  id: string
  handle: string
  title: string
  created_at: string | Date | null
  metadata: Record<string, unknown> | null
  products?: { id: string }[] | null
}

export type LookSeason = {
  /** ID der Produkt-Kollektion */
  collectionId: string
  handle: string
  title: string
  lookCount: number
  isCurrent: boolean
  /** ohne Ländercode: aktuelle Saison /looks, ältere /looks/saison/<handle> */
  href: string
}

export type LookSeasonIndex = {
  /** neueste zuerst */
  seasons: LookSeason[]
  current: LookSeason | null
  /** Look-ID → Handle der Saison (null = keinem Teil ist eine Kollektion zugeordnet) */
  seasonOf: Record<string, string | null>
}

export const SEASON_PATH = "/looks/saison"

// Optional im Admin unter Metadaten der Kollektion: season_start = "2027-02"
const SEASON_START_PATTERN = /^\d{4}-\d{2}(-\d{2})?$/
// Nur ganze Wörter: Kürzel wie „hw“ träfen auch „scHWarz“
const AUTUMN_WINTER_PATTERN = /(herbst|winter)\D{0,12}(\d{4})/i
const SPRING_SUMMER_PATTERN =
  /(frühjahr|frühling|fruehjahr|fruehling|sommer)\D{0,12}(\d{4})/i
const AUTUMN_WINTER_MONTH = "08"
const SPRING_SUMMER_MONTH = "02"

const seasonFromText = (text: string | null | undefined): string | null => {
  if (!text) {
    return null
  }
  const autumn = text.match(AUTUMN_WINTER_PATTERN)
  if (autumn) {
    return `${autumn[2]}-${AUTUMN_WINTER_MONTH}`
  }
  const spring = text.match(SPRING_SUMMER_PATTERN)
  if (spring) {
    return `${spring[2]}-${SPRING_SUMMER_MONTH}`
  }
  return null
}

const createdAt = (c: SeasonCollection): string =>
  c.created_at ? new Date(c.created_at).toISOString() : ""

/**
 * Beginn der Saison als ISO-Präfix (als Text vergleichbar): Metadaten
 * season_start, sonst Jahr und Saison aus Titel oder Handle, sonst
 * created_at. created_at allein machte eine später angelegte FS-Kollektion
 * zur „neuesten“, obwohl HW gerade läuft.
 */
export const seasonStart = (c: SeasonCollection): string => {
  const fromMetadata = c.metadata?.season_start
  if (
    typeof fromMetadata === "string" &&
    SEASON_START_PATTERN.test(fromMetadata)
  ) {
    return fromMetadata
  }
  return seasonFromText(c.title) ?? seasonFromText(c.handle) ?? createdAt(c)
}

/**
 * Kollektion mit den meisten Teilen des Looks. Gleichstand: die Kollektion
 * des ersten Teils (Reihenfolge im Look), das zu einer davon gehört.
 */
export const majorityCollection = (
  productIds: string[],
  collectionOf: ReadonlyMap<string, string>
): string | null => {
  const collectionIds = productIds
    .map((id) => collectionOf.get(id))
    .filter((id): id is string => !!id)

  // Ein Look hat nur eine Handvoll Teile: einfaches Zählen genügt
  const countOf = (id: string) => collectionIds.filter((c) => c === id).length
  const max = Math.max(0, ...collectionIds.map(countOf))

  return collectionIds.find((id) => countOf(id) === max) ?? null
}

const byNewest = (a: SeasonCollection, b: SeasonCollection): number => {
  const start = seasonStart(b).localeCompare(seasonStart(a))
  return start !== 0 ? start : createdAt(b).localeCompare(createdAt(a))
}

export const buildSeasonIndex = (
  looks: StoreLook[],
  collections: SeasonCollection[]
): LookSeasonIndex => {
  const collectionOf = new Map(
    collections.flatMap((c) =>
      (c.products ?? []).map((p) => [p.id, c.id] as const)
    )
  )
  const handleOf = new Map(collections.map((c) => [c.id, c.handle]))

  const seasonOf: Record<string, string | null> = Object.fromEntries(
    looks.map((look) => {
      const collectionId = majorityCollection(look.product_ids, collectionOf)
      return [look.id, collectionId ? handleOf.get(collectionId) ?? null : null]
    })
  )

  const assigned = Object.values(seasonOf)
  const countOf = (handle: string) =>
    assigned.filter((h) => h === handle).length
  const unassignedCount = assigned.filter((h) => h === null).length

  const seasons: LookSeason[] = collections
    .filter((c) => countOf(c.handle) > 0)
    .sort(byNewest)
    .map((c, i) => ({
      collectionId: c.id,
      handle: c.handle,
      title: c.title,
      // Looks ohne Kollektion zählen zur aktuellen Saison, damit sie auf
      // /looks nie verschwinden
      lookCount: countOf(c.handle) + (i === 0 ? unassignedCount : 0),
      isCurrent: i === 0,
      href: i === 0 ? "/looks" : `${SEASON_PATH}/${c.handle}`,
    }))

  return { seasons, current: seasons[0] ?? null, seasonOf }
}

/**
 * Looks einer Saison in der Reihenfolge der Eingabe. Ohne Saisons (keine
 * Kollektion oder Abfrage gescheitert) alle Looks; die aktuelle Saison
 * enthält auch Looks ohne Kollektion.
 */
export const looksOfSeason = (
  looks: StoreLook[],
  index: LookSeasonIndex,
  handle: string | null
): StoreLook[] => {
  if (!index.current) {
    return looks
  }
  const target = handle ?? index.current.handle
  const isCurrent = target === index.current.handle

  return looks.filter((look) => {
    const season = index.seasonOf[look.id] ?? null
    return season === target || (isCurrent && season === null)
  })
}
