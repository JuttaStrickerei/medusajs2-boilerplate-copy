"use client"

import { useCart } from "@lib/context/cart-context"
import { cartSignature } from "@lib/util/cart-signature"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

// Zeit, die die normale Aktualisierung der Seite bekommt, bevor nachgeholfen wird
const WAIT_MS = 250
// Abstand zum nächsten Versuch, falls auch das Auffrischen nicht ankommt
const RETRY_MS = 2500
const MAX_TRIES = 3

/**
 * Hält Warenkorb und Kasse auf dem Stand des echten Warenkorbs.
 *
 * Nach einer Änderung (Menge, Gutschein, Löschen) liefert der Server die neue
 * Seite mit der Antwort mit. Im gebauten Shop bleibt die Anzeige dabei manchmal
 * stehen und zeigt den neuen Stand erst nach dem Neuladen (im Entwicklungsmodus
 * tritt das nicht auf). Diese Komponente vergleicht deshalb den Stand der Seite
 * (`signature`, vom Server) mit dem Warenkorb im Browser (CartProvider, nach
 * jeder Änderung frisch geladen). Ist der Warenkorb im Browser neuer und zeigt
 * die Seite etwas anderes, frischt sie die Seite auf.
 *
 * Ist umgekehrt die Seite neuer (z. B. nach einem Kassenschritt, der den
 * Warenkorb im Browser nicht neu lädt), passiert nichts.
 */
export default function CartFreshness({ signature }: { signature: string }) {
  const { cart, isLoading, lastFetchedAt } = useCart()
  const router = useRouter()
  // Zeitpunkt, zu dem dieser Stand der Seite im Browser angekommen ist
  const pageSeenAt = useRef(0)
  const [tries, setTries] = useState(0)

  useEffect(() => {
    pageSeenAt.current = Date.now()
    setTries(0)
  }, [signature])

  // Ohne Warenkorb im Browser (z. B. direkt nach der Bestellung) wird nichts abgeglichen
  const latest = isLoading || !cart ? null : cartSignature(cart)

  useEffect(() => {
    if (latest === null || latest === signature) return
    // Der Warenkorb im Browser ist älter als die Seite: Die Seite stimmt
    if (lastFetchedAt <= pageSeenAt.current) return
    if (tries >= MAX_TRIES) return

    const timer = window.setTimeout(
      () => {
        router.refresh()
        setTries((n) => n + 1)
      },
      tries === 0 ? WAIT_MS : RETRY_MS
    )
    return () => window.clearTimeout(timer)
  }, [latest, signature, lastFetchedAt, tries, router])

  return null
}
