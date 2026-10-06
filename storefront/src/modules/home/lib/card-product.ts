import { HttpTypes } from "@medusajs/types"

// Was ProductPreview zum Bild-Wechsel braucht (Titelbild + Hover-Foto)
const CARD_IMAGES = 2

type CalculatedPrice = NonNullable<
  HttpTypes.StoreProductVariant["calculated_price"]
>

// Nur die Preisfelder, die getProductPrice liest (Brutto, Original, Aktion)
const toCardPrice = (price: CalculatedPrice) => ({
  calculated_amount: price.calculated_amount,
  calculated_amount_with_tax: price.calculated_amount_with_tax,
  original_amount: price.original_amount,
  original_amount_with_tax: price.original_amount_with_tax,
  currency_code: price.currency_code,
  is_calculated_price_tax_inclusive: price.is_calculated_price_tax_inclusive,
  calculated_price: {
    price_list_type: price.calculated_price?.price_list_type ?? null,
  },
})

/**
 * Produkt nur mit den Feldern, die die Produktkarte liest: Fotos, „Neu“,
 * Farbpunkte, Preis samt Aktion, Schnellkauf, Wunschliste und Analytics.
 * Die Karte ist eine Client-Komponente, ihre Props landen also im HTML;
 * ein volles Produkt (Beschreibung, alle Varianten mit allen Preisdetails)
 * wiegt dort rund 21 KB, so nur rund 3 KB.
 */
export const toCardProduct = (
  product: HttpTypes.StoreProduct
): HttpTypes.StoreProduct =>
  ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    thumbnail: product.thumbnail,
    created_at: product.created_at,
    images: (product.images ?? [])
      .slice(0, CARD_IMAGES)
      .map(({ id, url }) => ({ id, url })),
    options: (product.options ?? []).map((option) => ({
      id: option.id,
      title: option.title,
      values: (option.values ?? []).map(({ id, value }) => ({ id, value })),
    })),
    variants: (product.variants ?? []).map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      calculated_price: variant.calculated_price
        ? toCardPrice(variant.calculated_price)
        : undefined,
    })),
    categories: (product.categories ?? [])
      .slice(0, 1)
      .map(({ id, name }) => ({ id, name })),
    collection: product.collection
      ? { id: product.collection.id, title: product.collection.title }
      : null,
  } as HttpTypes.StoreProduct)
