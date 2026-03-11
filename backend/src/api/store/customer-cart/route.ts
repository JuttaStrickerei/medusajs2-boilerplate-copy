import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

/**
 * GET /store/customer-cart
 * Returns the most recent active (non-completed) cart for the authenticated customer.
 * Used after login to restore the customer's previous cart session.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id

  if (!customerId) {
    return res.json({ cart: null })
  }

  try {
    const query = req.scope.resolve("query") as any

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "completed_at", "created_at"],
      filters: { customer_id: customerId },
    })

    const activeCart = carts
      .filter((c: any) => !c.completed_at)
      .sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

    return res.json({ cart: activeCart ? { id: activeCart.id } : null })
  } catch {
    return res.json({ cart: null })
  }
}
