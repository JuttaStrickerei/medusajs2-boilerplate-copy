"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import StripeWrapper from "./stripe-wrapper"
import { createContext } from "react"
import { HttpTypes } from "@medusajs/types"

type WrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

export const StripeContext = createContext(false)

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

const Wrapper: React.FC<WrapperProps> = ({ cart, children }) => {
  // Die Stripe-Felder hängen am Betrag des Warenkorbs, nicht an einer
  // Zahlungssitzung (siehe stripe-wrapper.tsx). Medusa löscht die Sitzung bei
  // jeder Betragsänderung (Gutschein, Menge, Versand); so bleiben die
  // eingegebenen Zahlungsdaten trotzdem stehen.
  const total = cart.total ?? 0

  if (stripePromise && total > 0 && cart.currency_code) {
    return (
      <StripeContext.Provider value={true}>
        <StripeWrapper
          amount={total}
          currencyCode={cart.currency_code}
          stripeKey={stripeKey}
          stripePromise={stripePromise}
        >
          {children}
        </StripeWrapper>
      </StripeContext.Provider>
    )
  }

  return <div>{children}</div>
}

export default Wrapper
