import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import {
  ORDER_SOURCES,
  saveOrderSourceWorkflow,
} from "../../../../../workflows/save-order-source"

// Only right after the purchase: the question sits on the confirmation page
const ANSWER_WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_TEXT_LENGTH = 200

const sourceSchema = z.object({
  source: z.enum(ORDER_SOURCES),
  text: z.string().trim().max(MAX_TEXT_LENGTH).optional(),
})

/**
 * POST /store/orders/:id/source
 * "Wie haben Sie von uns erfahren?" from the order confirmation page. The
 * order id is only known to the buyer; answering again within the window
 * replaces the earlier answer.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = sourceSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Ungültige Antwort" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "created_at"],
    filters: { id: req.params.id },
  })
  const order = data[0]
  if (!order) {
    return res.status(404).json({ message: "Bestellung nicht gefunden" })
  }
  if (Date.now() - new Date(order.created_at).getTime() > ANSWER_WINDOW_MS) {
    return res.status(410).json({ message: "Die Umfrage ist abgelaufen" })
  }

  const { source, text } = parsed.data
  await saveOrderSourceWorkflow(req.scope).run({
    input: {
      order_id: order.id,
      source,
      text: source === "sonstiges" && text ? text : undefined,
    },
  })

  return res.json({ success: true })
}
