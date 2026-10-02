import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { wishlistMiddlewares } from "./store/wishlist/middlewares"
import { storeLookMiddlewares } from "./store/looks/middlewares"
import { adminLookMiddlewares } from "./admin/looks/middlewares"
import { cleanupProductImagesMiddleware } from "./admin/products/cleanup-images-middleware"
import { PostInvoiceConfigSchema } from "./admin/invoice-config/route"
import { adminSendcloudShipmentMiddlewares } from "./admin/sendcloud-shipments/middlewares"

// Medusa scans `src/api/middlewares.ts` (plural) and ONLY this file — see
// https://docs.medusajs.com/learn/fundamentals/api-routes/middlewares.
// Route-level middleware arrays defined next to their route files must be
// spread into the `routes` array below to be registered.
//
// NOTE: a `src/api/middleware.ts` (singular) is NOT loaded by the framework
// — always register here.
export default defineMiddlewares({
  routes: [
    {
      matcher: "/webhooks/sendcloud",
      method: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
    // Bulk Image Upload sends one base64 image per request (9 MB PNG ≈ 12 MB)
    {
      matcher: "/admin/bulk-images/upload",
      methods: ["POST"],
      bodyParser: { sizeLimit: "25mb" },
    },
    ...wishlistMiddlewares,
    ...storeLookMiddlewares,
    ...adminLookMiddlewares,
    {
      matcher: "/admin/products/:id",
      methods: ["DELETE"],
      middlewares: [cleanupProductImagesMiddleware],
    },
    // Route handler reads req.validatedBody
    {
      matcher: "/admin/invoice-config",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostInvoiceConfigSchema)],
    },
    ...adminSendcloudShipmentMiddlewares,
  ],
})
