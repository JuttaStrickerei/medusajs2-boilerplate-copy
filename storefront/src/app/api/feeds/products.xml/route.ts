import { HttpTypes } from "@medusajs/types"
import { PRODUCT_LIST_FIELDS } from "@lib/constants/product-fields"
import { listProducts } from "@lib/data/products"
import { getBaseURL } from "@lib/util/env"
import { feedXml, productToFeedItems } from "@lib/util/product-feed"

/**
 * Product feed for the Meta catalog (Commerce Manager) and Google Merchant
 * Center: https://shop.strickerei-jutta.at/api/feeds/products.xml
 * Both fetch it on a schedule; robots.ts allows /api/feeds/.
 * ?collection=herbst_winter_2026 limits it to collections (handles,
 * comma-separated), e.g. to advertise only the current season.
 */

const COUNTRY_CODE = process.env.NEXT_PUBLIC_DEFAULT_REGION || "at"
// Each page stays under the 2 MB limit of the Next.js data cache
const PAGE_SIZE = 40
const CACHE_SECONDS = 3600
const FEED_FIELDS = [
  PRODUCT_LIST_FIELDS,
  "+material",
  "+subtitle",
  "*categories",
  "*collection",
  "*options",
  "*variants.options",
  "+variants.thumbnail",
  "*variants.images",
  "+variants.manage_inventory",
  "+variants.allow_backorder",
].join(",")

async function allProducts(): Promise<HttpTypes.StoreProduct[]> {
  const products: HttpTypes.StoreProduct[] = []
  let page: number | null = 1
  while (page) {
    const { response, nextPage } = await listProducts({
      pageParam: page,
      countryCode: COUNTRY_CODE,
      queryParams: { limit: PAGE_SIZE, fields: FEED_FIELDS },
    })
    products.push(...response.products)
    page = nextPage
  }
  return products
}

function collectionFilter(request: Request): string[] {
  return (new URL(request.url).searchParams.get("collection") ?? "")
    .split(",")
    .map((handle) => handle.trim().toLowerCase())
    .filter(Boolean)
}

export async function GET(request: Request) {
  try {
    const baseUrl = getBaseURL()
    const collections = collectionFilter(request)
    const products = (await allProducts()).filter(
      (product) =>
        !collections.length ||
        collections.includes(product.collection?.handle?.toLowerCase() ?? "")
    )
    const items = products.flatMap((product) =>
      productToFeedItems(product, baseUrl, COUNTRY_CODE)
    )
    if (!items.length) throw new Error("no products with price and image")
    return new Response(feedXml(items, baseUrl), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
      },
    })
  } catch (error) {
    console.error(
      "[feed] product feed failed:",
      error instanceof Error ? error.message : error
    )
    // 503 instead of an empty feed: Meta and Google would otherwise
    // delete every product from the catalog
    return new Response("Feed vorübergehend nicht verfügbar", {
      status: 503,
      headers: { "Retry-After": "600" },
    })
  }
}
