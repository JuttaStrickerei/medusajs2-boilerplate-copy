import { NextResponse } from "next/server"
import { retrieveCart } from "@lib/data/cart"

// Warenkorb für den Zähler im Kopf und das Aufklappfeld (CartProvider).
//
// Bewusst eine normale Abfrage und keine Server-Action: Server-Actions laufen
// über die Warteschlange des Routers. Folgt auf eine Änderung im Warenkorb
// (Menge, Gutschein, Löschen) sofort eine zweite Server-Action, kann deren
// Antwort die erste überholen. Die Seite übernimmt dann den neuen Stand nicht
// und zeigt ihn erst nach dem Neuladen (nur im gebauten Shop, nicht im
// Entwicklungsmodus).
export const dynamic = "force-dynamic"

export async function GET() {
  const cart = await retrieveCart().catch(() => null)

  return NextResponse.json(
    { cart },
    { headers: { "Cache-Control": "private, no-store" } }
  )
}
