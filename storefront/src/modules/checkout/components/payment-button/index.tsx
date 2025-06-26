"use client"

import { isStripe } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { useParams } from "next/navigation"
import React, { useEffect, useState, useCallback } from "react"
import ErrorMessage from "../error-message"

/**
 * @name PaymentButton
 * @description A client component that renders the appropriate payment button
 * based on the cart's payment session. It serves as a controller to delegate
 * rendering to the specific payment provider's component.
 */
const PaymentButton: React.FC<{
  cart: HttpTypes.StoreCart
  "data-testid": string
}> = ({ cart, "data-testid": dataTestId }) => {
  // Determine if the checkout is ready for payment submission.
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  // Render the Stripe button if the payment provider is Stripe-based.
  if (isStripe(paymentSession?.provider_id)) {
    return (
      <StripePaymentButton
        notReady={notReady}
        cart={cart}
        data-testid={dataTestId}
      />
    )
  }

  // Fallback for when no supported payment method is available.
  return (
    <Button disabled data-testid="submit-order-button">
      Select a payment method
    </Button>
  )
}

/**
 * @name StripePaymentButton
 * @description A component that handles the entire payment flow for Stripe,
 * including credit cards, PayPal, Klarna, and other methods configured in Stripe.
 * It uses the `redirect: 'if_required'` strategy to seamlessly handle both
 * on-site and off-site payment authentications.
 */
const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { countryCode } = useParams()

  const stripe = useStripe()
  const elements = useElements()
  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  // A memoized function to handle order completion.
  const onPaymentCompleted = useCallback(async () => {
    await placeOrder().catch((err) => {
      setErrorMessage(err.message)
    }).finally(() => {
      // Ensure the submitting state is always reset.
      setSubmitting(false)
    })
  }, [setErrorMessage, setSubmitting])

  /**
   * @description Handles the payment submission process. This function is triggered
   * when the user clicks the 'Place Order' button. It confirms the payment with
   * Stripe and handles the outcome, including redirects for off-site payments.
   */
  const handlePayment = async () => {
    // Abort if Stripe.js has not loaded or the cart is not ready.
    if (!stripe || !elements || !cart || !paymentSession || notReady) {
      return
    }

    setSubmitting(true)

    const clientSecret = paymentSession.data.client_secret as string

    // The `return_url` is crucial for redirect-based payment methods.
    // It points to a dedicated API route that will complete the order on the server.
    const returnUrl = `${window.location.origin}/api/capture-payment/${cart.id}?country_code=${countryCode}`

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: returnUrl,
      },
      // This setting is key to a unified flow. Stripe will only redirect the user
      // if the selected payment method (e.g., PayPal) requires it.
      redirect: "if_required",
    })

    // If `confirmPayment` resolves without an error, it means no redirect occurred.
    // This could be a successful on-site payment (like a card) or a client-side error.
    setSubmitting(false)

    if (error) {
      // Display any errors that occurred during the payment confirmation process.
      setErrorMessage(error.message ?? "An unknown error occurred")
      return
    }

    // If no error and no redirect, the on-site payment was successful.
    // We can now finalize the order on the client side.
    await onPaymentCompleted()
  }

  // This effect listens for changes in the cart's payment status. It's a fallback
  // mechanism to complete the order if the cart becomes authorized through a
  // backend process, such as a webhook after a successful redirect.
  useEffect(() => {
    if (cart.payment_collection?.status === "authorized") {
      onPaymentCompleted()
    }
  }, [cart, onPaymentCompleted])

  return (
    <>
      <Button
        disabled={notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

export default PaymentButton