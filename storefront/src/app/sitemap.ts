import { MetadataRoute } from "next"
import { getBaseURL } from "@lib/util/env"
import { listProducts } from "@lib/data/products"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"

// Single-market for now (Austria). When DACH regions (/de, /ch) go live,
// loop over their country codes here and add hreflang alternates.
const countryCode = process.env.NEXT_PUBLIC_DEFAULT_REGION || "at"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()
  const prefix = `${baseUrl}/${countryCode}`

  const staticPaths = [
    "",
    "/store",
    "/collections",
    "/categories",
    "/about",
    "/contact",
    "/faq",
    "/size-guide",
    "/care",
    "/shipping",
    "/imprint",
    "/terms",
    "/privacy",
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${prefix}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.5,
  }))

  const [productEntries, categoryEntries, collectionEntries] =
    await Promise.all([
      getProductEntries(prefix),
      getCategoryEntries(prefix),
      getCollectionEntries(prefix),
    ])

  return [
    ...staticEntries,
    ...collectionEntries,
    ...categoryEntries,
    ...productEntries,
  ]
}

async function getProductEntries(
  prefix: string
): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  try {
    let page: number | null = 1
    while (page) {
      const { response, nextPage } = await listProducts({
        pageParam: page,
        countryCode,
        queryParams: { limit: 100, fields: "handle,updated_at" },
      })
      for (const product of response.products) {
        if (!product.handle) continue
        entries.push({
          url: `${prefix}/products/${product.handle}`,
          lastModified: product.updated_at ?? undefined,
          changeFrequency: "weekly",
          priority: 0.8,
        })
      }
      page = nextPage
    }
  } catch (error) {
    console.error("sitemap: failed to load products", error)
  }
  return entries
}

async function getCategoryEntries(
  prefix: string
): Promise<MetadataRoute.Sitemap> {
  try {
    const categories = await listCategories({ fields: "handle,updated_at" })
    return (categories ?? [])
      .filter((c: any) => c?.handle)
      .map((c: any) => ({
        url: `${prefix}/categories/${c.handle}`,
        lastModified: c.updated_at ?? undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  } catch (error) {
    console.error("sitemap: failed to load categories", error)
    return []
  }
}

async function getCollectionEntries(
  prefix: string
): Promise<MetadataRoute.Sitemap> {
  try {
    const { collections } = await listCollections()
    return (collections ?? [])
      .filter((c) => c?.handle)
      .map((c) => ({
        url: `${prefix}/collections/${c.handle}`,
        lastModified: c.updated_at ?? undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  } catch (error) {
    console.error("sitemap: failed to load collections", error)
    return []
  }
}
