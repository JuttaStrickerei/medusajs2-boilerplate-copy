"use client"

import { useState } from "react"
import { Button } from "@medusajs/ui"
import { ArrowRight } from "@components/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CheckoutAuthModal from "../checkout-auth-modal"
import { HttpTypes } from "@medusajs/types"

type CheckoutButtonProps = {
  cart: HttpTypes.StoreCart
  step?: string
  isAuthenticated?: boolean
  className?: string
  "data-testid"?: string
}

export default function CheckoutButton({ 
  cart, 
  step,
  isAuthenticated = false,
  className = "w-full h-12 text-base",
  "data-testid": dataTestId = "checkout-button"
}: CheckoutButtonProps) {
  const [showModal, setShowModal] = useState(false)

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowModal(true)
  }

  // If authenticated, show normal checkout button
  // LocalizedClientLink adds countryCode automatically, so we only need /checkout
  if (isAuthenticated) {
    const checkoutUrl = step 
      ? `/checkout?step=${step}`
      : `/checkout`
    
    return (
      <LocalizedClientLink href={checkoutUrl} className="block">
        <Button className={className} data-testid={dataTestId}>
          Zur Kasse
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </LocalizedClientLink>
    )
  }

  // If not authenticated, show button that opens modal
  return (
    <>
      <Button 
        className={className} 
        onClick={handleCheckoutClick}
        data-testid={dataTestId}
      >
        Zur Kasse
        <ArrowRight size={18} className="ml-2" />
      </Button>
      <CheckoutAuthModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        step={step}
      />
    </>
  )
}
