"use server"

import { sdk } from "@lib/config"
import { consentCategoriesFrom } from "@lib/util/consent"
import { getBaseURL } from "@lib/util/env"
import { MARKETING_CATEGORY } from "@lib/util/meta-pixel"
import { cookies as nextCookies, headers as nextHeaders } from "next/headers"
import { getAuthHeaders, getCartId } from "./cookies"

// Read by the backend's meta-capi subscriber (cart.metadata → order.metadata)
const ATTRIBUTION_KEY = "meta_capi"

// Checkout page URL without query (no cart or step in what Meta gets)
function pageUrl(referer: string | null): string {
  try {
    const url = new URL(referer ?? "")
    return `${url.origin}${url.pathname}`
  } catch {
    return `${getBaseURL()}/at/checkout`
  }
}

/**
 * Called right before the payment is confirmed. With "marketing" consent it
 * stores what only the browser knows (_fbp/_fbc, IP, browser) on the cart,
 * so the backend can report the purchase to Meta even if the shopper never
 * returns from Klarna or PayPal. Without consent it deletes an earlier entry
 * (consent withdrawn in between). Never throws: payment must not depend on it.
 * Goes straight to the SDK instead of updateCart(): no cache revalidation,
 * so the checkout does not re-render while Stripe is confirming.
 */
export async function saveMetaAttribution(): Promise<void> {
  try {
    const cartId = await getCartId()
    if (!cartId) return

    const cookies = await nextCookies()
    const consented = consentCategoriesFrom(
      cookies.get("cc_cookie")?.value
    ).includes(MARKETING_CATEGORY)

    let attribution: Record<string, unknown> | "" = ""
    if (consented) {
      const headers = await nextHeaders()
      attribution = {
        consent: true,
        fbp: cookies.get("_fbp")?.value,
        fbc: cookies.get("_fbc")?.value,
        client_ip_address:
          headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          headers.get("x-real-ip") ||
          undefined,
        client_user_agent: headers.get("user-agent") ?? undefined,
        event_source_url: pageUrl(headers.get("referer")),
      }
    }

    await sdk.store.cart.update(
      cartId,
      { metadata: { [ATTRIBUTION_KEY]: attribution } },
      {},
      await getAuthHeaders()
    )
  } catch (error) {
    console.error(
      "[meta] attribution not saved:",
      error instanceof Error ? error.message : error
    )
  }
}
