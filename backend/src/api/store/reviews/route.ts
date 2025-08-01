import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createReviewWorkflow } from "../../../workflows/create-review"

import { z } from "zod"

// KORRIGIERTES SCHEMA: Alle Pflichtfelder sind jetzt auch hier als solche markiert.
export const PostStoreReviewSchema = z.object({
  title: z.string().optional(), // Title ist optional
  content: z.string(), // Content ist ein Pflichtfeld
  rating: z.preprocess(
    (val) => {
      if (val && typeof val === "string") {
        return parseInt(val)
      }
      return val
    },
    z.number().min(1).max(5) // Rating ist ein Pflichtfeld
  ),
  product_id: z.string(), // product_id ist ein Pflichtfeld
  handle: z.string(), // handle ist ein Pflichtfeld
  first_name: z.string(), // first_name ist ein Pflichtfeld
  last_name: z.string(), // last_name ist ein Pflichtfeld
})

type PostStoreReviewReq = z.infer<typeof PostStoreReviewSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<PostStoreReviewReq>,
  res: MedusaResponse
) => {
  // 'validatedBody' hat jetzt den korrekten Typ, bei dem alle Pflichtfelder vorhanden sind.
  const input = req.validatedBody

  const { result } = await createReviewWorkflow(req.scope)
    .run({
      input: {
        ...input,
        customer_id: req.auth_context?.actor_id,
      },
    })

  res.json(result)
}