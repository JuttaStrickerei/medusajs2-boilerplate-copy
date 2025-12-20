"use client"

import { paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircle, CreditCard } from "@components/icons"
import { Button } from "@components/ui"
import { clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { StripeContext } from "@modules/checkout/components/payment-wrapper"
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { StripePaymentElementChangeEvent } from "@stripe/stripe-js"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useContext, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stripeComplete, setStripeComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const stripeReady = useContext(StripeContext)

  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )
  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const stripe = stripeReady ? useStripe() : null
  const elements = stripeReady ? useElements() : null

  const handlePaymentElementChange = async (
    event: StripePaymentElementChangeEvent
  ) => {
    if (event.value.type) {
      setSelectedPaymentMethod(event.value.type)
    }
    setStripeComplete(event.complete)

    if (event.complete) {
      setError(null)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!stripe || !elements) {
        setError("Zahlung ist nicht bereit")
        return
      }

      await elements.submit().catch((err) => {
        console.error(err)
        setError(err.message || "Zahlungsfehler")
        return
      })

      router.push(pathname + "?" + createQueryString("step", "review"), {
        scroll: false,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const initStripe = async () => {
    try {
      await initiatePaymentSession(cart, {
        provider_id: "pp_stripe_stripe",
      })
    } catch (err) {
      console.error("Failed to initialize Stripe session:", err)
      setError("Zahlung konnte nicht initialisiert werden")
    }
  }

  useEffect(() => {
    if (!activeSession && isOpen) {
      initStripe()
    }
  }, [cart, isOpen, activeSession])

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={clx(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            {
              "bg-green-100 text-green-600": !isOpen && paymentReady,
              "bg-stone-800 text-white": isOpen,
              "bg-stone-200 text-stone-400": !isOpen && !paymentReady,
            }
          )}>
            {!isOpen && paymentReady ? (
              <CheckCircle size={18} />
            ) : (
              "3"
            )}
          </div>
          <h3 className={clx(
            "font-serif text-lg font-medium",
            {
              "text-stone-800": isOpen || paymentReady,
              "text-stone-400": !isOpen && !paymentReady,
            }
          )}>
            Zahlung
          </h3>
        </div>
        {!isOpen && paymentReady && (
          <button
            onClick={handleEdit}
            className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors underline underline-offset-4"
            data-testid="edit-payment-button"
          >
            Bearbeiten
          </button>
        )}
      </div>

      {isOpen ? (
        <div className="space-y-6">
          {!paidByGiftcard &&
            availablePaymentMethods?.length &&
            stripeReady && (
              <div className="transition-all duration-150 ease-in-out">
                <PaymentElement
                  onChange={handlePaymentElementChange}
                  options={{
                    layout: "accordion",
                  }}
                />
              </div>
            )}
          {paidByGiftcard && (
            <div className="text-sm text-stone-600">
              <p className="font-medium text-stone-800 mb-1">
                Zahlungsmethode
              </p>
              <p data-testid="payment-method-summary">
                Geschenkgutschein
              </p>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            className="w-full h-12 text-base"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              !stripeComplete ||
              !stripe ||
              !elements ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            Weiter zur Übersicht
          </Button>
        </div>
      ) : (
        <div>
          {cart && paymentReady && activeSession && selectedPaymentMethod ? (
            <div className="flex items-center gap-3">
              <CreditCard size={18} className="text-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-800">
                  {paymentInfoMap[selectedPaymentMethod]?.title ||
                    selectedPaymentMethod}
                </p>
                <p className="text-sm text-stone-600">
                  Zahlungsdetails werden angezeigt
                </p>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex items-center gap-3">
              <CreditCard size={18} className="text-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-800">
                  Geschenkgutschein
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default Payment
