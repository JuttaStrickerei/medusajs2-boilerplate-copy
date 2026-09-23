import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const StoreListLooksParams = createFindParams({
  limit: 50,
  offset: 0,
})

export type StoreListLooksParamsType = z.infer<typeof StoreListLooksParams>

export const StoreAddLookToCartBody = z.object({
  look_id: z.string().min(1),
  items: z
    .array(
      z.object({
        variant_id: z.string().min(1),
        quantity: z.number().int().min(1).max(20).default(1),
      })
    )
    .min(1)
    .max(20),
})

export type StoreAddLookToCartBodyType = z.infer<typeof StoreAddLookToCartBody>
