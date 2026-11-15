"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Tag, X } from "@components/icons"
import { cn } from "@lib/utils"
import { markNewsletterTeaserHandled } from "@lib/hooks/use-newsletter-signup"
import {
  VOUCHER_PARAM,
  isVoucherCode,
  savePendingVoucher,
} from "@lib/util/pending-voucher"

const SHOW_FOR_MS = 9_000

/**
 * Liest einen Gutschein aus der Adresse (?gutschein=CODE), merkt ihn vor und sagt
 * es der Kundin einmal kurz. Eingelöst wird er im Warenkorb (discount-code).
 * Die Seite bleibt dabei statisch: gelesen wird erst im Browser.
 */
export default function VoucherLink() {
  const pathname = usePathname() || ""
  const [code, setCode] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const value = url.searchParams.get(VOUCHER_PARAM)
    if (!isVoucherCode(value)) return

    savePendingVoucher(value)
    // Wer mit einem Gutschein kommt, ist schon angemeldet: kein Newsletter-Hinweis
    markNewsletterTeaserHandled("angemeldet")
    // Der Code soll beim Teilen oder Neuladen der Seite nicht mitgehen
    url.searchParams.delete(VOUCHER_PARAM)
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search + url.hash
    )
    setCode(value.trim())
  }, [])

  useEffect(() => {
    if (!code) return
    const show = window.setTimeout(() => setVisible(true), 50)
    const hide = window.setTimeout(() => setVisible(false), SHOW_FOR_MS)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [code])

  if (!code) return null

  // Auf der Produktseite sitzt am Handy unten die Kaufleiste
  const aboveBuyBar = /\/products\//.test(pathname)

  return (
    <div
      className={cn(
        "fixed z-30 inset-x-3 small:inset-x-auto small:right-6 small:bottom-6 small:w-[380px]",
        aboveBuyBar ? "bottom-28 small:bottom-6" : "bottom-3",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        visible
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-3"
      )}
      role="status"
      data-testid="voucher-notice"
    >
      <div className="relative flex items-start gap-3 bg-white rounded-2xl border border-green-200 shadow-xl p-4 pr-12">
        <Tag size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-800">
            Ihr Gutschein ist vorgemerkt
          </p>
          <p className="mt-0.5 text-sm text-stone-600">
            Wir ziehen ihn im Warenkorb von selbst ab:{" "}
            <span className="font-medium text-stone-800 whitespace-nowrap">{code}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100"
          aria-label="Hinweis schließen"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
