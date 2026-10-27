"use server"

import { sdk } from "@lib/config"

/**
 * Saves the answer to "Wie haben Sie von uns erfahren?" on the order
 * (backend POST /store/orders/:id/source). Never throws: the thank-you page
 * must not depend on it.
 */
export async function saveOrderSource(
  orderId: string,
  source: string,
  text?: string
): Promise<boolean> {
  try {
    await sdk.client.fetch(
      `/store/orders/${encodeURIComponent(orderId)}/source`,
      {
        method: "POST",
        body: { source, ...(text ? { text } : {}) },
      }
    )
    return true
  } catch (error) {
    console.error(
      "[order-source] answer not saved:",
      error instanceof Error ? error.message : error
    )
    return false
  }
}
