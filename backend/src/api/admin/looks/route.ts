import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createLookWorkflow } from "../../../workflows/create-look"
import {
  ADMIN_LOOK_FIELDS,
  assertHandleIsFree,
  retrieveAdminLook,
  slugify,
  sortLookItems,
} from "./helpers"
import type {
  AdminCreateLookBodyType,
  AdminListLooksParamsType,
} from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { q, status } = req.validatedQuery as AdminListLooksParamsType
  const { skip = 0, take = 20 } = req.queryConfig.pagination ?? {}

  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  if (q) filters.title = { $ilike: `%${q}%` }

  const { data: looks, metadata } = await query.graph({
    entity: "look",
    fields: ADMIN_LOOK_FIELDS,
    filters,
    pagination: {
      skip,
      take,
      order: { rank: "ASC", created_at: "DESC" },
    },
  })

  return res.json({
    looks: looks.map(sortLookItems),
    count: metadata?.count ?? looks.length,
    offset: skip,
    limit: take,
  })
}

export async function POST(
  req: MedusaRequest<AdminCreateLookBodyType>,
  res: MedusaResponse
) {
  const body = req.validatedBody
  const handle = body.handle || slugify(body.title)

  await assertHandleIsFree(req.scope, handle)

  const { result } = await createLookWorkflow(req.scope).run({
    input: {
      ...body,
      title: body.title!,
      handle,
      product_ids: body.product_ids ?? [],
    },
  })

  const look = await retrieveAdminLook(req.scope, result.id)

  return res.status(201).json({ look })
}
