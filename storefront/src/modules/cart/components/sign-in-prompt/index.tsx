"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { User } from "@components/icons"

const SignInPrompt = () => {
  const pathname = usePathname()
  
  // Create redirect URL to return to cart after login (pathname already includes countryCode)
  const redirectUrl = pathname || "/cart"
  // LocalizedClientLink adds countryCode automatically, so we only need /account
  const loginUrl = `/account?redirect_url=${encodeURIComponent(redirectUrl)}`

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
          <User size={24} className="text-stone-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-stone-800">
            Sie haben bereits ein Konto?
          </h3>
          <p className="text-sm text-stone-500 mt-0.5">
            Melden Sie sich an für ein besseres Einkaufserlebnis
          </p>
        </div>
        <LocalizedClientLink href={loginUrl}>
          <Button variant="secondary" data-testid="sign-in-button">
            Anmelden
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
