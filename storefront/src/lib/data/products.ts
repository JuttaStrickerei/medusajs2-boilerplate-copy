"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import {
  searchProductsInMeiliSearch,
  searchAllInMeiliSearch,
  isMeiliSearchConfigured,
  MultiSearchResults,
} from "@lib/search/meilisearch-client"

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
    revalidate: 60,
  }

  // Get country code for tax calculation - use region's first country if countryCode not provided
  const taxCountryCode = countryCode || region?.countries?.[0]?.iso_2

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          // Include country_code for tax calculation
          ...(taxCountryCode && { country_code: taxCountryCode }),
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,+images",
          ...queryParams,
        },
        headers,
        next,
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}

/**
 * Search products by query string
 * Uses MeiliSearch if configured, falls back to Backend API
 */
export const searchProducts = async (
  query: string,
  countryCode: string
): Promise<HttpTypes.StoreProduct[]> => {
  if (!query || query.trim().length < 2) {
    return []
  }

  const region = await getRegion(countryCode)
  if (!region) {
    return []
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const taxCountryCode = countryCode || region?.countries?.[0]?.iso_2

  // Prüfe ob MeiliSearch verfügbar ist
  if (isMeiliSearchConfigured()) {
    try {
      // 1. MeiliSearch für schnelle Suche (findet Material, Tags, etc.)
      const meiliResults = await searchProductsInMeiliSearch(query, 20)

      if (meiliResults.length === 0) {
        return []
      }

      // 2. Produkt-IDs extrahieren
      const productIds = meiliResults.map((hit) => hit.id)

      // 3. Vollständige Produktdaten vom Backend laden
      const { products } = await sdk.client.fetch<{
        products: HttpTypes.StoreProduct[]
        count: number
      }>(`/store/products`, {
        method: "GET",
        query: {
          id: productIds,
          limit: 20,
          region_id: region.id,
          ...(taxCountryCode && { country_code: taxCountryCode }),
          fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags",
        },
        headers,
        cache: "no-store",
      })

      // 4. Reihenfolge von MeiliSearch beibehalten (Relevanz-Sortierung)
      const productMap = new Map(products.map((p) => [p.id, p]))
      return productIds
        .map((id) => productMap.get(id))
        .filter((p): p is HttpTypes.StoreProduct => p !== undefined)

    } catch (error) {
      console.error('MeiliSearch search failed, falling back to API:', error)
      // Fallback zur Backend-API bei Fehler
    }
  }

  // Fallback: Backend-API (alte Methode)
  try {
    const { products } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: {
        q: query,
        limit: 20,
        region_id: region.id,
        ...(taxCountryCode && { country_code: taxCountryCode }),
        fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags",
      },
      headers,
      cache: "no-store",
    })

    return products
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

/**
 * Search across products, categories, and collections using MeiliSearch multi-search
 * Returns grouped results for display in search UI
 */
export const searchAllEntities = async (
  query: string,
  countryCode: string
): Promise<{
  products: HttpTypes.StoreProduct[]
  categories: MultiSearchResults['categories']
  collections: MultiSearchResults['collections']
}> => {
  const emptyResults = {
    products: [] as HttpTypes.StoreProduct[],
    categories: [] as MultiSearchResults['categories'],
    collections: [] as MultiSearchResults['collections'],
  }

  if (!query || query.trim().length < 2) {
    return emptyResults
  }

  const region = await getRegion(countryCode)
  if (!region) {
    return emptyResults
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const taxCountryCode = countryCode || region?.countries?.[0]?.iso_2

  // Check if MeiliSearch is configured
  if (isMeiliSearchConfigured()) {
    try {
      // 1. Multi-search in MeiliSearch (products, categories, collections)
      const meiliResults = await searchAllInMeiliSearch(query, 10)

      // 2. If we have products, fetch full product data from backend
      let fullProducts: HttpTypes.StoreProduct[] = []
      if (meiliResults.products.length > 0) {
        const productIds = meiliResults.products.map((hit) => hit.id)

        const { products } = await sdk.client.fetch<{
          products: HttpTypes.StoreProduct[]
          count: number
        }>(`/store/products`, {
          method: "GET",
          query: {
            id: productIds,
            limit: 10,
            region_id: region.id,
            ...(taxCountryCode && { country_code: taxCountryCode }),
            fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,+images",
          },
          headers,
          cache: "no-store",
        })

        // Maintain order from MeiliSearch (relevance-based)
        const productMap = new Map(products.map((p) => [p.id, p]))
        fullProducts = productIds
          .map((id) => productMap.get(id))
          .filter((p): p is HttpTypes.StoreProduct => p !== undefined)
      }

      return {
        products: fullProducts,
        categories: meiliResults.categories,
        collections: meiliResults.collections,
      }
    } catch (error) {
      console.error('MeiliSearch multi-search failed, falling back to API:', error)
    }
  }

  // Fallback: Only search products via Backend API
  try {
    const { products } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: {
        q: query,
        limit: 10,
        region_id: region.id,
        ...(taxCountryCode && { country_code: taxCountryCode }),
        fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,+images",
      },
      headers,
      cache: "no-store",
    })

    return {
      products,
      categories: [],
      collections: [],
    }
  } catch (error) {
    console.error("Search error:", error)
    return emptyResults
  }
}
