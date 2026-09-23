import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { StoreAddLookToCartBody, StoreListLooksParams } from "./validators"

export const storeLookMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/looks",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(StoreListLooksParams, {
        isList: true,
        defaultLimit: 50,
      }),
    ],
  },
  {
    matcher: "/store/carts/:id/looks",
    method: "POST",
    middlewares: [validateAndTransformBody(StoreAddLookToCartBody)],
  },
]
