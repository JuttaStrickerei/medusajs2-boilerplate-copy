import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { IProductModuleService, Logger } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import { MeiliSearchService } from '@rokmohar/medusa-plugin-meilisearch';

/**
 * Collection event names (using string literals since no exported constants exist)
 */
const COLLECTION_EVENTS = {
  CREATED: 'product_collection.created',
  UPDATED: 'product_collection.updated',
  DELETED: 'product_collection.deleted',
} as const;

/**
 * Transform collection data for MeiliSearch indexing
 */
function transformCollectionToDocument(collection: any) {
  return {
    id: collection.id,
    title: collection.title,
    handle: collection.handle,
    metadata: collection.metadata || {},
    thumbnail: collection.thumbnail || null,
    created_at: collection.created_at || new Date().toISOString(),
  };
}

/**
 * Handle collection upsert (created/updated)
 */
async function handleCollectionUpsert(
  collectionId: string,
  container: SubscriberArgs<{ id: string }>['container'],
  eventName: string
) {
  const logger = container.resolve('logger') as Logger;

  logger.info(`[CollectionSync] Processing ${eventName} for collection: ${collectionId}`);

  try {
    const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);

    // Check if MeiliSearch service is available
    let meiliSearchService: MeiliSearchService;
    try {
      meiliSearchService = container.resolve('meilisearch');
    } catch {
      logger.debug(`[CollectionSync] MeiliSearch service not available, skipping indexing`);
      return;
    }

    // Retrieve collection with all necessary fields
    const collection = await productModuleService.retrieveProductCollection(collectionId);

    if (!collection) {
      logger.warn(`[CollectionSync] Collection not found: ${collectionId}`);
      return;
    }

    // Transform and index the collection
    const searchDocument = transformCollectionToDocument(collection);

    await meiliSearchService.addDocuments('collections', [searchDocument], 'collections');

    logger.info(`[CollectionSync] Successfully indexed collection: ${collectionId}`);
  } catch (error) {
    logger.error(`[CollectionSync] Failed to process collection ${collectionId}:`, error);
    // Don't throw - subscribers should never throw errors
  }
}

/**
 * Handle collection deletion
 */
async function handleCollectionDelete(
  collectionId: string,
  container: SubscriberArgs<{ id: string }>['container'],
  eventName: string
) {
  const logger = container.resolve('logger') as Logger;

  logger.info(`[CollectionSync] Processing ${eventName} for collection: ${collectionId}`);

  try {
    // Check if MeiliSearch service is available
    let meiliSearchService: MeiliSearchService;
    try {
      meiliSearchService = container.resolve('meilisearch');
    } catch {
      logger.debug(`[CollectionSync] MeiliSearch service not available, skipping deletion`);
      return;
    }

    // Delete document from MeiliSearch index
    await meiliSearchService.deleteDocument('collections', collectionId);

    logger.info(`[CollectionSync] Successfully removed collection from index: ${collectionId}`);
  } catch (error) {
    logger.error(`[CollectionSync] Failed to remove collection ${collectionId} from index:`, error);
    // Don't throw - subscribers should never throw errors
  }
}

/**
 * Main collection sync handler
 */
export default async function meilisearchCollectionSyncHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const { name, data } = event;
  const collectionId = data.id;

  switch (name) {
    case COLLECTION_EVENTS.CREATED:
    case COLLECTION_EVENTS.UPDATED:
      await handleCollectionUpsert(collectionId, container, name);
      break;
    case COLLECTION_EVENTS.DELETED:
      await handleCollectionDelete(collectionId, container, name);
      break;
    default:
      // Unknown event type - ignore
      break;
  }
}

export const config: SubscriberConfig = {
  event: [
    COLLECTION_EVENTS.CREATED,
    COLLECTION_EVENTS.UPDATED,
    COLLECTION_EVENTS.DELETED,
  ],
};
