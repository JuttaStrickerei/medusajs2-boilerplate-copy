"use server"

import { sdk } from "@lib/config"
import {
  clearWishlistMergePending,
  getAuthHeaders,
  getWishlistMergePending,
  type WishlistMergeMode,
} from "./cookies"

type WishlistItemRow = {
  id: string
  customer_id: string
  product_id: string
  variant_id: string | null
  created_at: string
  updated_at: string
}

export type WishlistItem = {
  id: string
  handle: string
  title: string
  thumbnail: string | null
  addedAt: string
}

export type ServerWishlistState = {
  authenticated: boolean
  items: WishlistItem[]
}

// Hydrates bare product_ids from the wishlist table into frontend-ready items
// by asking `/store/products` for the minimum metadata the UI needs.
// Uses only the publishable key (no auth required), so it works for both
// logged-in and guest merge flows.
async function hydrateProductIds(
  ids: string[]
): Promise<
  Map<string, { handle: string; title: string; thumbnail: string | null }>
> {
  const map = new Map<
    string,
    { handle: string; title: string; thumbnail: string | null }
  >()
  if (ids.length === 0) return map

  try {
    const { products } = await sdk.client.fetch<{
      products: Array<{
        id: string
        handle: string
        title: string
        thumbnail: string | null
      }>
    }>("/store/products", {
      method: "GET",
      query: {
        id: ids,
        fields: "id,handle,title,thumbnail",
        limit: ids.length,
      },
    })

    for (const p of products) {
      map.set(p.id, {
        handle: p.handle,
        title: p.title,
        thumbnail: p.thumbnail ?? null,
      })
    }
  } catch {
    // Transient failure — caller's filter drops un-hydratable items.
  }

  return map
}

function mergeRowsWithProducts(
  rows: WishlistItemRow[],
  products: Map<string, { handle: string; title: string; thumbnail: string | null }>
): WishlistItem[] {
  const items: WishlistItem[] = []
  for (const row of rows) {
    const meta = products.get(row.product_id)
    if (!meta) continue // product was deleted or hydration failed — skip
    items.push({
      id: row.product_id,
      handle: meta.handle,
      title: meta.title,
      thumbnail: meta.thumbnail,
      addedAt: row.created_at,
    })
  }
  return items
}

export async function getServerWishlist(): Promise<ServerWishlistState> {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return { authenticated: false, items: [] }
  }

  let rows: WishlistItemRow[]
  try {
    const { wishlist_items } = await sdk.client.fetch<{
      wishlist_items: WishlistItemRow[]
    }>("/store/wishlist", {
      method: "GET",
      headers,
    })
    rows = wishlist_items
  } catch {
    return { authenticated: true, items: [] }
  }

  const ids = rows.map((r) => r.product_id)
  const products = await hydrateProductIds(ids)
  return { authenticated: true, items: mergeRowsWithProducts(rows, products) }
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

export async function readWishlistMergePending(): Promise<WishlistMergeMode | null> {
  return getWishlistMergePending()
}

export async function dismissWishlistMergePending(): Promise<void> {
  await clearWishlistMergePending()
}

export async function mergeServerWishlistItems(
  items: Array<{ product_id: string; variant_id?: string }>
): Promise<WishlistItem[] | null> {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return null
  }

  if (items.length === 0) {
    return []
  }

  let rows: WishlistItemRow[]
  try {
    const { wishlist_items } = await sdk.client.fetch<{
      wishlist_items: WishlistItemRow[]
    }>("/store/wishlist/merge", {
      method: "POST",
      headers,
      body: { items },
    })
    rows = wishlist_items
  } catch {
    return null
  }

  const ids = rows.map((r) => r.product_id)
  const products = await hydrateProductIds(ids)
  return mergeRowsWithProducts(rows, products)
}
