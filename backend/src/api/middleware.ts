// NOTE: This file is NOT loaded by Medusa. The framework only scans
// `./middlewares.ts` (plural). Registrations below are dead until moved there.
// See https://docs.medusajs.com/learn/fundamentals/api-routes/middlewares.
//
// The `wishlistMiddlewares` spread was moved to the canonical file to actually
// register the Zod validation + auth middleware. The remaining registrations
// here are still dead — migrating them is a separate audit task because
// activating latent validation may affect other admin/store flows.
import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostInvoiceConfigSchema } from "./admin/invoice-config/route"
import { newsletterSignupSchema } from "./store/newsletter/route"
import { adminSendcloudShipmentMiddlewares } from "./admin/sendcloud-shipments/middlewares"
import { cleanupProductImagesMiddleware } from "./admin/products/cleanup-images-middleware"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products/:id",
      methods: ["DELETE"],
      middlewares: [cleanupProductImagesMiddleware],
    },
    {
      matcher: "/admin/invoice-config",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(PostInvoiceConfigSchema),
      ],
    },
    {
      matcher: "/store/newsletter",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(newsletterSignupSchema),
      ],
    },
    ...adminSendcloudShipmentMiddlewares,
  ],
})