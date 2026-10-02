import { HttpTypes } from "@medusajs/types"
import { getPricesForVariant, getProductPrice } from "./get-product-price"

// Preise der Varianten unterscheiden sich (Anzeige mit „ab“)
export const hasPriceRange = (product: HttpTypes.StoreProduct): boolean =>
  new Set(
    (product.variants ?? []).map(
      (v: any) =>
        v.calculated_price?.calculated_amount_with_tax ??
        v.calculated_price?.calculated_amount
    )
  ).size > 1

export type LookPriceSum = {
  amount: number
  original: number
  currency: string
  // mindestens ein Teil ohne gewählte Variante hat eine Preisspanne
  from: boolean
  onSale: boolean
}

/**
 * Summe eines Looks: je Teil der Preis der gewählten Variante, sonst der
 * günstigste Preis. Funktioniert auf dem Server (Kopfzeile) und im Client
 * (Live-Summe).
 */
export const sumLookPrices = (
  products: HttpTypes.StoreProduct[],
  selectedVariant?: (
    product: HttpTypes.StoreProduct
  ) => HttpTypes.StoreProductVariant | undefined
): LookPriceSum | null => {
  let amount = 0
  let original = 0
  let currency: string | undefined
  let from = false
  let onSale = false

  for (const product of products) {
    const variant = selectedVariant?.(product)
    const price = variant
      ? getPricesForVariant(variant)
      : getProductPrice({ product }).cheapestPrice
    if (!price) continue

    amount += price.calculated_price_number
    original += price.original_price_number ?? price.calculated_price_number
    currency = price.currency_code
    if (price.price_type === "sale") onSale = true
    if (!variant && hasPriceRange(product)) from = true
  }

  return currency ? { amount, original, currency, from, onSale } : null
}
