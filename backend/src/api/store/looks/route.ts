import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { STORE_LOOK_FIELDS, toStoreLook } from "./helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { skip = 0, take = 50 } = req.queryConfig.pagination ?? {}

  const { data: looks, metadata } = await query.graph({
    entity: "look",
    fields: STORE_LOOK_FIELDS,
    filters: { status: "published" },
    pagination: {
      skip,
      take,
      order: { rank: "ASC", created_at: "DESC" },
    },
  })

  return res.json({
    looks: looks.map(toStoreLook),
    count: metadata?.count ?? looks.length,
    offset: skip,
    limit: take,
  })
}
