// Feste Angaben zum Shop, die an mehreren Stellen stehen (Produktseite, Warenkorb,
// Kasse, Infoseiten). Wer hier etwas ändert, ändert es überall.

/** Versandpauschale für Lieferungen in Österreich, in Euro. Muss zur Versandart im Admin passen. */
export const SHIPPING_FLAT_EUR = 6

/** Lieferzeit in Tagen ab Bestellung („2 Wochen“). */
export const DELIVERY_DAYS = 14

export const SHOP_PHONE = "+43 2686 2259"
export const SHOP_PHONE_HREF = "tel:+4326862259"

/** Zahlungsarten wie in der FAQ. Reihenfolge = Anzeige. Symbole: public/images/payment. */
export const PAYMENT_METHODS = [
  { name: "Visa", icon: "/images/payment/visa.svg" },
  { name: "Mastercard", icon: "/images/payment/mastercard.svg" },
  { name: "Apple Pay", icon: "/images/payment/apple-pay.svg" },
  { name: "Google Pay", icon: "/images/payment/google-pay.svg" },
  { name: "PayPal", icon: "/images/payment/paypal.svg" },
  { name: "Klarna", icon: "/images/payment/klarna.svg" },
] as const

/**
 * Weihnachten 2026. Bis zum Bestellschluss steht die Frist am Kaufknopf und im
 * Warenkorb, danach verschwindet sie von selbst. Vom Tag danach bis Weihnachten
 * nennen wir kein Lieferdatum (es klänge nach „vor Weihnachten“).
 */
export const CHRISTMAS = {
  orderUntil: new Date("2026-12-06T23:59:59+01:00"),
  orderUntilLabel: "6. Dezember",
  deliveredByLabel: "20. Dezember",
  noDateUntil: new Date("2026-12-24T23:59:59+01:00"),
}

/** Zugesagter Liefertermin für eine Bestellung von heute, z. B. „29. November“. */
export function deliveryDateLabel(now: Date): string {
  const date = new Date(now.getTime() + DELIVERY_DAYS * 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat("de-AT", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Vienna",
  }).format(date)
}

/** Was heute über die Lieferung gesagt werden darf. */
export function deliveryState(now: Date) {
  const christmasOpen = now <= CHRISTMAS.orderUntil
  const showDate = christmasOpen || now > CHRISTMAS.noDateUntil
  return { christmasOpen, showDate }
}
