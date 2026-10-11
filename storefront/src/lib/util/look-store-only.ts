import type { StoreLook } from "@lib/data/looks"

// Teile eines Looks, die es nur im Geschäft gibt (z. B. Poncho SELVA):
// Vorschaubild mit Hinweis, ohne Produktseite, Preis oder Warenkorb.
// metadata.store_only_pieces = [{ title, color?, image, note? }]
export type StoreOnlyPiece = {
  title: string
  color?: string
  image: string
  note: string
}

const DEFAULT_NOTE = "Nur im Geschäft erhältlich"

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : ""

export const getStoreOnlyPieces = (
  metadata: StoreLook["metadata"]
): StoreOnlyPiece[] => {
  const raw = metadata?.store_only_pieces
  if (!Array.isArray(raw)) return []

  return raw.flatMap((entry): StoreOnlyPiece[] => {
    if (!entry || typeof entry !== "object") return []
    const e = entry as Record<string, unknown>
    const title = text(e.title)
    const image = text(e.image)
    if (!title || !/^https?:\/\//.test(image)) return []
    return [
      {
        title,
        image,
        color: text(e.color) || undefined,
        note: text(e.note) || DEFAULT_NOTE,
      },
    ]
  })
}
