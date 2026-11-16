"use client"

import { useCart } from "@lib/context/cart-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ShoppingBag, X } from "@components/icons"
import { usePathname } from "next/navigation"
import { useState } from "react"

/**
 * Zeile unter dem Kopf für Besucherinnen, die mit gefülltem Warenkorb wiederkommen:
 * „In Ihrem Warenkorb liegt noch: Mantel ROUGA · Zum Warenkorb“. Die Regel:
 *
 * - Wer: nur, wer den Shop mit einem Warenkorb öffnet, in dem schon etwas liegt
 *   (Rückkehr nach Stunden oder Tagen). Wer gerade erst etwas hineinlegt, landet
 *   ohnehin im Warenkorb und sieht die Zeile in diesem Besuch nicht.
 * - Wo: überall außer im Warenkorb, in der Kasse, im Konto und auf Rechtstexten.
 * - Wie: eine schmale Zeile im Seitenfluss, vom Server mitgeliefert (nichts springt).
 *   Kein Rabatt, keine Uhr, keine Stückzahl-Warnung.
 * - Schließen: gilt bis zum nächsten Laden der Seite. Dafür wird nichts auf dem
 *   Gerät gespeichert.
 */
const HIDDEN_ON =
  /\/(cart|checkout|account|privacy|terms|imprint|agb|impressum|vertrag-widerrufen|order|reset-password)(\/|$)/

// gilt über Seitenwechsel hinweg, bis die Seite neu geladen wird
let dismissed = false

type ReminderItem = { title: string; quantity: number }

export default function CartReminder({ initialItems }: { initialItems: ReminderItem[] }) {
  const pathname = usePathname()
  const { cart, isLoading } = useCart()
  // Stand beim Öffnen des Shops: Nur dann gibt es die Zeile in diesem Besuch
  const [startedWithItems] = useState(initialItems.length > 0)
  const [closed, setClosed] = useState(dismissed)

  if (!startedWithItems || closed || HIDDEN_ON.test(pathname || "")) return null

  // Sobald der Warenkorb im Browser geladen ist, zählt der aktuelle Stand
  const items: ReminderItem[] = isLoading
    ? initialItems
    : (cart?.items ?? []).map((item) => ({
        title: item.product_title ?? item.title ?? "",
        quantity: item.quantity,
      }))
  if (!items.length) return null

  const pieces = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

  return (
    <div
      className="border-b border-stone-200 bg-stone-100"
      role="region"
      aria-label="Ihr Warenkorb"
      data-testid="cart-reminder"
    >
      <div className="content-container flex items-center gap-3 py-2.5 text-sm text-stone-700">
        <ShoppingBag size={16} className="flex-shrink-0 text-stone-500" />
        <p className="min-w-0 flex-1 text-pretty">
          {pieces === 1 && items[0].title ? (
            <>
              In Ihrem Warenkorb liegt noch:{" "}
              <span className="font-medium text-stone-900">{items[0].title}</span>
            </>
          ) : (
            <>
              In Ihrem Warenkorb liegen noch{" "}
              <span className="font-medium text-stone-900">{pieces} Teile</span>
            </>
          )}{" "}
          <LocalizedClientLink
            href="/cart"
            className="ml-2 whitespace-nowrap font-medium text-stone-900 underline underline-offset-4 hover:text-stone-700"
            data-testid="cart-reminder-link"
          >
            Zum Warenkorb
          </LocalizedClientLink>
        </p>
        <button
          type="button"
          onClick={() => {
            dismissed = true
            setClosed(true)
          }}
          className="-mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200 hover:text-stone-800"
          aria-label="Hinweis schließen"
          data-testid="cart-reminder-close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
