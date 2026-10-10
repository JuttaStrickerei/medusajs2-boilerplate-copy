import type { HttpTypes } from "@medusajs/types"
import type { StoreLook } from "@lib/data/looks"

// Farbe, in der ein Teil im Look getragen wird:
// metadata.item_colors = { "<Produkt-Handle>": "<Farbwert>" }, z. B.
// { "rock-nalea": "Bordeaux" }. Ohne Eintrag gilt die erste Farbe des Produkts.
// Handle statt Produkt-ID, damit dieselben Angaben auf Dev und Prod passen.
export const getItemColors = (
  metadata: StoreLook["metadata"]
): Record<string, string> => {
  const raw = metadata?.item_colors
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && !!entry[1].trim()
      )
      .map(([handle, color]) => [handle.trim(), color.trim()])
  )
}

/**
 * Vorschaubild eines Teils in der Farbe des Looks: Vorschaubild bzw. erstes
 * Bild einer Variante dieser Farbe, sonst das Produktbild. Braucht
 * variants.thumbnail und variants.options.value.
 */
export const colorThumbnail = (
  product: HttpTypes.StoreProduct,
  color?: string
): string | null => {
  if (color) {
    const variant = product.variants?.find((v) =>
      v.options?.some((o) => o.value === color)
    )
    const url = variant?.thumbnail || variant?.images?.[0]?.url
    if (url) return url
  }
  return product.thumbnail || product.images?.[0]?.url || null
}
