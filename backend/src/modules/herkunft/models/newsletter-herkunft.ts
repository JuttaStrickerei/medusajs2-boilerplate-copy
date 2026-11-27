import { model } from "@medusajs/framework/utils"

/**
 * Herkunft einer Newsletter-Anmeldung (lib/herkunft), abgelegt zum persönlichen
 * Willkommens-Code. Eigene Tabelle ohne Verknüpfung zum Rabatt: So ist sie über
 * keine Shop-Schnittstelle abrufbar (Rabatt-Metadaten kommen mit dem Warenkorb
 * zurück, wer den Code einlöst, sähe sie). Gelöscht beim Kauf mit dem Code
 * (Subscriber meta-capi-purchase), sonst nach Ablauf (Job herkunft-aufraeumen).
 */
const NewsletterHerkunft = model.define("newsletter_herkunft", {
  id: model.id({ prefix: "nlh" }).primaryKey(),
  // WILLKOMMEN-XXXXXXXX
  code: model.text().unique(),
  // Herkunft (utm_*, Ankunftsseite, Uhrzeit, _fbc) und angemeldet_at
  data: model.json(),
})

export default NewsletterHerkunft
