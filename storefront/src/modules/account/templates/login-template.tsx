"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowLeft } from "@components/icons"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

type LoginTemplateProps = {
  redirectUrl?: string
}

const LoginTemplate = ({ redirectUrl }: LoginTemplateProps) => {
  const [currentView, setCurrentView] = useState("sign-in")
  const { countryCode } = useParams()

  // Normalize redirectUrl: remove countryCode if present, so LocalizedClientLink can add it
  const normalizedRedirectUrl = useMemo(() => {
    if (!redirectUrl) return "/"
    
    // If redirectUrl starts with /{countryCode}/, remove the countryCode part
    const countryCodePattern = new RegExp(`^/${countryCode}/`)
    if (countryCodePattern.test(redirectUrl)) {
      return redirectUrl.replace(countryCodePattern, "/")
    }
    
    // If it's already a relative path (starts with /), use it as is
    if (redirectUrl.startsWith("/")) {
      return redirectUrl
    }
    
    return "/"
  }, [redirectUrl, countryCode])

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="content-container py-4 flex items-center justify-between">
          <LocalizedClientLink
            href={normalizedRedirectUrl}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Zurück zum Shop</span>
          </LocalizedClientLink>
          <LocalizedClientLink href="/" className="text-center">
            <span className="font-serif text-xl font-medium text-stone-800">
              Strickerei Jutta
            </span>
          </LocalizedClientLink>
          <div className="w-32" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {currentView === "sign-in" ? (
            <Login setCurrentView={setCurrentView} redirectUrl={redirectUrl} />
          ) : (
            <Register setCurrentView={setCurrentView} />
          )}
        </div>
      </main>
    </div>
  )
}

export default LoginTemplate
