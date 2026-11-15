"use client"

import { useEffect, useState } from "react"
import { CreditCard, Phone, Truck } from "@components/icons"
import PaymentMethods from "@modules/common/components/payment-methods"
import {
  SHOP_PHONE,
  SHOP_PHONE_HREF,
  deliveryDateLabel,
  deliveryState,
} from "@lib/util/shop-facts"

/**
 * Drei kurze Antworten direkt am Kaufknopf: Wann kommt es, wie kann ich zahlen,
 * wen kann ich fragen. Bewusst ohne Kasten und ohne Wiederholungen: Die
 * Versandkosten stehen schon am Preis.
 */
export default function PurchaseInfo() {
  // Das Datum erst im Browser rechnen: Die Seite wird zwischengespeichert
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])
  const state = now ? deliveryState(now) : null

  return (
    <ul className="space-y-2 text-sm text-stone-700" data-testid="purchase-info">
      <li className="flex items-start gap-2.5">
        <Truck size={17} className="text-stone-500 flex-shrink-0 mt-0.5" />
        <span>
          {state?.showDate && now ? (
            <>
              Heute bestellt, bis{" "}
              <span className="font-medium text-stone-900">{deliveryDateLabel(now)}</span>{" "}
              bei Ihnen
            </>
          ) : (
            <>Lieferung 2 Wochen nach Ihrer Bestellung</>
          )}
        </span>
      </li>
      <li className="flex items-center gap-2.5">
        <CreditCard size={17} className="text-stone-500 flex-shrink-0" />
        <PaymentMethods label="" />
      </li>
      <li className="flex items-start gap-2.5">
        <Phone size={17} className="text-stone-500 flex-shrink-0 mt-0.5" />
        <span>
          Wir beraten Sie gern:{" "}
          <a
            href={SHOP_PHONE_HREF}
            className="font-medium text-stone-900 underline underline-offset-2 whitespace-nowrap"
          >
            {SHOP_PHONE}
          </a>
        </span>
      </li>
    </ul>
  )
}
