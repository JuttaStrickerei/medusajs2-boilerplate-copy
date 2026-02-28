import { MeiliSearch } from 'meilisearch';
import { loadEnv, Modules } from '@medusajs/framework/utils';
import { MedusaContainer } from '@medusajs/framework/types';

/**
 * Backfill script to populate MeiliSearch indexes with existing
 * product categories and collections using Medusa's internal services.
 *
 * Run this script using Medusa's exec command:
 * cd backend && pnpm medusa exec src/scripts/backfill-meilisearch.ts
 */

type ExecArgs = {
  container: MedusaContainer
}

// This script runs within Medusa's context, so we can use the container
export default async function backfill({ container }: ExecArgs) {
  const logger = container.resolve('logger');
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info('🚀 Starting MeiliSearch backfill...');

  // Get MeiliSearch config from environment
  const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST;
  const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY;

  if (!MEILISEARCH_HOST || !MEILISEARCH_API_KEY) {
    logger.error('❌ MEILISEARCH_HOST and MEILISEARCH_API_KEY must be set');
    return;
  }

  // Initialize MeiliSearch client
  const meiliClient = new MeiliSearch({
    host: MEILISEARCH_HOST,
    apiKey: MEILISEARCH_API_KEY,
  });

  try {
    await meiliClient.getVersion();
    logger.info('✅ Connected to MeiliSearch');
  } catch (error) {
    logger.error('❌ Failed to connect to MeiliSearch:', error);
    return;
  }

  // ===========================================
  // BACKFILL CATEGORIES
  // ===========================================
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('📦 BACKFILLING CATEGORIES');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // List all product categories
    const [categories] = await productModuleService.listAndCountProductCategories(
      {},
      { take: 100 }
    );

    logger.info(`📡 Found ${categories.length} categories in database`);

    if (categories.length === 0) {
      logger.info('⚠️ No categories to backfill');
    } else {
      // Transform for MeiliSearch
      const categoryDocs = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || null,
        handle: cat.handle,
        metadata: cat.metadata || {},
        parent_category_id: cat.parent_category_id || null,
        rank: cat.rank || 0,
      }));

      // Insert into MeiliSearch
      const index = meiliClient.index('categories');
      const result = await index.addDocuments(categoryDocs);
      await meiliClient.waitForTask(result.taskUid);

      logger.info(`✅ Backfilled ${categoryDocs.length} categories`);
    }
  } catch (error) {
    logger.error('❌ Failed to backfill categories:', error);
  }

  // ===========================================
  // BACKFILL COLLECTIONS
  // ===========================================
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('📦 BACKFILLING COLLECTIONS');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // List all collections
    const [collections] = await productModuleService.listAndCountProductCollections(
      {},
      { take: 100 }
    );

    logger.info(`📡 Found ${collections.length} collections in database`);

    if (collections.length === 0) {
      logger.info('⚠️ No collections to backfill');
    } else {
      // Transform for MeiliSearch
      const collectionDocs = collections.map((col) => ({
        id: col.id,
        title: col.title,
        handle: col.handle,
        metadata: col.metadata || {},
        thumbnail: (col as any).thumbnail || null,
        created_at: col.created_at || new Date().toISOString(),
      }));

      // Insert into MeiliSearch
      const index = meiliClient.index('collections');
      const result = await index.addDocuments(collectionDocs);
      await meiliClient.waitForTask(result.taskUid);

      logger.info(`✅ Backfilled ${collectionDocs.length} collections`);
    }
  } catch (error) {
    logger.error('❌ Failed to backfill collections:', error);
  }

  // ===========================================
  // VERIFY COUNTS
  // ===========================================
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('📊 FINAL DOCUMENT COUNTS');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const categoriesStats = await meiliClient.index('categories').getStats();
    const collectionsStats = await meiliClient.index('collections').getStats();
    const productsStats = await meiliClient.index('products').getStats();

    logger.info(`   categories:  ${categoriesStats.numberOfDocuments} documents`);
    logger.info(`   collections: ${collectionsStats.numberOfDocuments} documents`);
    logger.info(`   products:    ${productsStats.numberOfDocuments} documents`);

    logger.info('\n✅ Backfill completed!');
  } catch (error) {
    logger.error('❌ Failed to get final counts:', error);
  }
}
