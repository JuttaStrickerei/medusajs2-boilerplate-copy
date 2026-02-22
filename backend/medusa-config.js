import { loadEnv, Modules, defineConfig } from '@medusajs/utils';
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  MAILCHIMP_API_KEY,
  MAILCHIMP_SERVER,
  MAILCHIMP_LIST_ID,
  MAILCHIMP_NEW_PRODUCTS_SUBJECT_LINE,
  MAILCHIMP_NEW_PRODUCTS_STOREFRONT_URL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MEILISEARCH_HOST,
  MEILISEARCH_API_KEY,
  SENDCLOUD_PUBLIC_KEY,
  SENDCLOUD_SECRET_KEY,
  PAYPAL_SANDBOX,
  PAYPAL_AUTH_WEBHOOK_ID,
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
} from 'lib/constants';

loadEnv(process.env.NODE_ENV, process.cwd());

/** @type {import('@medusajs/types').MedusaConfig} */
const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET
    }
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    {
      key: Modules.FULFILLMENT,
      resolve: '@medusajs/fulfillment',
      options: {
        providers: [
          {
            resolve: './src/modules/sendcloud',
            id: 'sendcloud',
            options: {
              public_key: SENDCLOUD_PUBLIC_KEY,
              secret_key: SENDCLOUD_SECRET_KEY
            }
          },
          {
            resolve: '@medusajs/fulfillment-manual',
            id: 'manual',
          }
        ],
      },
    },
    {resolve: './src/modules/invoice_generator',
    },
    {resolve: './src/modules/wishlist',
    },
    {
      key: Modules.FILE,
      resolve: '@medusajs/file',
      options: {
        providers: [
          ...(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY ? [{
            resolve: './src/modules/minio-file',
            id: 'minio',
            options: {
              endPoint: MINIO_ENDPOINT,
              accessKey: MINIO_ACCESS_KEY,
              secretKey: MINIO_SECRET_KEY,
              bucket: MINIO_BUCKET // Optional, default: medusa-media
            }
          }] : [{
            resolve: '@medusajs/file-local',
            id: 'local',
            options: {
              upload_dir: 'static',
              backend_url: `${BACKEND_URL}/static`
            }
          }])
        ]
      }
    },
    ...(REDIS_URL ? [{
      key: Modules.EVENT_BUS,
      resolve: '@medusajs/event-bus-redis',
      options: {
        redisUrl: REDIS_URL
      }
    },
    {
      key: Modules.WORKFLOW_ENGINE,
      resolve: '@medusajs/workflow-engine-redis',
      options: {
        redis: {
          url: REDIS_URL,
        }
      }
    }] : []),
    ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL || RESEND_API_KEY && RESEND_FROM_EMAIL || MAILCHIMP_API_KEY && MAILCHIMP_SERVER && MAILCHIMP_LIST_ID ? [{
      key: Modules.NOTIFICATION,
      resolve: '@medusajs/notification',
      options: {
        providers: [
          ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL ? [{
            resolve: '@medusajs/notification-sendgrid',
            id: 'sendgrid',
            options: {
              channels: ['email'],
              api_key: SENDGRID_API_KEY,
              from: SENDGRID_FROM_EMAIL,
            }
          }] : []),
          ...(RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
            resolve: './src/modules/email-notifications',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: RESEND_API_KEY,
              from: RESEND_FROM_EMAIL.includes('<') ? RESEND_FROM_EMAIL : `Jutta Strickerei <${RESEND_FROM_EMAIL}>`,
            },
          }] : []),
          ...(MAILCHIMP_API_KEY && MAILCHIMP_SERVER && MAILCHIMP_LIST_ID ? [{
            resolve: './src/modules/mailchimp',
            id: 'mailchimp',
            options: {
              channels: ['newsletter'],
              apiKey: MAILCHIMP_API_KEY,
              server: MAILCHIMP_SERVER,
              listId: MAILCHIMP_LIST_ID,
              templates: {
                new_products: {
                  subject_line: MAILCHIMP_NEW_PRODUCTS_SUBJECT_LINE,
                  storefront_url: MAILCHIMP_NEW_PRODUCTS_STOREFRONT_URL,
                },
              },
            },
          }] : []),
        ]
      }
    }] : []),
    ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
      key: Modules.PAYMENT,
      resolve: '@medusajs/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: STRIPE_API_KEY,
              webhookSecret: STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    }] : []),
    // ========================================
    // MEILISEARCH - Erweiterte Konfiguration
    // ========================================
    ...(MEILISEARCH_HOST && MEILISEARCH_API_KEY ? [{
      resolve: '@rokmohar/medusa-plugin-meilisearch',
      options: {
        config: {
          host: MEILISEARCH_HOST,
          apiKey: MEILISEARCH_API_KEY
        },
        settings: {
          products: {
            indexSettings: {
              // Erweiterte durchsuchbare Felder (Reihenfolge = Priorität)
              searchableAttributes: [
                'title',        // Priorität 1: Produkttitel
                'description',  // Priorität 2: Beschreibung
                'material',     // Priorität 3: Material (z.B. "Kaschmir", "Merinowolle")
                'subtitle',     // Priorität 4: Untertitel
                'tags',         // Priorität 5: Tags (Array)
                'variant_sku',  // Priorität 6: SKU
                'collection',   // Priorität 7: Kollektion
                'metadata',     // Priorität 8: Metadata (Key-Value)
                'type',         // Priorität 9: Produkttyp
              ],
              // Angezeigte Felder in Suchergebnissen
              displayedAttributes: [
                'id',
                'title',
                'description',
                'material',
                'subtitle',
                'tags',
                'variant_sku',
                'thumbnail',
                'handle',
                'collection',
                'metadata',
                'type',
              ],
              // Ranking-Regeln für bessere Relevanz
              rankingRules: [
                'words',      // Anzahl übereinstimmender Wörter
                'typo',       // Tippfehler-Toleranz
                'proximity',  // Nähe der Suchbegriffe zueinander
                'attribute',  // Gewichtung nach searchableAttributes-Reihenfolge
                'sort',       // Benutzerdefinierte Sortierung
                'exactness',  // Exakte Übereinstimmungen bevorzugen
              ],
              // Sortierbare Attribute (für Filterung)
              sortableAttributes: ['title', 'created_at'],
              // Filterbare Attribute (für Facetten)
              filterableAttributes: ['material', 'tags', 'collection', 'type'],
            },
            primaryKey: 'id',
          }
        }
      }
    }] : [])
  ],
  plugins: []
};

console.log(JSON.stringify(medusaConfig, null, 2));

export default /** @type {import('@medusajs/types').MedusaConfig} */ (defineConfig(medusaConfig))