import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { IProductModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import { ProductEvents, SearchUtils } from '@medusajs/framework/utils';
import { MeiliSearchService } from '@rokmohar/medusa-plugin-meilisearch';

export default async function productUpsertHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const productId = data.id;

  const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT);
  
  // Check if MeiliSearch service is available
  let meiliSearchService: MeiliSearchService;
  try {
    meiliSearchService = container.resolve('meilisearch');
  } catch (error) {
    return;
  }

  // Produkt mit ALLEN relevanten Feldern und Relations laden
  const product = await productModuleService.retrieveProduct(productId, {
    relations: ['tags', 'collection', 'type', 'variants'],
  });

  // Dokument für MeiliSearch vorbereiten mit allen durchsuchbaren Feldern
  const searchDocument = {
    id: product.id,
    title: product.title,
    description: product.description,
    material: product.material,
    subtitle: product.subtitle,
    handle: product.handle,
    thumbnail: product.thumbnail,
    metadata: product.metadata,
    // Relations flach machen für bessere Suche
    tags: product.tags?.map(tag => tag.value) || [],
    collection: product.collection?.title || null,
    type: product.type?.value || null,
    variant_sku: product.variants?.map(v => v.sku).filter(Boolean) || [],
  };

  await meiliSearchService.addDocuments('products', [searchDocument], SearchUtils.indexTypes.PRODUCTS);
}

export const config: SubscriberConfig = {
  event: [ProductEvents.PRODUCT_CREATED, ProductEvents.PRODUCT_UPDATED]
}