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
      // + Variantenbilder, damit die Vorschau die Bilder der gewählten Farbe zeigt
      fields:
        "*variants.calculated_price,+variants.inventory_quantity,+variants.thumbnail,*variants.images,+metadata,+tags,+images",
    },
  })

  const byId = new Map(products.map((p) => [p.id, p]))
  const ordered = look.product_ids
    .map((id) => byId.get(id))
    .filter((p): p is HttpTypes.StoreProduct => !!p)

  return { look, products: ordered }
}

// Nur was Übersicht und Preissumme brauchen (~300 KB statt ~1 MB für 42
// Produkte, bleibt so unter dem 2-MB-Limit des Next-Caches). Nicht weiter auf
// calculated_amount kürzen: dann fehlen Währung und Originalpreis.
const OVERVIEW_PRODUCT_FIELDS =
  "id,title,handle,thumbnail,variants.id,*variants.calculated_price,options.title,options.values.value"
// Über dieser Menge in parallele Teilabfragen aufteilen
const OVERVIEW_BATCH_SIZE = 100
const OVERVIEW_SINGLE_REQUEST_MAX = 200

const fetchOverviewProducts = async (
  ids: string[],
  countryCode: string
): Promise<HttpTypes.StoreProduct[]> => {
  const batches =
    ids.length > OVERVIEW_SINGLE_REQUEST_MAX
      ? Array.from(
          { length: Math.ceil(ids.length / OVERVIEW_BATCH_SIZE) },
          (_, i) =>
            ids.slice(i * OVERVIEW_BATCH_SIZE, (i + 1) * OVERVIEW_BATCH_SIZE)
        )
      : [ids]

  const results = await Promise.all(
    batches.map((batch) =>
      listProducts({
        countryCode,
        // limit = Anzahl: der Standard (12) schnitte still Produkte ab
        queryParams: {
          id: batch,
          limit: batch.length,
          fields: OVERVIEW_PRODUCT_FIELDS,
        },
      })
    )
  )

  return results.flatMap(({ response }) => response.products)
}

/**
 * Alle Looks plus ihre Produkte in einer Abfrage (für Teile und Summen der
 * Übersicht). products = null, wenn die Produktabfrage scheitert: Die Seite
 * zeigt dann Looks ohne Preise statt eines Fehlers.
 */
export const listLooksForOverview = async (
  countryCode: string
): Promise<{
  looks: StoreLook[]
  products: HttpTypes.StoreProduct[] | null
}> => {
  const looks = await listLooks()
  const ids = Array.from(new Set(looks.flatMap((l) => l.product_ids)))

  if (!ids.length) {
    return { looks, products: [] }
  }

  try {
    return { looks, products: await fetchOverviewProducts(ids, countryCode) }
  } catch (error) {
    console.error("looks: failed to load overview prices", error)
    return { looks, products: null }
  }
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
