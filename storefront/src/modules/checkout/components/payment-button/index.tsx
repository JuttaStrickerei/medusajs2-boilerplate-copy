"use client"

import { isStripe, isManual } from "@lib/constants"
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
  onPlacingOrder?: () => void
  onPaymentError?: () => void
}> = ({ cart, "data-testid": dataTestId, onPlacingOrder, onPaymentError }) => {
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
        onPlacingOrder={onPlacingOrder}
        onPaymentError={onPaymentError}
        data-testid={dataTestId}
      />
    )
  }

  // Render the Manual Test Payment button
  if (isManual(paymentSession?.provider_id)) {
    return (
      <ManualTestPaymentButton
        notReady={notReady}
        onPlacingOrder={onPlacingOrder}
        onPaymentError={onPaymentError}
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
  onPlacingOrder,
  onPaymentError,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  onPlacingOrder?: () => void
  onPaymentError?: () => void
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
    try {
      await placeOrder()
    } catch (err: unknown) {
      // NEXT_REDIRECT: keep loading until redirect completes
      if (
        err &&
        typeof err === "object" &&
        (err as { digest?: string }).digest === "NEXT_REDIRECT"
      ) {
        return
      }
      setErrorMessage(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
      )
      setSubmitting(false)
      // Reset the parent's full-page overlay so the user sees the error and can retry.
      onPaymentError?.()
    }
  }, [onPaymentError])

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
    // For off-site payments (PayPal, etc.), redirect to a loading page that
    // completes the cart client-side and shows a graceful loading state.
    const returnUrl = `${window.location.origin}/${countryCode}/complete-payment?cart_id=${cart.id}&country_code=${countryCode}`

    const paymentElement = elements.getElement("payment")
    if (!paymentElement) {
      console.error("PaymentElement not mounted")
      setErrorMessage(
        "Zahlungselement ist nicht verfügbar. Bitte zurück zur Zahlungsseite."
      )
      setSubmitting(false)
      return
    }

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

    if (error) {
      // Card declined, validation failed, or any other Stripe-side error.
      // Do NOT show the parent's full-page overlay – the button is still mounted
      // so the user sees the error inline and can retry with a different card.
      setSubmitting(false)
      setErrorMessage(error.message ?? "An unknown error occurred")
      return
    }

    // Payment succeeded on-site (no redirect). Now show the parent's full-page
    // overlay while we finalize the order on the server.
    onPlacingOrder?.()
    // Do NOT reset submitting here – keep loading until redirect completes.
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
        Bestellung abgeben
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

/**
 * @name ManualTestPaymentButton
 * @description A simple button for manual/test payments
 */
const ManualTestPaymentButton = ({
  notReady,
  onPlacingOrder,
  onPaymentError,
  "data-testid": dataTestId,
}: {
  notReady: boolean
  onPlacingOrder?: () => void
  onPaymentError?: () => void
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    try {
      await placeOrder()
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        (err as { digest?: string }).digest === "NEXT_REDIRECT"
      ) {
        return
      }
      setErrorMessage(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
      )
      setSubmitting(false)
      // Reset the parent's full-page overlay so the user sees the error and can retry.
      onPaymentError?.()
    }
  }

  const handlePayment = () => {
    setSubmitting(true)
    // Notify parent immediately so it can lock the UI against stale re-renders.
    onPlacingOrder?.()
    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        Bestellung abgeben
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
