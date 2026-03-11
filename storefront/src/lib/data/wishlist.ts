"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

type WishlistItemResponse = {
  id: string
  customer_id: string
  product_id: string
  variant_id: string | null
  created_at: string
  updated_at: string
}

// FIX: Server-side wishlist persistence for logged-in users.
// These server actions call the custom /store/wishlist API routes.

export async function getServerWishlist(): Promise<WishlistItemResponse[]> {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return []
  }

  try {
    const { wishlist_items } = await sdk.client.fetch<{
      wishlist_items: WishlistItemResponse[]
    }>("/store/wishlist", {
      method: "GET",
      headers,
    })

    return wishlist_items
  } catch {
    return []
  }
}

export async function addServerWishlistItem(
  productId: string,
  variantId?: string
): Promise<boolean> {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return false
  }

  try {
    await sdk.client.fetch("/store/wishlist", {
      method: "POST",
      headers,
      body: {
        product_id: productId,
        ...(variantId ? { variant_id: variantId } : {}),
      },
    })
    return true
  } catch {
    return false
  }
}

export async function removeServerWishlistItem(
  productId: string
): Promise<boolean> {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return false
  }

  try {
    await sdk.client.fetch("/store/wishlist", {
      method: "DELETE",
      headers,
      body: {
        product_id: productId,
      },
    })
    return true
  } catch {
    return false
  }
}
