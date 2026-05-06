import { defineMiddlewares } from "@medusajs/framework/http"
import { wishlistMiddlewares } from "./store/wishlist/middlewares"

// Medusa scans `src/api/middlewares.ts` (plural) and ONLY this file — see
// https://docs.medusajs.com/learn/fundamentals/api-routes/middlewares.
// Route-level middleware arrays defined next to their route files must be
// spread into the `routes` array below to be registered.
//
// NOTE: `src/api/middleware.ts` (singular) is NOT loaded by the framework
// despite its `defineMiddlewares(...)` call — any registrations there are
// dead code until moved here.
export default defineMiddlewares({
  routes: [
    {
      matcher: "/webhooks/sendcloud",
      method: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
    ...wishlistMiddlewares,
  ],
})
