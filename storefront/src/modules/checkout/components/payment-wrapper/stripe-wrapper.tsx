"use client"

import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
}) => {
  const t = useTranslations("checkout.stripeWrapper")
  // Update the options to include payment_method_types
  const options: StripeElementsOptions = {
    clientSecret: paymentSession!.data?.client_secret as string | undefined,
    appearance: {
      // Customize as needed
      theme: "stripe",
    },
    // This allows the widget to show multiple payment methods
    loader: "auto",
  }

  if (!stripeKey) {
    throw new Error(t("stripeKeyMissing"))
  }

  if (!stripePromise) {
    throw new Error(t("stripePromiseMissing"))
  }

  if (!paymentSession?.data?.client_secret) {
    throw new Error(t("stripeClientSecretMissing"))
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      {children}
    </Elements>
  )
}

export default StripeWrapper