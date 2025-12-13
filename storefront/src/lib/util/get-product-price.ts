import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-percentage-diff"
import { convertToLocale } from "./money"

export const getPricesForVariant = (variant: any) => {
  if (!variant?.calculated_price?.calculated_amount) {
    return null
  }

  const calculatedPrice = variant.calculated_price
  
  // Use tax-inclusive price if available, otherwise fall back to base amount
  // For B2C (Austrian shop), always display prices including VAT
  const priceWithTax = calculatedPrice.calculated_amount_with_tax ?? calculatedPrice.calculated_amount
  const originalPriceWithTax = calculatedPrice.original_amount_with_tax ?? calculatedPrice.original_amount

  return {
    // Use tax-inclusive prices for display
    calculated_price_number: priceWithTax,
    calculated_price: convertToLocale({
      amount: priceWithTax,
      currency_code: calculatedPrice.currency_code,
    }),
    original_price_number: originalPriceWithTax,
    original_price: convertToLocale({
      amount: originalPriceWithTax,
      currency_code: calculatedPrice.currency_code,
    }),
    currency_code: calculatedPrice.currency_code,
    price_type: calculatedPrice.calculated_price?.price_list_type,
    percentage_diff: getPercentageDiff(
      originalPriceWithTax,
      priceWithTax
    ),
    // Keep raw values for calculations if needed
    price_without_tax: calculatedPrice.calculated_amount,
    original_price_without_tax: calculatedPrice.original_amount,
    is_tax_inclusive: calculatedPrice.is_calculated_price_tax_inclusive ?? false,
  }
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const cheapestVariant: any = product.variants
      .filter((v: any) => !!v.calculated_price)
      .sort((a: any, b: any) => {
        // Sort by tax-inclusive price if available, otherwise use base amount
        const priceA = a.calculated_price.calculated_amount_with_tax ?? a.calculated_price.calculated_amount
        const priceB = b.calculated_price.calculated_amount_with_tax ?? b.calculated_price.calculated_amount
        return priceA - priceB
      })[0]

    return getPricesForVariant(cheapestVariant)
  }

  const variantPrice = () => {
    if (!product || !variantId) {
      return null
    }

    const variant: any = product.variants?.find(
      (v) => v.id === variantId || v.sku === variantId
    )

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}
