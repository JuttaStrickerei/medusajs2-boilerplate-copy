import { isStripe, paymentInfoMap } from "@lib/constants"
import { getOrderPaymentMethod } from "@lib/data/orders"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { CreditCard } from "@components/icons"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

// Symbole aus public/images/payment für die Arten, die dort eines haben
const PAYMENT_TYPE_ICONS: Record<string, string> = {
  apple_pay: "/images/payment/apple-pay.svg",
  google_pay: "/images/payment/google-pay.svg",
  paypal: "/images/payment/paypal.svg",
  klarna: "/images/payment/klarna.svg",
}

// Ist die Art noch nicht bekannt (Stripe antwortet nicht), lieber neutral als
// falsch: Früher stand hier für jede Stripe-Zahlung „Kreditkarte“, auch bei
// Apple Pay, PayPal oder Klarna.
const STRIPE_FALLBACK_LABEL = "Online-Zahlung"

const PaymentDetails = async ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]

  // Alle Stripe-Arten laufen über denselben Provider (pp_stripe_stripe); die
  // tatsächliche Art (Apple Pay, Google Pay, Kreditkarte …) kennt nur Stripe
  const stripeMethod =
    payment && isStripe(payment.provider_id)
      ? await getOrderPaymentMethod(order.id)
      : null

  const methodLabel = payment
    ? isStripe(payment.provider_id)
      ? stripeMethod?.label ?? STRIPE_FALLBACK_LABEL
      : paymentInfoMap[payment.provider_id]?.title || payment.provider_id
    : null
  const methodIcon = stripeMethod?.type
    ? PAYMENT_TYPE_ICONS[stripeMethod.type]
    : undefined

  const formatPaymentDate = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleDateString("de-AT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="pt-6 border-t border-stone-200">
      <h2 className="font-serif text-xl font-medium text-stone-800 mb-6">
        Zahlung
      </h2>

      {payment && (
        <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
          {/* Payment Method */}
          <div>
            <h3 className="text-sm font-medium text-stone-800 mb-2">
              Zahlungsart
            </h3>
            <div className="flex items-center gap-2">
              {methodIcon ? (
                /* Statische SVG-Datei wie in PaymentMethods: ohne next/image */
                <img
                  src={methodIcon}
                  alt=""
                  width={38}
                  height={24}
                  className="block h-6 w-auto"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center">
                  {(!isStripe(payment.provider_id) &&
                    paymentInfoMap[payment.provider_id]?.icon) || (
                    <CreditCard size={16} className="text-stone-500" />
                  )}
                </div>
              )}
              <span
                className="text-sm text-stone-600"
                data-testid="payment-method"
              >
                {methodLabel}
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-sm font-medium text-stone-800 mb-2">
              Zahlungsdetails
            </h3>
            <div className="text-sm text-stone-600 space-y-0.5" data-testid="payment-amount">
              <p>
                {convertToLocale({
                  amount: payment.amount,
                  currency_code: order.currency_code,
                })}
              </p>
              {payment.created_at && (
                <p className="text-stone-400 text-xs">
                  Bezahlt am {formatPaymentDate(payment.created_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentDetails
