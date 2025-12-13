import { isStripe, paymentInfoMap } from "@lib/constants"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { CreditCard } from "@components/icons"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]

  const formatPaymentDate = (dateStr: string) => {
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
              <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center">
                {paymentInfoMap[payment.provider_id]?.icon || (
                  <CreditCard size={16} className="text-stone-500" />
                )}
              </div>
              <span
                className="text-sm text-stone-600"
                data-testid="payment-method"
              >
                {paymentInfoMap[payment.provider_id]?.title || payment.provider_id}
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-sm font-medium text-stone-800 mb-2">
              Zahlungsdetails
            </h3>
            <div className="text-sm text-stone-600 space-y-0.5" data-testid="payment-amount">
              {isStripe(payment.provider_id) && payment.data?.card_last4 ? (
                <p>Karte: **** **** **** {payment.data.card_last4}</p>
              ) : (
                <p>
                  {convertToLocale({
                    amount: payment.amount,
                    currency_code: order.currency_code,
                  })}
                </p>
              )}
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
