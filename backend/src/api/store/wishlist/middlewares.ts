import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "zod"

export const AddWishlistItemSchema = z.object({
  product_id: z.string(),
  variant_id: z.string().optional(),
})

export type AddWishlistItemSchema = z.infer<typeof AddWishlistItemSchema>

export const RemoveWishlistItemSchema = z.object({
  product_id: z.string(),
})

export type RemoveWishlistItemSchema = z.infer<typeof RemoveWishlistItemSchema>

export const wishlistMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/wishlist",
    method: "GET",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    matcher: "/store/wishlist",
    method: "POST",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(AddWishlistItemSchema),
    ],
  },
  {
    matcher: "/store/wishlist",
    method: "DELETE",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(RemoveWishlistItemSchema),
    ],
  },
]
