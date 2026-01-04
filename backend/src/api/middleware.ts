import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostInvoiceConfigSchema } from "./admin/invoice-config/route"
import { newsletterSignupSchema } from "./store/newsletter/route"

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
  ],
})