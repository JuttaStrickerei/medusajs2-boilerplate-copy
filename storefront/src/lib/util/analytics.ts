import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "./get-product-price"

/**
 * GA4 e-commerce helpers. `gtag` is defined inline in app/layout.tsx.
 * Events are only sent after the visitor accepted the "analytics" category
 * in the cookie banner: Consent Mode alone would still send cookieless
 * pings (incl. order ids and values) before consent, which the privacy
 * page rules out.
 * Amounts in Medusa v2 are already in currency units (110 = € 110,00).
 */

export const BRAND = "Strickerei Jutta"

export type GaItem = {
  item_id: string
  item_name: string
  item_brand: string
  item_variant?: string
  item_category?: string
  item_category2?: string
  price?: number
  quantity?: number
  // 1-based position in a list (e.g. the looks overview)
  index?: number
}

// vanilla-cookieconsent v3 keeps its state as URI-encoded JSON in the
// "cc_cookie" cookie ({ categories: ["necessary", "analytics"], ... })
function hasAnalyticsConsent(): boolean {
  try {
    const match = document.cookie.match(/(?:^|;)\s*cc_cookie=([^;]+)/)
    if (!match) return false
    const state = JSON.parse(decodeURIComponent(match[1]))
    return (
      Array.isArray(state?.categories) && state.categories.includes("analytics")
    )
  } catch {
    return false
  }
}

export function trackEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof gtag !== "function") {
    return
  }
  if (!hasAnalyticsConsent()) {
    return
  }
  gtag("event", name, params)
}

export function gaCurrency(code?: string | null): string {
  return (code || "eur").toUpperCase()
}

/** Item from a store product (+ optional selected variant). */
export function productToItem(
  product: HttpTypes.StoreProduct,
  variant?: HttpTypes.StoreProductVariant | null,
  quantity = 1
): GaItem {
  let price: number | undefined
  try {
    const { cheapestPrice, variantPrice } = getProductPrice({
      product,
      variantId: variant?.id,
    })
    price = (variantPrice ?? cheapestPrice)?.calculated_price_number
  } catch {
    price = undefined
  }

  return {
    item_id: variant?.sku || variant?.id || product.id,
    item_name: product.title,
    item_brand: BRAND,
    ...(variant?.title ? { item_variant: variant.title } : {}),
    ...(product.categories?.[0]?.name
      ? { item_category: product.categories[0].name }
      : product.collection?.title
      ? { item_category: product.collection.title }
      : {}),
    ...(typeof price === "number" ? { price } : {}),
    quantity,
  }
}

type LineItemLike = {
  title: string
  product_title?: string | null
  variant_title?: string | null
  variant_sku?: string | null
  variant_id?: string | null
  product_id?: string | null
  unit_price: number
  quantity: number
}

/** Item from a cart or order line item. */
export function lineItemToItem(item: LineItemLike): GaItem {
  return {
    item_id:
      item.variant_sku || item.variant_id || item.product_id || item.title,
    item_name: item.product_title || item.title,
    item_brand: BRAND,
    ...(item.variant_title ? { item_variant: item.variant_title } : {}),
    price: item.unit_price,
    quantity: item.quantity,
  }
}
