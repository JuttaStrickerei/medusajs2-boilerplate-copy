"use client"

import {
  isStripe,
  isManual,
  isWalletPaymentType,
  paymentInfoMap,
} from "@lib/constants"
import { initiatePaymentSession, placeOrder } from "@lib/data/cart"
import { saveMetaAttribution } from "@lib/data/meta-attribution"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { useParams, usePathname, useRouter } from "next/navigation"
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react"
import ErrorMessage from "../error-message"
import { StripeContext } from "../payment-wrapper"
import { isRedirectError } from "next/dist/client/components/redirect-error"

// Meta attribution (lib/data/meta-attribution.ts) is saved right before the
// payment; the payment never waits longer than this for it
const ATTRIBUTION_TIMEOUT_MS = 2000

const saveAttributionBriefly = () =>
  Promise.race([
    saveMetaAttribution(),
    new Promise<void>((resolve) => setTimeout(resolve, ATTRIBUTION_TIMEOUT_MS)),
  ]).catch(() => undefined)

const PAYMENT_FAILED_MESSAGE =
  "Die Zahlung ist leider nicht durchgegangen. Bitte versuchen Sie es noch einmal oder wählen Sie eine andere Zahlungsart."

/**
 * Stripe-Fehler für die Kundin. Mit locale „de“ (stripe-wrapper.tsx) sind
 * Karten- und Eingabefehler schon deutsch; technische Fehler (API, Netz)
 * kommen auf Englisch und ohne Nutzen für die Kundin, darum ersetzen wir sie.
 */
