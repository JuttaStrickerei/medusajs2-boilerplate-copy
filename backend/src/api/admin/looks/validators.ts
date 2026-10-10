import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

const handleSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Handle darf nur a-z, 0-9 und - enthalten")

export const AdminListLooksParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    status: z.enum(["draft", "published"]).optional(),
  })
)

export type AdminListLooksParamsType = z.infer<typeof AdminListLooksParams>

export const AdminCreateLookBody = z.object({
  title: z.string().min(1),
  handle: handleSchema.optional(),
  description: z.string().nullable().optional(),
  images: z.array(z.string().url()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  rank: z.number().int().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  product_ids: z.array(z.string()).default([]),
})

export type AdminCreateLookBodyType = z.infer<typeof AdminCreateLookBody>

export const AdminUpdateLookBody = z.object({
  title: z.string().min(1).optional(),
  handle: handleSchema.optional(),
  description: z.string().nullable().optional(),
  images: z.array(z.string().url()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  rank: z.number().int().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  product_ids: z.array(z.string()).optional(),
})

export type AdminUpdateLookBodyType = z.infer<typeof AdminUpdateLookBody>
