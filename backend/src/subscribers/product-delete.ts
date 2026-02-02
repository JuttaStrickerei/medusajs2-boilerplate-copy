import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { Logger } from '@medusajs/framework/types';
import { ProductEvents } from '@medusajs/framework/utils';
import { MeiliSearchService } from '@rokmohar/medusa-plugin-meilisearch';

export default async function productDeleteHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const productId = data.id;
  const logger = container.resolve("logger") as Logger;

  logger.info(`[ProductDelete] Processing product deletion: ${productId}`);

  try {
    // Check if MeiliSearch service is available
    let meiliSearchService: MeiliSearchService;
    try {
      meiliSearchService = container.resolve('meilisearch');
    } catch {
      logger.debug(`[ProductDelete] MeiliSearch service not available, skipping deletion`);
      return;
    }

    // Dokument aus MeiliSearch-Index löschen
    await meiliSearchService.deleteDocument('products', productId);
    
    logger.info(`[ProductDelete] Successfully removed product from index: ${productId}`);
  } catch (error) {
    logger.error(`[ProductDelete] Failed to remove product ${productId} from index:`, error);
    // Don't throw - subscribers should never throw errors
  }
}

export const config: SubscriberConfig = {
  event: ProductEvents.PRODUCT_DELETED
}
