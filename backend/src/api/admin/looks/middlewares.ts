import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import {
  AdminCreateLookBody,
  AdminListLooksParams,
  AdminUpdateLookBody,
} from "./validators"

export const adminLookMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/looks",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(AdminListLooksParams, {
        isList: true,
        defaultLimit: 20,
      }),
    ],
  },
  {
    matcher: "/admin/looks",
    method: "POST",
    middlewares: [validateAndTransformBody(AdminCreateLookBody)],
  },
  {
    matcher: "/admin/looks/:id",
    method: "POST",
    middlewares: [validateAndTransformBody(AdminUpdateLookBody)],
  },
]
