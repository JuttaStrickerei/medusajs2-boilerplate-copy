"use client"

import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"

type StripeWrapperProps = {
  /** Betrag des Warenkorbs in Euro (Medusa rechnet in der Hauptwährung: 168 = € 168,00) */
  amount: number
  currencyCode: string
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  amount,
  currencyCode,
  stripeKey,
  stripePromise,
  children,
}) => {
  const options: StripeElementsOptions = {
    // Ohne clientSecret: Die Zahlung (PaymentIntent) entsteht erst mit der
    // Zahlungssitzung, die der Knopf „Zahlungspflichtig bestellen“ verwendet. Bis dahin
    // kennt Stripe nur Betrag und Währung. Ändert sich der Betrag, gibt
    // react-stripe-js ihn an die Felder weiter (elements.update), ohne sie zu leeren.
    mode: "payment",
    // Stripe erwartet Cent. Der Shop rechnet nur in Euro.
    amount: Math.round(amount * 100),
    currency: currencyCode.toLowerCase(),
    appearance: {
      theme: "stripe",
      variables: {
        colorTextPlaceholder: "#d6d3d1",
      },
    },
    loader: "auto",
  }

  if (!stripeKey) {
    throw new Error("Stripe key is missing")
  }

  if (!stripePromise) {
    throw new Error("Stripe promise is missing")
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      {children}
    </Elements>
  )
}

export default StripeWrapper
