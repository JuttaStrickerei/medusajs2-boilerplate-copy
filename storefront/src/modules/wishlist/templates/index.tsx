"use client"

import { useState, useEffect } from "react"
import { checkIsAuthenticated } from "@lib/data/wishlist"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { Heart, ArrowRight, User } from "@components/icons"
import WishlistContent from "@modules/wishlist/components/wishlist-content"

export default function WishlistTemplate() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    checkIsAuthenticated().then(setIsLoggedIn)
  }, [])

  if (isLoggedIn === null) {
    return (
      <div className="py-12">
        <div className="content-container">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-stone-200 rounded w-48" />
            <div className="h-6 bg-stone-100 rounded w-72" />
          </div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="py-12">
        <div className="content-container">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
              <Heart size={36} className="text-stone-400" />
            </div>
            <h1 className="font-serif text-2xl small:text-3xl font-medium text-stone-800 mb-3">
              Wunschliste
            </h1>
            <p className="text-stone-500 mb-8">
              Melden Sie sich an, um Ihre Lieblingsprodukte zu speichern und
              jederzeit darauf zugreifen zu können.
            </p>
            <div className="flex flex-col small:flex-row gap-3 justify-center">
              <LocalizedClientLink href="/account">
                <Button leftIcon={<User size={18} />}>
                  Anmelden
                </Button>
              </LocalizedClientLink>
              <LocalizedClientLink href="/store">
                <Button variant="secondary">
                  Weiter shoppen
                  <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="content-container">
        <div className="mb-8">
          <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-2">
            Wunschliste
          </h1>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
          <WishlistContent />
        </div>
        <div className="mt-8 text-center">
          <LocalizedClientLink href="/store">
            <Button variant="secondary">
              Weiter shoppen
            </Button>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
