import { HttpTypes } from "@medusajs/types"
import {
  imagesForColor,
  productColors,
  variantColor,
} from "@lib/util/product-colors"

// Fotos der Produktkarte zum Wischen (unter 1280px). Ohne "use client":
// Server-Komponenten rechnen die Folien aus und geben nur diese kleine Liste
// an die Karte, nicht die Bild-Zuordnung aller Varianten.

export type CardSlide = {
  url: string
  /** Farbe, die das Foto zeigt; nur bei Produkten mit mehreren Farben. Bestimmt den Link der Karte. */
  color?: string
  /** Nur am ersten Foto: zweites Foto derselben Farbe für das Überfahren ab 1280px */
  hover?: string
}

/** Mehrere Farben: ein Foto je Farbe, höchstens so viele */
export const MAX_CARD_SLIDES = 4
/** Eine Farbe: die ersten Fotos der Galerie */
const SINGLE_COLOR_SLIDES = 3

/** Fotos, die an den Varianten dieser Farbe hängen, in der Reihenfolge der Galerie */
const ownImages = (product: HttpTypes.StoreProduct, color: string) => {
  const ids = new Set<string>()
  for (const variant of product.variants ?? []) {
    if (variantColor(product, variant) !== color) continue
    for (const image of variant.images ?? []) ids.add(image.id)
  }
  return (product.images ?? []).filter((image) => ids.has(image.id))
}

/**
 * Folien der Karte. Mehrere Farben mit eigenen Fotos: das erste Foto jeder
 * Farbe in der Reihenfolge der Galerie. Sonst die ersten drei Fotos.
 * `startColor` (z. B. aus dem Farbfilter) kommt nach vorn, damit die Karte
 * ohne Nachscrollen mit dieser Farbe beginnt und das sofort geladene Foto stimmt.
 * Braucht für die Farben Produkte mit "variants.images.id" (PRODUCT_LIST_FIELDS).
 */
export function cardSlides(
  product: HttpTypes.StoreProduct,
  startColor?: string
): CardSlide[] {
  const colors = productColors(product)
  const start =
    startColor && colors.length > 1 && colors.includes(startColor)
      ? startColor
      : undefined

  if (colors.length > 1) {
    // Farben ohne eigenes erstes Foto (gleiche Fotos für alle Farben) fallen weg
    const used = new Set<string>()
    const perColor: CardSlide[] = []
    for (const color of colors) {
      const [first, second] = ownImages(product, color)
      if (!first || used.has(first.id)) continue
      used.add(first.id)
      perColor.push({ url: first.url, color, hover: second?.url })
    }
    if (
      perColor.length > 1 &&
      (!start || perColor.some((slide) => slide.color === start))
    ) {
      const ordered = start
        ? [
            ...perColor.filter((slide) => slide.color === start),
            ...perColor.filter((slide) => slide.color !== start),
          ]
        : perColor
      return ordered
        .slice(0, MAX_CARD_SLIDES)
        .map(({ url, color, hover }, index) =>
          index === 0 && hover ? { url, color, hover } : { url, color }
        )
    }
  }

  // Eine Farbe, oder die Farben teilen sich die Fotos: Titelbild und die
  // nächsten Fotos. Mit Startfarbe führt der Link trotzdem zu dieser Farbe.
  const pool = start ? imagesForColor(product, start) : product.images ?? []
  const urls = Array.from(
    new Set(
      [start ? undefined : product.thumbnail, ...pool.map((image) => image.url)]
        .filter((url): url is string => !!url)
    )
  ).slice(0, SINGLE_COLOR_SLIDES)

  return urls.map((url, index) =>
    start
      ? index === 0 && urls[1]
        ? { url, color: start, hover: urls[1] }
        : { url, color: start }
      : { url }
  )
}

/**
 * Produkt ohne die Bild-Zuordnung der Varianten. Für Server-Komponenten, die
 * der Karte die fertigen Folien mitgeben: die IDs müssen dann nicht ins HTML.
 */
export const withoutVariantImages = (
  product: HttpTypes.StoreProduct
): HttpTypes.StoreProduct => ({
  ...product,
  variants:
    product.variants?.map(
      ({ images, ...variant }) => variant as HttpTypes.StoreProductVariant
    ) ?? null,
})
