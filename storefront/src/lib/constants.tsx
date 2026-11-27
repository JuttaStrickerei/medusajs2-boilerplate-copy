import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Kreditkarte",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_system_default: {
    title: "Manuelle Zahlung",
    icon: <CreditCard />,
  },
  // Add more payment providers here

  // Zahlungsarten im Stripe Payment Element (event.value.type im Schritt
  // „Zahlung“). Alle laufen über denselben Provider pp_stripe_stripe.
  card: {
    title: "Kreditkarte",
    icon: <CreditCard />,
  },
  apple_pay: {
    title: "Apple Pay",
    icon: <CreditCard />,
  },
  google_pay: {
    title: "Google Pay",
    icon: <CreditCard />,
  },
  klarna: {
    title: "Klarna",
    icon: <CreditCard />,
  },
  paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  link: {
    title: "Link",
    icon: <CreditCard />,
  },
}

/** Wallets öffnen ihr eigenes Fenster, das die Kundin auch schließen kann */
export const isWalletPaymentType = (type?: string) =>
  type === "apple_pay" || type === "google_pay"

// This only checks if it is native stripe for card payments, it ignores the other stripe-based providers
export const isStripe = (providerId?: string) => {
  return providerId?.startsWith("pp_stripe_")
}
export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
