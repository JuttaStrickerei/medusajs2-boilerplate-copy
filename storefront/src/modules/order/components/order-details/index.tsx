import { HttpTypes } from "@medusajs/types"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

// Status translations
const fulfillmentStatusMap: Record<string, string> = {
  not_fulfilled: "In Bearbeitung",
  partially_fulfilled: "Teilweise versendet",
  fulfilled: "Versendet",
  partially_shipped: "Teilweise versendet",
  shipped: "Versendet",
  partially_delivered: "Teilweise geliefert",
  delivered: "Geliefert",
  canceled: "Storniert",
}

const paymentStatusMap: Record<string, string> = {
  not_paid: "Nicht bezahlt",
  awaiting: "Ausstehend",
  captured: "Bezahlt",
  partially_refunded: "Teilweise erstattet",
  refunded: "Erstattet",
  canceled: "Storniert",
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-AT", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getFulfillmentStatus = (status: string) => {
    return fulfillmentStatusMap[status] || status.split("_").join(" ")
  }

  const getPaymentStatus = (status: string) => {
    return paymentStatusMap[status] || status.split("_").join(" ")
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">
        Bestellbestätigung gesendet an{" "}
        <span
          className="font-semibold text-stone-800"
          data-testid="order-email"
        >
          {order.email}
        </span>
      </p>
      
      <div className="space-y-1.5 text-sm">
        <p className="text-stone-600">
          Bestelldatum:{" "}
          <span data-testid="order-date" className="text-stone-800">
            {formatDate(order.created_at)}
          </span>
        </p>
        
        <p className="text-stone-600">
          Bestellnummer:{" "}
          <span 
            data-testid="order-id" 
            className="font-medium text-stone-800"
          >
            #{order.display_id}
          </span>
        </p>
      </div>

      {showStatus && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
          <p className="text-stone-600">
            Bestellstatus:{" "}
            <span 
              className="text-stone-800" 
              data-testid="order-status"
            >
              {getFulfillmentStatus(order.fulfillment_status)}
            </span>
          </p>
          <p className="text-stone-600">
            Zahlungsstatus:{" "}
            <span
              className="text-stone-800"
              data-testid="order-payment-status"
            >
              {getPaymentStatus(order.payment_status)}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

export default OrderDetails
