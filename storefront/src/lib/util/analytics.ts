import { HttpTypes } from "@medusajs/types"
import { hasConsentFor } from "./consent"
import { getProductPrice } from "./get-product-price"
import { loadGoogleAnalytics } from "./google-analytics"
import { trackMetaEvent } from "./meta-pixel"

/**
 * GA4 e-commerce helpers. The `gtag` queue is defined inline in
 * app/layout.tsx, gtag.js itself only loads after the visitor accepted the
 * "analytics" category in the cookie banner (google-analytics.ts): Consent
 * Mode alone would still send cookieless pings (incl. order ids and values)
 * before consent, which the privacy page rules out.
 * trackEvent also hands the shop events to the Meta Pixel (meta-pixel.ts),
 * which checks its own "marketing" consent.
 * Amounts in Medusa v2 are already in currency units (110 = € 110,00).
 */

export const BRAND = "Strickerei Jutta"

export type GaItem = {
  // Variant SKU, else variant id (= "id" in a product feed)
  item_id: string
  // Product id (= "item_group_id" in a product feed). Only for the Meta Pixel,
  // trackEvent strips it before the GA4 call
  item_group_id?: string
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

export function trackEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return
  }
  // The Meta Pixel has its own consent category ("marketing")
  trackMetaEvent(name, params)
  if (typeof gtag !== "function" || !hasConsentFor("analytics")) {
    return
  }
  // Shop events can fire before the banner script has run (saved consent)
  loadGoogleAnalytics()
  gtag("event", name, withoutGroupIds(params))
}

// GA4 gets the same items as before, without the Meta-only item_group_id
function withoutGroupIds(params: Record<string, unknown>) {
  if (!Array.isArray(params.items)) return params
  return {
    ...params,
    items: (params.items as GaItem[]).map(
      ({ item_group_id: _groupId, ...item }) => item
    ),
  }
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
    item_group_id: product.id,
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
    ...(item.product_id ? { item_group_id: item.product_id } : {}),
    item_name: item.product_title || item.title,
    item_brand: BRAND,
    ...(item.variant_title ? { item_variant: item.variant_title } : {}),
    price: item.unit_price,
    quantity: item.quantity,
  }
}
