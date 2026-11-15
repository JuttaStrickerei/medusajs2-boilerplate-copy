"use client"

import { Button } from "@medusajs/ui"
import { ArrowRight } from "@components/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type CheckoutButtonProps = {
  cart: HttpTypes.StoreCart
  step?: string
  isAuthenticated?: boolean
  className?: string
  "data-testid"?: string
}

export default function CheckoutButton({
  step,
  className = "w-full h-12 text-base",
  "data-testid": dataTestId = "checkout-button",
}: CheckoutButtonProps) {
  // Direkt in die Kasse, ohne Zwischenfenster „Anmelden oder als Gast?“: Die meisten
  // bestellen zum ersten Mal. Wer ein Konto hat, meldet sich im Warenkorb oder im
  // ersten Kassenschritt an (Link „Mit Kundenkonto anmelden“).
  // LocalizedClientLink adds countryCode automatically, so we only need /checkout
  const checkoutUrl = step ? `/checkout?step=${step}` : `/checkout`

  return (
    <LocalizedClientLink href={checkoutUrl} className="block">
      <Button className={className} data-testid={dataTestId}>
        Zur Kasse
        <ArrowRight size={18} className="ml-2" />
      </Button>
    </LocalizedClientLink>
  )
}
