import { HttpTypes } from "@medusajs/types"

/**
 * Same basis as product cards: tax-inclusive calculated price when available.
 * calculated_amount is in full major currency units (e.g. 154 = €154,00).
 */
export function getVariantPriceForFilter(
  variant: HttpTypes.StoreProductVariant
): number | null {
  const cp = variant.calculated_price
  if (!cp) return null
  const amount = cp.calculated_amount_with_tax ?? cp.calculated_amount
  if (amount === undefined || amount === null) return null
  return amount
}

export function getProductMinVariantPriceForFilter(
  product: HttpTypes.StoreProduct
): number | null {
  const amounts =
    product.variants
      ?.map(getVariantPriceForFilter)
      .filter((a): a is number => a !== null) ?? []
  if (amounts.length === 0) return null
  return Math.min(...amounts)
}