const customerPaymentError = (error: { type?: string; message?: string }) =>
  (error.type === "card_error" || error.type === "validation_error") &&
  error.message
    ? error.message
    : PAYMENT_FAILED_MESSAGE

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
  onOrderFailed?: () => void
}> = ({
  cart,
  "data-testid": dataTestId,
  onPlacingOrder,
  onPaymentError,
  onOrderFailed,
}) => {
  // Determine if the checkout is ready for payment submission.
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]
  const stripeReady = useContext(StripeContext)

  // Render the Stripe button if the payment provider is Stripe-based. Without a
  // session (Medusa deletes it whenever the total changes) the Stripe fields
  // still hold the payment details, and the button creates the session on click.
  if (stripeReady && (isStripe(paymentSession?.provider_id) || !paymentSession)) {
    return (
      <StripePaymentButton
        notReady={notReady}
        cart={cart}
        onPlacingOrder={onPlacingOrder}
        onOrderFailed={onOrderFailed}
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

  // Keine Zahlungssitzung (mehr): zurück zur Zahlungsart statt eines toten Knopfes.
  return <PaymentSessionMissing />
}

/**
 * Medusa löscht die Zahlungssitzung, sobald sich der Betrag ändert (Gutschein
 * eingelöst oder entfernt, Menge oder Versand geändert). Im Schritt „Zahlung“
 * entsteht sie neu, deshalb führt der Knopf dorthin zurück.
 */
const PaymentSessionMissing = () => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="space-y-3" data-testid="payment-session-missing">
      <p className="text-sm text-stone-600">
        Ihr Betrag hat sich geändert. Bitte bestätigen Sie Ihre Zahlungsart noch
        einmal, dann können Sie die Bestellung abgeben.
      </p>
      <Button
        size="large"
        onClick={() => router.push(`${pathname}?step=payment`, { scroll: false })}
        data-testid="back-to-payment-button"
      >
        Zur Zahlungsart
      </Button>
    </div>
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
  onOrderFailed,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  onPlacingOrder?: () => void
  onOrderFailed?: () => void
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { countryCode } = useParams()

  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const pathname = usePathname()
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (session) => session.status === "pending"
  )

  // Sperrt einen zweiten Klick, bevor React den Ladezustand gezeichnet hat
  const paymentInFlight = useRef(false)
  // Die im Payment Element gewählte Art (card, apple_pay, google_pay, …).
  // Das Element bleibt im Schritt „Übersicht“ unsichtbar gemountet.
  const selectedTypeRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const paymentElement = elements?.getElement("payment")
    if (!paymentElement) {
      return
    }
    const onChange = (event: { value?: { type?: string } }) => {
      selectedTypeRef.current = event.value?.type
    }
    paymentElement.on("change", onChange)
    return () => {
      paymentElement.off("change", onChange)
    }
  }, [elements])

  // A memoized function to handle order completion.
  // It only runs after Stripe has taken the payment (capture: true), so a
  // failure here means "charged, but no order yet". Review shows the message
  // and the retry, because this button is already unmounted by its overlay.
  const onPaymentCompleted = useCallback(async () => {
    try {
      const result = await placeOrder()
      if (result?.error) {
        console.error("Order could not be placed after payment:", result.error)
        onOrderFailed?.()
      }
    } catch (err: unknown) {
      // NEXT_REDIRECT: keep loading until redirect completes
      if (isRedirectError(err)) {
        return
      }
      console.error("Order could not be placed after payment:", err)
      onOrderFailed?.()
    }
  }, [onOrderFailed])

  /**
   * @description Handles the payment submission process. This function is triggered
   * when the user clicks the 'Place Order' button. It confirms the payment with
   * Stripe and handles the outcome, including redirects for off-site payments.
   */
  const handlePayment = async () => {
    // Abort if Stripe.js has not loaded, the cart is not ready, or a payment
    // is already running (double click / double tap).
    if (!stripe || !elements || !cart || notReady || paymentInFlight.current) {
      return
    }
    paymentInFlight.current = true

    const stopSubmitting = () => {
      paymentInFlight.current = false
      setSubmitting(false)
    }

    const selectedType = selectedTypeRef.current
    const isWallet = isWalletPaymentType(selectedType)

    // elements.submit() MUSS der erste Aufruf nach dem Klick sein, vor jedem
    // await: Bei Apple Pay und Google Pay öffnet er das Wallet-Fenster, und
    // Apple lässt das nur direkt aus dem Klick heraus zu. Damit ist dieser
    // Klick auf „Zahlungspflichtig bestellen“ auch der, der die Zahlung auslöst.
    const submitPromise = elements.submit()
    // Läuft parallel, während das Wallet-Fenster offen ist (vorher: danach)
    const attributionPromise = saveAttributionBriefly()

    setSubmitting(true)
    setErrorMessage(null)

    const { error: submitError } = await submitPromise
    if (submitError) {
      stopSubmitting()
      if (isWallet) {
        // Meist hat die Kundin das Wallet-Fenster geschlossen. Die Daten sind
        // nicht verloren, sie kann einfach noch einmal klicken.
        setErrorMessage(
          `Die Zahlung mit ${
            paymentInfoMap[selectedType as string]?.title ?? "dem Wallet"
          } wurde nicht abgeschlossen. Sie können es noch einmal versuchen oder im Schritt „Zahlung“ eine andere Zahlungsart wählen.`
        )
        return
      }
      // Felder unvollständig, z. B. nach einem Neuladen der Seite: zurück zum
      // Schritt „Zahlung“, wo sie sichtbar sind.
      setErrorMessage(
        "Bitte geben Sie Ihre Zahlungsdaten im Schritt „Zahlung“ noch einmal ein."
      )
      router.push(`${pathname}?step=payment`, { scroll: false })
      return
    }

    // The payment session for the current total. Medusa deletes it whenever the
    // total changes (voucher, quantity, shipping), so create it again if needed.
    let clientSecret = paymentSession?.data?.client_secret as string | undefined
    if (!clientSecret) {
      try {
        const response = await initiatePaymentSession(cart, {
          provider_id: "pp_stripe_stripe",
        })
        clientSecret = response?.payment_collection?.payment_sessions?.find(
          (session) => session.status === "pending"
        )?.data?.client_secret as string | undefined
      } catch (err) {
        console.error("Payment session could not be created:", err)
      }
    }
    if (!clientSecret) {
      stopSubmitting()
      setErrorMessage(
        "Die Zahlung konnte nicht vorbereitet werden. Bitte versuchen Sie es noch einmal."
      )
      return
    }

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
      stopSubmitting()
      return
    }

    // Before a possible redirect (Klarna, PayPal): afterwards only the backend
    // can report the purchase to Meta. Started above, at most 2 s.
    await attributionPromise

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
      stopSubmitting()
      setErrorMessage(customerPaymentError(error))
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
        className="w-full h-12 text-base"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Zahlungspflichtig bestellen
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
      const result = await placeOrder()
      if (result?.error) {
        setErrorMessage(result.error)
        setSubmitting(false)
        onPaymentError?.()
      }
    } catch (err: unknown) {
      if (isRedirectError(err)) {
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

  const handlePayment = async () => {
    setSubmitting(true)
    // Notify parent immediately so it can lock the UI against stale re-renders.
    onPlacingOrder?.()
    await saveAttributionBriefly()
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
        Zahlungspflichtig bestellen
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
