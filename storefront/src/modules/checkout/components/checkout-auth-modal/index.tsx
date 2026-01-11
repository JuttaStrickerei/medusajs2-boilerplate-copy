"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@medusajs/ui"
import { User, ShoppingBag, X } from "@components/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CheckoutAuthModalProps = {
  isOpen: boolean
  onClose: () => void
  step?: string
}

export default function CheckoutAuthModal({ 
  isOpen, 
  onClose,
  step 
}: CheckoutAuthModalProps) {
  const router = useRouter()
  const { countryCode } = useParams()

  if (!isOpen) return null

  const handleLogin = () => {
    // Redirect to login with return URL
    const checkoutUrl = step
      ? `/${countryCode}/checkout?step=${step}`
      : `/${countryCode}/checkout`
    const loginUrl = `/${countryCode}/account?redirect_url=${encodeURIComponent(checkoutUrl)}`
    router.push(loginUrl)
  }

  const handleGuestCheckout = () => {
    // Proceed to checkout as guest
    // router.push needs full path with countryCode
    const checkoutUrl = step
      ? `/${countryCode}/checkout?step=${step}`
      : `/${countryCode}/checkout`
    router.push(checkoutUrl)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-3 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-lg transition-colors z-10"
          aria-label="Schließen"
        >
          <X size={20} className="text-stone-600" />
        </button>

        {/* Options */}
        <div className="space-y-3 pt-8">
          {/* Login Option */}
          <button
            onClick={handleLogin}
            className="w-full p-4 border-2 border-stone-200 rounded-lg hover:border-stone-800 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                <User size={24} className="text-stone-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-stone-800">
                  Anmelden
                </h3>
              </div>
            </div>
          </button>

          {/* Guest Checkout Option */}
          <button
            onClick={handleGuestCheckout}
            className="w-full p-4 border-2 border-stone-200 rounded-lg hover:border-stone-800 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                <ShoppingBag size={24} className="text-stone-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-stone-800">
                  Als Gast fortfahren
                </h3>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
