// Deutsche Meldungen für Kasse und Kundenkonto.
//
// Medusa schickt seine Fehler auf Englisch, und Fehler, die eine Server-Action
// wirft, ersetzt Next.js im Produktions-Build durch einen allgemeinen
// englischen Satz. Darum hier feste deutsche Sätze. Den Originaltext schreiben
// die Aufrufer ins Server-Protokoll, damit die Ursache auffindbar bleibt.

export const SHOP_ERRORS = {
  PROMO_INVALID:
    "Dieser Code ist leider nicht gültig. Bitte prüfen Sie die Schreibweise.",
  ADDRESS_COUNTRY:
    "Wir liefern derzeit nur nach Österreich. Bitte wählen Sie Österreich als Land.",
  ADDRESS_EMAIL: "Bitte prüfen Sie Ihre E-Mail-Adresse.",
  ADDRESS_FAILED:
    "Die Adresse konnte nicht gespeichert werden. Bitte prüfen Sie Ihre Eingaben.",
  ADDRESS_DELETE_FAILED:
    "Die Adresse konnte nicht gelöscht werden. Bitte versuchen Sie es noch einmal.",
  OUT_OF_STOCK:
    "Ein Artikel in Ihrem Warenkorb ist leider nicht mehr verfügbar. Bitte prüfen Sie Ihren Warenkorb.",
  ORDER_FAILED:
    "Die Zahlung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
  CART_MISSING:
    "Ihr Warenkorb wurde nicht gefunden. Bitte laden Sie die Seite neu.",
  SAVE_FAILED:
    "Ihre Änderung konnte nicht gespeichert werden. Bitte versuchen Sie es noch einmal.",
} as const

const textOf = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : ""

// Lieferadresse in der Kasse
export function addressErrorMessage(error: unknown): string {
  const text = textOf(error)
  if (/not within region|country/i.test(text)) return SHOP_ERRORS.ADDRESS_COUNTRY
  if (/email/i.test(text)) return SHOP_ERRORS.ADDRESS_EMAIL
  return SHOP_ERRORS.ADDRESS_FAILED
}

// Bestellung abschließen
export function orderErrorMessage(error: unknown): string {
  const text = textOf(error)
  if (/inventory|out of stock|stock location/i.test(text)) {
    return SHOP_ERRORS.OUT_OF_STOCK
  }
  return SHOP_ERRORS.ORDER_FAILED
}
