"use client"

import { useNewsletterSignup } from "@lib/hooks/use-newsletter-signup"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { cn } from "@lib/utils"
import { useParams, usePathname } from "next/navigation"

/**
 * Newsletter-Anmeldung in der Fußzeile, bewusst schmal. Auf der Startseite steht
 * stattdessen der große Abschnitt (modules/home/components/newsletter-form), im
 * Warenkorb und im Konto lenkt sie nur ab.
 */
const NewsletterForm = () => {
  const pathname = usePathname() || ""
  const { countryCode } = useParams()
  const { email, setEmail, loading, status, message, signupUrl, submit } = useNewsletterSignup()

  if (pathname === `/${countryCode}` || /\/(cart|account)(\/|$)/.test(pathname)) return null

  return (
    <div className="border-t border-stone-700" data-testid="footer-newsletter">
      <div className="content-container py-7">
        <div className="flex flex-col small:flex-row small:items-center small:justify-between gap-4 small:gap-12">
          <div>
            {/* eigene Größe, sonst greift die globale Überschriften-Größe */}
            <h2 className="font-serif lining-nums text-xl font-medium leading-tight tracking-normal text-white">
              10 % auf Ihre erste Bestellung
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              Neu bei unserem Newsletter? Dann senden wir Ihnen Ihren persönlichen Gutscheincode per E‑Mail.
            </p>
          </div>

          <div className="small:w-[440px] small:flex-shrink-0">
            {status !== "idle" && (
              <p
                className={cn(
                  "mb-2 text-sm px-3 py-2 rounded-lg",
                  status === "error"
                    ? "bg-red-50 text-red-800"
                    : status === "not_subscribed"
                      ? "bg-stone-100 text-stone-800"
                      : "bg-green-50 text-green-800"
                )}
                role="status"
              >
                {message}
                {status === "not_subscribed" && signupUrl && (
                  <>
                    {" "}
                    <a href={signupUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                      Wieder anmelden
                    </a>
                  </>
                )}
              </p>
            )}

            <form onSubmit={submit} className="flex gap-2">
              <input
                type="email"
                placeholder="Ihre E-Mail-Adresse"
                aria-label="E-Mail-Adresse für den Newsletter"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="flex-1 min-w-0 h-11 px-4 text-base small:text-sm rounded-lg bg-stone-700 border border-stone-600 text-white placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-4 rounded-lg bg-white text-stone-800 text-sm font-medium hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                {loading ? "…" : "Abonnieren"}
              </button>
            </form>

            <p className="mt-2 text-xs text-stone-500">
              Der Code gilt 30 Tage. Es gilt unsere{" "}
              <LocalizedClientLink href="/privacy" className="underline hover:text-white">
                Datenschutzerklärung
              </LocalizedClientLink>
              , Abmelden jederzeit möglich.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsletterForm
