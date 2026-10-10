import type { ApiLookProduct, LookProduct } from "./types"

const COLOR_OPTION_TITLES = ["farbe", "farben", "color", "colour"]

// Farbwerte eines Produkts (Option "Farbe"), z. B. ["Türkis", "Bordeaux"]
export const colorValuesOf = (product: ApiLookProduct): string[] => {
  const option = (product.options ?? []).find((o) =>
    COLOR_OPTION_TITLES.includes((o.title ?? "").trim().toLowerCase())
  )
  return (option?.values ?? []).map((v) => v.value)
}

// metadata.item_colors = { "<Produkt-Handle>": "<Farbe>" }
export const itemColorsOf = (
  metadata: Record<string, unknown> | null | undefined
): Record<string, string> => {
  const raw = metadata?.item_colors
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  )
}

export const toLookProduct = (
  product: ApiLookProduct,
  color?: string
): LookProduct => {
  const colors = colorValuesOf(product)
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    thumbnail: product.thumbnail,
    status: product.status,
    colors,
    ...(color && colors.includes(color) ? { color } : {}),
  }
}

// Farben der Teile für metadata.item_colors; nur Teile mit gewählter Farbe
export const itemColorsFrom = (products: LookProduct[]): Record<string, string> =>
  Object.fromEntries(
    products
      .filter((p) => p.handle && p.color && p.colors?.includes(p.color))
      .map((p) => [p.handle as string, p.color as string])
  )
