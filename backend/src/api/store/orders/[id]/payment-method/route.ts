import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveOrderPaymentMethod } from "../../../../../lib/order-payment-method"

/**
 * GET /store/orders/:id/payment-method
 * Die tatsächlich genutzte Zahlungsart für die Bestellbestätigung
 * („Apple Pay“, „Kreditkarte (Visa •••• 4242)“ …). Wie /store/orders/:id
 * genügt die Bestellnummer, die nur die Käuferin kennt. Liefert nur den
 * Anzeigetext, keine weiteren Zahlungsdaten.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const info = await resolveOrderPaymentMethod(req.scope, req.params.id)
  res.json({ payment_method: info })
}
