import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostInvoiceConfigSchema } from "./admin/invoice-config/route"
import { newsletterSignupSchema } from "./store/newsletter/route"
import { wishlistMiddlewares } from "./store/wishlist/middlewares"

export default defineMiddlewares({
  routes: [
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
  ],
})