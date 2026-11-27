import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getOrderPaymentMethodWorkflow } from "../../../../../workflows/get-order-payment-method"

/**
 * GET /store/orders/:id/payment-method
 * Die tatsächlich genutzte Zahlungsart für die Bestellbestätigung
 * („Apple Pay“, „Kreditkarte (Visa •••• 4242)“ …). Wie /store/orders/:id
 * genügt die Bestellnummer, die nur die Käuferin kennt. Nur lesend; liefert
 * nur den Anzeigetext, keine weiteren Zahlungsdaten.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { result } = await getOrderPaymentMethodWorkflow(req.scope).run({
      input: { order_id: req.params.id },
    })
    res.json({ payment_method: result ?? null })
  } catch (e) {
    // Die Seite zeigt dann „Online-Zahlung“; die Bestellung selbst ist nicht betroffen
    req.scope
      .resolve(ContainerRegistrationKeys.LOGGER)
      .warn(
        `[PaymentMethodLabel] Zahlungsart für ${req.params.id} nicht ermittelt: ${
          (e as Error)?.message
        }`
      )
    res.json({ payment_method: null })
  }
}
