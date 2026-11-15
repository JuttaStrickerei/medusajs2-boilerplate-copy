import { HttpTypes } from "@medusajs/types"

/**
 * Kurzfassung eines Warenkorbs: ändert sich, sobald sich Stücke, Mengen,
 * Gutscheine, Versandart oder Summe ändern. Damit lässt sich vergleichen, ob
 * die vom Server gerenderte Seite denselben Stand zeigt wie der Warenkorb im
 * Browser (modules/cart/components/cart-freshness).
 */
export const cartSignature = (cart?: HttpTypes.StoreCart | null): string => {
  if (!cart) return "leer"

  const items = (cart.items ?? [])
    .map((item) => `${item.id}:${item.quantity}`)
    .sort()
    .join(",")
  const promotions = (
    (cart as { promotions?: { id?: string; code?: string }[] }).promotions ?? []
  )
    .map((promotion) => promotion.code ?? promotion.id ?? "")
    .sort()
    .join(",")
  const shipping = (cart.shipping_methods ?? [])
    .map((method) => method.shipping_option_id ?? method.id)
    .sort()
    .join(",")

  return [cart.id, items, promotions, shipping, cart.total ?? 0].join("|")
}
