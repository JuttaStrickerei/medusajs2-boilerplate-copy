import { MeiliSearch } from 'meilisearch'

// Singleton Client
let client: MeiliSearch | null = null

function getMeiliSearchClient(): MeiliSearch | null {
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

// TypeScript Interface für MeiliSearch Produkte
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
 * Prüft ob MeiliSearch konfiguriert ist
 */
export function isMeiliSearchConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SEARCH_ENDPOINT &&
    process.env.NEXT_PUBLIC_SEARCH_API_KEY
  )
}

