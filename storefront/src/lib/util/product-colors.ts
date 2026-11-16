import { HttpTypes } from "@medusajs/types"

// Farben eines Produkts: welche es gibt, welche Bilder zu welcher Farbe gehören
// und wie ein Link die Farbe mitgibt. Die Zuordnung Bild ↔ Farbe kommt aus den
// Bildern der Varianten (Admin: Bilder je Variante), nicht aus Dateinamen.
// Braucht Produkte, die mit "*variants.images" geladen wurden; ohne diese Angabe
// verhält sich alles wie bei einem Produkt ohne Zuordnung (alle Bilder, keine Vorwahl).

type Product = HttpTypes.StoreProduct
type Variant = HttpTypes.StoreProductVariant

/** Optionsnamen, unter denen die Farbe gepflegt wird (wie bei den Looks und im Feed). */
export const COLOR_OPTION_TITLES = ["farbe", "farben", "color", "colour"]

/** Parameter in der Adresse der Produktseite, z. B. /products/mantel-rouga?farbe=Marine */
export const COLOR_PARAM = "farbe"

export const findColorOption = (product: Product) =>
  product.options?.find((option) =>
    COLOR_OPTION_TITLES.includes((option.title ?? "").trim().toLowerCase())
  )

export const variantColor = (product: Product, variant: Variant): string | undefined => {
  const option = findColorOption(product)
  return option
    ? variant.options?.find((value) => value.option_id === option.id)?.value
    : undefined
}

/** Bild-IDs je Farbe, gesammelt über die Varianten dieser Farbe. */
const imageIdsByColor = (product: Product): Map<string, Set<string>> => {
  const byColor = new Map<string, Set<string>>()
  for (const variant of product.variants ?? []) {
    const color = variantColor(product, variant)
    if (!color) continue
    const ids = byColor.get(color) ?? new Set<string>()
    for (const image of variant.images ?? []) ids.add(image.id)
    byColor.set(color, ids)
  }
  return byColor
}

/**
 * Farben des Produkts. Vorn steht die Farbe, deren Bild in der Galerie zuerst
 * kommt; Farben ohne eigene Bilder stehen hinten, sonst gilt die Reihenfolge der Option.
 */
export function productColors(product: Product): string[] {
  const option = findColorOption(product)
  if (!option) return []
  const colors = Array.from(new Set((option.values ?? []).map((value) => value.value)))
  const byColor = imageIdsByColor(product)
  const images = product.images ?? []
  const firstImage = (color: string) => {
    const ids = byColor.get(color)
    const index = ids ? images.findIndex((image) => ids.has(image.id)) : -1
    return index < 0 ? Number.MAX_SAFE_INTEGER : index
  }
  return colors
    .map((color, position) => ({ color, position, first: firstImage(color) }))
    .sort((a, b) => a.first - b.first || a.position - b.position)
    .map((entry) => entry.color)
}

/**
 * Bilder für eine Farbe in der Reihenfolge der Galerie: die Bilder dieser Farbe
 * und Bilder, die an keiner Variante hängen. Ohne Farbe oder ohne Zuordnung: alle.
 */
export function imagesForColor(product: Product, color?: string) {
  const images = product.images ?? []
  if (!color) return images
  const byColor = imageIdsByColor(product)
  const own = byColor.get(color)
  if (!own || own.size === 0) return images
  const linked = new Set<string>()
  byColor.forEach((ids) => ids.forEach((id) => linked.add(id)))
  return images.filter((image) => own.has(image.id) || !linked.has(image.id))
}

/** Farbe, die das erste Bild der Galerie zeigt. Nur bei Produkten mit mehreren Farben. */
export function defaultColor(product: Product): string | undefined {
  const colors = productColors(product)
  return colors.length > 1 ? colors[0] : undefined
}

/** Schreibweise der Farbe wie am Produkt, egal wie sie in der Adresse steht. */
export const matchColor = (product: Product, value?: string | null): string | undefined => {
  const wanted = value?.trim().toLowerCase()
  if (!wanted) return undefined
  return productColors(product).find((color) => color.toLowerCase() === wanted)
}

/** Pfad der Produktseite (ohne Ländercode), auf Wunsch mit vorgewählter Farbe. */
export const productPath = (handle: string, color?: string) =>
  `/products/${handle}${color ? `?${COLOR_PARAM}=${encodeURIComponent(color)}` : ""}`
