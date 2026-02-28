import { MeiliSearch, MultiSearchQuery, MultiSearchResult } from 'meilisearch'

// Singleton Client
let client: MeiliSearch | null = null

export function getMeiliSearchClient(): MeiliSearch | null {
  if (client) return client

  const host = process.env.NEXT_PUBLIC_SEARCH_ENDPOINT
  const apiKey = process.env.NEXT_PUBLIC_SEARCH_API_KEY

  if (!host || !apiKey) {
    console.warn('MeiliSearch not configured')
    return null
  }

  client = new MeiliSearch({ host, apiKey })
  return client
}

// TypeScript Interfaces für MeiliSearch Entities
export interface MeiliSearchProduct {
  id: string
  title: string
  description: string | null
  material: string | null
  subtitle: string | null
  tags: string[]
  thumbnail: string | null
  handle: string
  collection: string | null
  type: string | null
  variant_sku: string[]
}

export interface MeiliSearchCategory {
  id: string
  name: string
  description: string | null
  handle: string
  metadata: Record<string, any> | null
  parent_category_id: string | null
  rank: number
}

export interface MeiliSearchCollection {
  id: string
  title: string
  handle: string
  metadata: Record<string, any> | null
  thumbnail: string | null
  created_at: string
}

/**
 * Combined search result type
 */
export interface MultiSearchResults {
  products: MeiliSearchProduct[]
  categories: MeiliSearchCategory[]
  collections: MeiliSearchCollection[]
}

/**
 * Sucht Produkte in MeiliSearch
 * Gibt Produkt-IDs zurück, sortiert nach Relevanz
 */
export async function searchProductsInMeiliSearch(
  query: string,
  limit: number = 20
): Promise<MeiliSearchProduct[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const meiliClient = getMeiliSearchClient()

  if (!meiliClient) {
    return []
  }

  try {
    const indexName = process.env.NEXT_PUBLIC_INDEX_NAME || 'products'
    const index = meiliClient.index(indexName)

    const results = await index.search<MeiliSearchProduct>(query, {
      limit,
      attributesToRetrieve: [
        'id',
        'title',
        'description',
        'material',
        'subtitle',
        'tags',
        'thumbnail',
        'handle',
        'collection',
        'type',
      ],
    })

    return results.hits
  } catch (error) {
    console.error('MeiliSearch search error:', error)
    return []
  }
}

/**
 * Multi-search across products, categories, and collections
 * Uses MeiliSearch's multiSearch API for efficient querying
 */
export async function searchAllInMeiliSearch(
  query: string,
  limit: number = 10
): Promise<MultiSearchResults> {
  const emptyResults: MultiSearchResults = {
    products: [],
    categories: [],
    collections: [],
  }

  if (!query || query.trim().length < 2) {
    return emptyResults
  }

  const meiliClient = getMeiliSearchClient()

  if (!meiliClient) {
    return emptyResults
  }

  try {
    const queries: MultiSearchQuery[] = [
      {
        indexUid: 'products',
        q: query,
        limit,
        attributesToRetrieve: [
          'id',
          'title',
          'description',
          'material',
          'subtitle',
          'tags',
          'thumbnail',
          'handle',
          'collection',
          'type',
        ],
      },
      {
        indexUid: 'categories',
        q: query,
        limit,
        attributesToRetrieve: [
          'id',
          'name',
          'description',
          'handle',
          'metadata',
          'parent_category_id',
          'rank',
        ],
      },
      {
        indexUid: 'collections',
        q: query,
        limit,
        attributesToRetrieve: [
          'id',
          'title',
          'handle',
          'metadata',
          'thumbnail',
          'created_at',
        ],
      },
    ]

    const multiSearchResults = await meiliClient.multiSearch<{
      products: MeiliSearchProduct
      categories: MeiliSearchCategory
      collections: MeiliSearchCollection
    }>({ queries })

    // Extract results from each index
    const results: MultiSearchResults = {
      products: [],
      categories: [],
      collections: [],
    }

    multiSearchResults.results.forEach((result) => {
      if (result.indexUid === 'products') {
        results.products = result.hits as MeiliSearchProduct[]
      } else if (result.indexUid === 'categories') {
        results.categories = result.hits as MeiliSearchCategory[]
      } else if (result.indexUid === 'collections') {
        results.collections = result.hits as MeiliSearchCollection[]
      }
    })

    return results
  } catch (error) {
    console.error('MeiliSearch multi-search error:', error)
    return emptyResults
  }
}

/**
 * Prüft ob MeiliSearch konfiguriert ist
 */
export function isMeiliSearchConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SEARCH_ENDPOINT &&
    process.env.NEXT_PUBLIC_SEARCH_API_KEY
  )
}

