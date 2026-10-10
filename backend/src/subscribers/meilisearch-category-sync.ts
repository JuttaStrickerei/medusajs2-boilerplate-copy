import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { IProductModuleService, Logger } from '@medusajs/framework/types';
import { Modules, ProductCategoryWorkflowEvents } from '@medusajs/framework/utils';
import { MeiliSearchService } from '@rokmohar/medusa-plugin-meilisearch';

/**
 * Category event names as emitted by Medusa's category workflows
 * ('product-category.created' etc., one event per category with payload { id })
 */
const CATEGORY_EVENTS = {
  CREATED: ProductCategoryWorkflowEvents.CREATED,
  UPDATED: ProductCategoryWorkflowEvents.UPDATED,
  DELETED: ProductCategoryWorkflowEvents.DELETED,
} as const;

/**
 * Transform category data for MeiliSearch indexing
 */
function transformCategoryToDocument(category: any) {
  return {
    id: category.id,
    name: category.name,
    description: category.description || null,
    handle: category.handle,
    metadata: category.metadata || {},
    parent_category_id: category.parent_category_id || null,
    rank: category.rank || 0,
  };
}

/**
 * Handle category upsert (created/updated)
 */
async function handleCategoryUpsert(
  categoryId: string,
  container: SubscriberArgs<{ id: string }>['container'],
  eventName: string
) {
  const logger = container.resolve('logger') as Logger;

  logger.info(`[CategorySync] Processing ${eventName} for category: ${categoryId}`);

  try {
    const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);

    // Check if MeiliSearch service is available
    let meiliSearchService: MeiliSearchService;
    try {
      meiliSearchService = container.resolve('meilisearch');
    } catch {
      logger.debug(`[CategorySync] MeiliSearch service not available, skipping indexing`);
      return;
    }

    // Retrieve category with all necessary fields
    const category = await productModuleService.retrieveProductCategory(categoryId, {
      relations: ['parent_category'],
    });

    if (!category) {
      logger.warn(`[CategorySync] Category not found: ${categoryId}`);
      return;
    }

    // The Store API hides inactive and internal categories, so a search hit
    // for them would link to a 404: keep them out of the public index.
    if (!category.is_active || category.is_internal) {
      await meiliSearchService.deleteDocument('categories', categoryId);
      logger.info(`[CategorySync] Category ${categoryId} is inactive or internal, removed from index`);
      return;
    }

    // Transform and index the category
    const searchDocument = transformCategoryToDocument(category);

    await meiliSearchService.addDocuments('categories', [searchDocument], 'categories');

    logger.info(`[CategorySync] Successfully indexed category: ${categoryId}`);
  } catch (error) {
    logger.error(`[CategorySync] Failed to process category ${categoryId}:`, error);
    // Don't throw - subscribers should never throw errors
  }
}

/**
 * Handle category deletion
 */
async function handleCategoryDelete(
  categoryId: string,
  container: SubscriberArgs<{ id: string }>['container'],
  eventName: string
) {
  const logger = container.resolve('logger') as Logger;

  logger.info(`[CategorySync] Processing ${eventName} for category: ${categoryId}`);

  try {
    // Check if MeiliSearch service is available
    let meiliSearchService: MeiliSearchService;
    try {
      meiliSearchService = container.resolve('meilisearch');
    } catch {
      logger.debug(`[CategorySync] MeiliSearch service not available, skipping deletion`);
      return;
    }

    // Delete document from MeiliSearch index
    await meiliSearchService.deleteDocument('categories', categoryId);

    logger.info(`[CategorySync] Successfully removed category from index: ${categoryId}`);
  } catch (error) {
    logger.error(`[CategorySync] Failed to remove category ${categoryId} from index:`, error);
    // Don't throw - subscribers should never throw errors
  }
}

/**
 * Main category sync handler
 */
export default async function meilisearchCategorySyncHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const { name, data } = event;
  const categoryId = data.id;

  switch (name) {
    case CATEGORY_EVENTS.CREATED:
    case CATEGORY_EVENTS.UPDATED:
      await handleCategoryUpsert(categoryId, container, name);
      break;
    case CATEGORY_EVENTS.DELETED:
      await handleCategoryDelete(categoryId, container, name);
      break;
    default:
      // Unknown event type - ignore
      break;
  }
}

export const config: SubscriberConfig = {
  event: [
    CATEGORY_EVENTS.CREATED,
    CATEGORY_EVENTS.UPDATED,
    CATEGORY_EVENTS.DELETED,
  ],
};
