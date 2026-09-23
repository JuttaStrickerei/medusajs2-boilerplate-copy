import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateLookWorkflow } from "../../../../workflows/update-look"
import { deleteLooksWorkflow } from "../../../../workflows/delete-looks"
import { assertHandleIsFree, retrieveAdminLook } from "../helpers"
import type { AdminUpdateLookBodyType } from "../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const look = await retrieveAdminLook(req.scope, req.params.id)

  return res.json({ look })
}

export async function POST(
  req: MedusaRequest<AdminUpdateLookBodyType>,
  res: MedusaResponse
) {
  const { id } = req.params
  const body = req.validatedBody

  // 404, falls der Look nicht existiert
  await retrieveAdminLook(req.scope, id)

  if (body.handle) {
    await assertHandleIsFree(req.scope, body.handle, id)
  }

  await updateLookWorkflow(req.scope).run({
    input: { id, ...body },
  })

  const look = await retrieveAdminLook(req.scope, id)

  return res.json({ look })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await retrieveAdminLook(req.scope, id)

  await deleteLooksWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  return res.json({ id, object: "look", deleted: true })
}
