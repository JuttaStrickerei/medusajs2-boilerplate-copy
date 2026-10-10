import { model } from "@medusajs/framework/utils"

/**
 * Online withdrawal declaration (§ 13a FAGG).
 *
 * Treat as append-only: the declaration content and `received_at` are the
 * legal record and must never be changed after creation. Only
 * `confirmation_sent_at` is written later, once the acknowledgement email
 * has been sent.
 */
const RevocationDeclaration = model.define("revocation_declaration", {
  id: model.id({ prefix: "rev" }).primaryKey(),
  display_id: model.autoincrement(),
  // Legally relevant receipt time (server clock, stored as timestamptz)
  received_at: model.dateTime(),
  customer_name: model.text(),
  // Order or invoice number exactly as entered by the customer
  order_reference: model.text(),
  email: model.text(),
  scope: model.enum(["full", "partial"]),
  partial_text: model.text().nullable(),
  // Exact declaration wording that was confirmed and emailed
  declaration_text: model.text(),
  confirmation_sent_at: model.dateTime().nullable(),
})

export default RevocationDeclaration
