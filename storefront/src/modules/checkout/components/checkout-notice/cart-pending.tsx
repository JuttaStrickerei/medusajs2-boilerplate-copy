"use client"

import { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CheckoutNotice from "./index"

/**
 * Warenkorb-Cookie da, Warenkorb aber nicht ladbar. Direkt nach dem Bestellen
 * ist das normal (die Weiterleitung zur Bestätigung kommt gleich). Kommt sie
 * nicht, war das Backend nicht erreichbar: dann nach ein paar Sekunden einen
 * Weg zeigen, statt endlos „Weiterleitung …“ stehen zu lassen.
 */
export default function CartPending() {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 6000)
    return () => clearTimeout(t)
  }, [])

  if (!timedOut) {
    return (
      <p className="text-stone-600">Weiterleitung zur Bestellbestätigung…</p>
    )
  }

  return (
    <CheckoutNotice
      title="Ihr Warenkorb konnte gerade nicht geladen werden."
      reload
      className="max-w-md"
      data-testid="cart-load-error"
    >
      <p>
        Bitte laden Sie die Seite in einem Moment neu. Haben Sie gerade
        bestellt, kommt die Bestätigung auch per E-Mail.
      </p>
      <LocalizedClientLink
        href="/cart"
        className="inline-block font-medium text-stone-800 underline underline-offset-4 hover:text-stone-600"
      >
        Zum Warenkorb
      </LocalizedClientLink>
    </CheckoutNotice>
  )
}
