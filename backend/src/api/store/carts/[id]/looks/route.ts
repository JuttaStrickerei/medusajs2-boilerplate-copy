import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { addLookToCartWorkflow } from "../../../../../workflows/add-look-to-cart"
import type { StoreAddLookToCartBodyType } from "../../../looks/validators"

export async function POST(
  req: MedusaRequest<StoreAddLookToCartBodyType>,
  res: MedusaResponse
) {
  const { look_id, items } = req.validatedBody

  await addLookToCartWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      look_id,
      items: items as { variant_id: string; quantity: number }[],
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "items.id", "items.variant_id", "items.quantity"],
    filters: { id: req.params.id },
  })

  return res.json({ cart: data[0] })
}
