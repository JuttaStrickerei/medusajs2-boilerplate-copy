"use client"

import { cn } from "@lib/utils"
import { useEffect, useState } from "react"

/**
 * Leiste mit Summe und „Zur Kasse“ am unteren Rand (Handy und Tablet). Sobald der Knopf
 * in der Zusammenfassung zu sehen ist, verschwindet sie: zwei gleiche Knöpfe verwirren.
 * Sie bleibt im Seitenfluss (unsichtbar statt entfernt), damit beim Blättern nichts springt.
 */
export default function StickyCheckoutBar({ children }: { children: React.ReactNode }) {
  const [summaryButtonVisible, setSummaryButtonVisible] = useState(false)

  useEffect(() => {
    const target = document.getElementById("cart-summary-checkout")
    if (!target || !("IntersectionObserver" in window)) return
    const observer = new IntersectionObserver(
      ([entry]) => setSummaryButtonVisible(entry.isIntersecting),
      // der untere Rand zählt nicht mit: Dort liegt die Leiste selbst
      { rootMargin: "0px 0px -80px 0px", threshold: 0.9 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={cn(
        "large:hidden sticky bottom-0 z-40 bg-white border-t border-stone-200 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]",
        summaryButtonVisible && "invisible"
      )}
      data-testid="cart-sticky-checkout"
    >
      {children}
    </div>
  )
}
