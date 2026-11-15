"use client"

import { useEffect, useState } from "react"
import { CHRISTMAS, deliveryDateLabel, deliveryState } from "@lib/util/shop-facts"

/** Liefertermin als Datum statt nur „2 Wochen“, dazu bis zum Bestellschluss die Weihnachtsfrist. */
export default function DeliveryLine({ className }: { className?: string }) {
  // Das Datum erst im Browser rechnen: Die Seite kann zwischengespeichert sein
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])
  const state = now ? deliveryState(now) : null

  return (
    <p className={className} data-testid="delivery-line">
      {state?.showDate && now ? (
        <>
          Heute bestellt, bis{" "}
          <span className="font-medium text-stone-700">{deliveryDateLabel(now)}</span> bei Ihnen.
        </>
      ) : (
        <>Lieferung 2 Wochen nach Ihrer Bestellung.</>
      )}
      {state?.christmasOpen && (
        <> Für Weihnachten bitte bis {CHRISTMAS.orderUntilLabel} bestellen.</>
      )}
    </p>
  )
}
