"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { SHIPPING_FLAT_EUR } from "@lib/util/shop-facts"

export const listCartShippingMethods = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null
    })
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  const body = { cart_id: cartId, data }

  if (data) {
    body.data = data
  }

  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        body,
        headers,
        next,
      }
    )
    .then(({ shipping_option }) => shipping_option)
    .catch((e) => {
      return null
    })
}

export type ShippingPreview = {
  /** Versandkosten für die Lieferung nach Hause */
  amount: number
  /** true, wenn es eine kostenlose Versandart gibt (Abholung im Geschäft) */
  hasFreePickup: boolean
}

/**
 * Versandkosten für Warenkorb und Kasse, solange noch keine Versandart gewählt ist.
 * So steht der Betrag von Anfang an da und kommt nicht erst im zweiten Kassenschritt
 * dazu. Nimmt die günstigste kostenpflichtige Versandart des Warenkorbs und fällt
 * sonst auf die Pauschale zurück.
 */
export const getShippingPreview = async (cartId: string): Promise<ShippingPreview> => {
  const options = await listCartShippingMethods(cartId)
  const amounts = (options ?? [])
    .filter((o) => o.price_type === "flat" && typeof o.amount === "number")
    .map((o) => o.amount as number)
  const paid = amounts.filter((a) => a > 0)

  return {
    amount: paid.length ? Math.min(...paid) : SHIPPING_FLAT_EUR,
    hasFreePickup: amounts.some((a) => a === 0),
  }
}
