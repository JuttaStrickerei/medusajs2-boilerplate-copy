import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { STORE_LOOK_FIELDS, toStoreLook } from "../helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { handle } = req.params

  const { data } = await query.graph({
    entity: "look",
    fields: STORE_LOOK_FIELDS,
    filters: { handle, status: "published" },
  })

  if (!data[0]) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Look with handle: ${handle} was not found`
    )
  }

  return res.json({ look: toStoreLook(data[0]) })
}
