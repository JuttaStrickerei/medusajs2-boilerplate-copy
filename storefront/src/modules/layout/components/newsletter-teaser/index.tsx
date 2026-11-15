"use client"

import {
  isNewsletterTeaserHandled,
  markNewsletterTeaserHandled,
  useNewsletterSignup,
} from "@lib/hooks/use-newsletter-signup"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { X } from "@components/icons"
import { cn } from "@lib/utils"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * Hinweis „10 % auf Ihre erste Bestellung“. Die Regel:
 *
 * - Wer: Besucherinnen ohne Anmeldung. Angemeldete Kundinnen sehen ihn nicht.
 * - Wo: Startseite, Kollektion, Looks, Produktseiten und Infoseiten, am Handy und am
 *   Computer. Nicht im Warenkorb, in der Kasse, im Konto und auf Rechtstexten.
 * - Wann: frühestens 12 Sekunden nach dem ersten Seitenaufruf (auf Produktseiten 30
 *   Sekunden: Dort schaut sich jemand gerade ein Stück an), erst wenn die Cookie-Frage
 *   beantwortet ist und erst, wenn jemand ein Stück nach unten gegangen ist. So liegt
 *   die Karte nie über dem ersten Bild einer Seite (Titel, Knopf „Looks entdecken“).
 * - Wie oft: einmal pro Besuch. Nach dem Schließen oder nach der Anmeldung kommt er
 *   nicht wieder, auch nicht nach dem Neuladen.
 * - Wie: kleine Karte am unteren Rand, kein Fenster über der ganzen Seite. Der Code
 *   kommt per E-Mail, er steht nirgends auf der Seite.
 */
const SHOW_AFTER_MS = 12_000
const SHOW_AFTER_MS_PRODUCT = 30_000
const MIN_SCROLL_PX = 400
const CHECK_EVERY_MS = 1_000
const HIDDEN_ON =
  /\/(cart|checkout|account|privacy|terms|imprint|agb|impressum|vertrag-widerrufen|order)(\/|$)/

// Zeitpunkt des ersten Seitenaufrufs: Die 12 Sekunden laufen über Seitenwechsel weiter
const firstSeen = Date.now()

export default function NewsletterTeaser({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const { email, setEmail, loading, status, message, submit } = useNewsletterSignup()
  const hidden = isLoggedIn || HIDDEN_ON.test(pathname || "")
  // Am Handy liegt auf Produktseiten die Kaufleiste am unteren Rand
  const aboveBuyBar = /\/products\//.test(pathname || "")

  useEffect(() => {
    if (hidden || isNewsletterTeaserHandled()) return

    // Einmal pro Sekunde nachsehen, ob alle Bedingungen erfüllt sind
    const timer = setInterval(() => {
      if (isNewsletterTeaserHandled()) {
        clearInterval(timer)
        return
      }
      const waitedLongEnough =
        Date.now() - firstSeen >= (aboveBuyBar ? SHOW_AFTER_MS_PRODUCT : SHOW_AFTER_MS)
      // Nicht gleichzeitig mit der Cookie-Frage: erst zeigen, wenn sie beantwortet ist
      const cookieAnswered = document.cookie.includes("cc_cookie=")
      // Kurze Seiten lassen sich nicht weit genug nach unten schieben
      const pageIsShort =
        document.documentElement.scrollHeight - window.innerHeight < MIN_SCROLL_PX
      const scrolled = window.scrollY >= MIN_SCROLL_PX || pageIsShort
      if (waitedLongEnough && cookieAnswered && scrolled) {
        clearInterval(timer)
        setOpen(true)
      }
    }, CHECK_EVERY_MS)
    return () => clearInterval(timer)
  }, [hidden, aboveBuyBar])

  const close = () => {
    markNewsletterTeaserHandled("geschlossen")
    setOpen(false)
  }

  // sanft einblenden, mit Esc schließen
  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const frame = requestAnimationFrame(() => setVisible(true))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!open || hidden) return null

  const done = status === "success" || status === "already_subscribed"

  return (
    <div
      className={cn(
        "fixed z-30 inset-x-3 small:inset-x-auto small:right-6 small:bottom-6 small:w-[380px]",
        aboveBuyBar ? "bottom-28 small:bottom-6" : "bottom-3",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
      role="complementary"
      aria-label="Newsletter"
      data-testid="newsletter-teaser"
    >
      <div className="relative bg-white rounded-2xl border border-stone-200 shadow-xl p-5">
        <button
          type="button"
          onClick={close}
          className="absolute top-1.5 right-1.5 w-11 h-11 flex items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100"
          aria-label="Hinweis schließen"
          data-testid="newsletter-teaser-close"
        >
          <X size={22} />
        </button>

        <p className="font-serif lining-nums text-xl font-medium leading-tight text-stone-800 pr-10">
          10 % auf Ihre erste Bestellung
        </p>

        {done ? (
          <p className="mt-2 text-sm text-stone-700" role="status">
            {message}
          </p>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
              Abonnieren Sie unseren Newsletter. Ihren persönlichen Gutscheincode
              senden wir Ihnen per E-Mail.
            </p>
            <form onSubmit={submit} className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder="Ihre E-Mail-Adresse"
                aria-label="E-Mail-Adresse für den Newsletter"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="flex-1 min-w-0 h-11 px-3 text-base small:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-4 text-sm font-medium rounded-lg bg-stone-800 text-white hover:bg-stone-900 disabled:opacity-50"
              >
                {loading ? "…" : "Abonnieren"}
              </button>
            </form>
            {status === "error" && (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {message}
              </p>
            )}
            <p className="mt-2 text-xs text-stone-500">
              Es gilt unsere{" "}
              <LocalizedClientLink href="/privacy" className="underline">
                Datenschutzerklärung
              </LocalizedClientLink>
              . Abmelden jederzeit möglich.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
