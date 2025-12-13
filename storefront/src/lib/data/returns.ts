"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "@lib/data/cookies"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"

/**
 * List all available return reasons
 */
export const listReturnReasons = async (): Promise<HttpTypes.StoreReturnReason[]> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("return-reasons")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreReturnReasonListResponse>(`/store/return-reasons`, {
      method: "GET",
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ return_reasons }) => return_reasons)
    .catch((err) => {
      console.error("Error fetching return reasons:", err)
      return []
    })
}

/**
 * List shipping options for returns
 * We need to create a temporary cart to fetch shipping options since the Store API requires cart_id
 * @param regionId - The region ID from the order
 */
export const listReturnShippingOptions = async (
  regionId: string
): Promise<HttpTypes.StoreCartShippingOption[]> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    // Step 1: Create a temporary cart for the region
    const cartResponse = await sdk.client.fetch<{ cart: { id: string } }>(
      `/store/carts`,
      {
        method: "POST",
        body: {
          region_id: regionId,
        },
        headers,
      }
    )

    const tempCartId = cartResponse.cart.id
    console.log("[Returns] Created temporary cart for region:", regionId, "cart:", tempCartId)

    // Step 2: Fetch return shipping options using the temporary cart
    // Include expanded fields to get location data
    const shippingResponse = await sdk.client.fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: tempCartId,
          is_return: true,
          fields: "*service_zone.fulfillment_set.location",
        },
        headers,
      }
    )

    console.log("[Returns] Found shipping options:", shippingResponse.shipping_options?.length || 0)

    return (shippingResponse.shipping_options || []) as HttpTypes.StoreCartShippingOption[]
  } catch (err) {
    console.error("Error fetching return shipping options:", err)
    return []
  }
}

/**
 * Return item selection type
 */
export type ReturnItemSelection = {
  id: string
  quantity: number
  return_reason_id?: string
  note?: string
}

/**
 * Return request state type
 */
export type ReturnRequestState = {
  success: boolean
  error: string | null
  return: HttpTypes.StoreReturn | null
}

/**
 * Create a return request for an order
 * Simple API call - backend handles all the logic via existing workflows
 */
export const createReturnRequest = async (
  state: ReturnRequestState,
  formData: FormData
): Promise<ReturnRequestState> => {
  const orderId = formData.get("order_id") as string
  const itemsJson = formData.get("items") as string
  const returnShippingOptionId = formData.get("return_shipping_option_id") as string
  const locationId = formData.get("location_id") as string | null

  // Basic validation
  if (!orderId || !itemsJson || !returnShippingOptionId) {
    return {
      success: false,
      error: "Bitte füllen Sie alle erforderlichen Felder aus.",
      return: null,
    }
  }

  let items: ReturnItemSelection[]
  try {
    items = JSON.parse(itemsJson)
  } catch {
    return { success: false, error: "Ungültige Artikelauswahl.", return: null }
  }

  if (!items.length) {
    return { success: false, error: "Bitte wählen Sie mindestens einen Artikel.", return: null }
  }

  const headers = await getAuthHeaders()

  // Request body - location_id is required by the internal workflow
  const body: Record<string, any> = {
    order_id: orderId,
    items: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      ...(item.return_reason_id && { reason_id: item.return_reason_id }),
    })),
    return_shipping: {
      option_id: returnShippingOptionId,
    },
  }

  // Add location_id if provided
  if (locationId) {
    body.location_id = locationId
  }

  try {
    const { return: returnData } = await sdk.client.fetch<HttpTypes.StoreReturnResponse>(
      `/store/returns`,
      { method: "POST", body, headers }
    )

    return { success: true, error: null, return: returnData }
  } catch (err: any) {
    console.error("[Returns] API error:", err)
    return {
      success: false,
      error: err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      return: null,
    }
  }
}

/**
 * Get a specific return by ID
 */
export const getReturn = async (returnId: string): Promise<HttpTypes.StoreReturn | null> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    const response = await sdk.client.fetch<HttpTypes.StoreReturnResponse>(
      `/store/returns/${returnId}`,
      {
        method: "GET",
        headers,
      }
    )
    return response.return
  } catch (err) {
    console.error("Error fetching return:", err)
    return null
  }
}

