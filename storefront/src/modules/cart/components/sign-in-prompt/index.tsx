"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { User } from "@components/icons"

const SignInPrompt = () => {
  const pathname = usePathname()

  // Create redirect URL to return to cart after login (pathname already includes countryCode)
  const redirectUrl = pathname || "/cart"
  // LocalizedClientLink adds countryCode automatically, so we only need /account
  const loginUrl = `/account?redirect_url=${encodeURIComponent(redirectUrl)}`

  // Bewusst klein: Der Hinweis steht unter den Artikeln und soll den Weg zur Kasse nicht verstellen
  return (
    <div className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-stone-200 px-5 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <User size={18} className="text-stone-500 flex-shrink-0" />
        <p className="text-sm text-stone-600">Sie haben schon ein Kundenkonto?</p>
      </div>
      <LocalizedClientLink
        href={loginUrl}
        className="text-sm font-medium text-stone-800 underline whitespace-nowrap"
        data-testid="sign-in-button"
      >
        Anmelden
      </LocalizedClientLink>
    </div>
  )
}

export default SignInPrompt
