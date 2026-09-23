"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { getOrSetCart } from "./cart"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"
import { listProducts } from "./products"

export type StoreLook = {
  id: string
  title: string
  handle: string
  description: string | null
  images: string[] | null
  rank: number
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // Veröffentlichte Produkte des Looks in der festgelegten Reihenfolge
  product_ids: string[]
  product_thumbnails: string[]
}

const lookCacheOptions = async () => ({
  ...(await getCacheOptions("looks")),
  revalidate: 60,
})

export const listLooks = async (): Promise<StoreLook[]> => {
  return sdk.client
    .fetch<{ looks: StoreLook[] }>("/store/looks", {
      method: "GET",
      query: { limit: 100 },
      next: await lookCacheOptions(),
    })
    .then(({ looks }) => looks)
    .catch((error) => {
      console.error("looks: failed to load looks", error)
      return []
    })
}

export const getLookByHandle = async (
  handle: string
): Promise<StoreLook | null> => {
  return sdk.client
    .fetch<{ look: StoreLook }>(`/store/looks/${encodeURIComponent(handle)}`, {
      method: "GET",
      next: await lookCacheOptions(),
    })
    .then(({ look }) => look)
    .catch(() => null)
}

/**
 * Look inkl. Produkte. Die Produkte kommen über /store/products, damit
 * Preise, Steuern und Lagerbestand genau wie auf der Produktseite sind.
 */
export const getLookWithProducts = async (
  handle: string,
  countryCode: string
): Promise<{ look: StoreLook; products: HttpTypes.StoreProduct[] } | null> => {
  const look = await getLookByHandle(handle)

  if (!look) {
    return null
  }

  if (!look.product_ids.length) {
    return { look, products: [] }
  }

  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: {
      id: look.product_ids,
      limit: look.product_ids.length,
    },
  })

  const byId = new Map(products.map((p) => [p.id, p]))
  const ordered = look.product_ids
    .map((id) => byId.get(id))
    .filter((p): p is HttpTypes.StoreProduct => !!p)

  return { look, products: ordered }
}

export async function addLookToCart({
  lookId,
  items,
  countryCode,
}: {
  lookId: string
  items: { variantId: string; quantity: number }[]
  countryCode: string
}) {
  if (!items.length) {
    throw new Error("Keine Artikel ausgewählt")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.client
    .fetch(`/store/carts/${cart.id}/looks`, {
      method: "POST",
      headers,
      body: {
        look_id: lookId,
        items: items.map((i) => ({
          variant_id: i.variantId,
          quantity: i.quantity,
        })),
      },
    })
    .then(async () => {
      const cartCacheTag = await getCacheTag("cart")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}
