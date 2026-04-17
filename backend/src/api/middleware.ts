import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostInvoiceConfigSchema } from "./admin/invoice-config/route"
import { newsletterSignupSchema } from "./store/newsletter/route"
import { wishlistMiddlewares } from "./store/wishlist/middlewares"
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
    ...wishlistMiddlewares,
    ...adminSendcloudShipmentMiddlewares,
  ],
})