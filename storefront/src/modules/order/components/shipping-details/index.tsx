import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  return (
    <div className="pt-6 border-t border-stone-200">
      <h2 className="font-serif text-xl font-medium text-stone-800 mb-6">
        Lieferung
      </h2>
      
      <div className="grid grid-cols-1 small:grid-cols-3 gap-6">
        {/* Shipping Address */}
        <div data-testid="shipping-address-summary">
          <h3 className="text-sm font-medium text-stone-800 mb-2">
            Lieferadresse
          </h3>
          <div className="text-sm text-stone-600 space-y-0.5">
            <p>
              {order.shipping_address?.first_name}{" "}
              {order.shipping_address?.last_name}
            </p>
            <p>
              {order.shipping_address?.address_1}
              {order.shipping_address?.address_2 && ` ${order.shipping_address.address_2}`}
            </p>
            <p>
              {order.shipping_address?.postal_code}, {order.shipping_address?.city}
            </p>
            <p>{order.shipping_address?.country_code?.toUpperCase()}</p>
          </div>
        </div>

        {/* Contact */}
        <div data-testid="shipping-contact-summary">
          <h3 className="text-sm font-medium text-stone-800 mb-2">
            Kontakt
          </h3>
          <div className="text-sm text-stone-600 space-y-0.5">
            {order.shipping_address?.phone && (
              <p>{order.shipping_address.phone}</p>
            )}
            <p>{order.email}</p>
          </div>
        </div>

        {/* Method */}
        <div data-testid="shipping-method-summary">
          <h3 className="text-sm font-medium text-stone-800 mb-2">
            Versandart
          </h3>
          <div className="text-sm text-stone-600 space-y-0.5">
            <p>{(order as any).shipping_methods?.[0]?.name || "Standard"}</p>
            <p className="text-stone-500">
              ({convertToLocale({
                amount: order.shipping_methods?.[0]?.total ?? 0,
                currency_code: order.currency_code,
              })})
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShippingDetails
