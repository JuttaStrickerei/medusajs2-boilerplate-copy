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
    // Feldnamen, Fehlermeldungen und die Wallet-Hinweise von Stripe auf Deutsch,
    // unabhängig von der Browsersprache
    locale: "de",
    // Wie die übrigen Felder der Kasse (Tailwind „stone“, rounded-md). Die
    // Schrift Inter liegt im Shop selbst, im Stripe-iframe greift die
    // Systemschrift. Der Platzhalter bleibt bewusst hellgrau.
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#292524",
        colorText: "#292524",
        colorTextSecondary: "#57534e",
        colorTextPlaceholder: "#d6d3d1",
        colorDanger: "#f43f5e",
        colorBackground: "#ffffff",
        fontFamily:
          'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        borderRadius: "6px",
      },
    },
    loader: "auto",
    // Apple Pay und Google Pay zeigt das Payment Element von selbst, wenn sie
    // im Stripe-Dashboard aktiv sind, die Domain dort registriert ist und das
    // Gerät sie kann. Keine paymentMethodTypes setzen (ab Stripe.js „Endive“
    // ein Fehler); welche Arten erscheinen, steuert allein das Dashboard.
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
