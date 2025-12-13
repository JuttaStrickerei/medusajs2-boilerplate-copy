import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (!amount && amount !== 0) {
      return "–"
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  // Calculate item total from individual items (more accurate with tax)
  const itemsTotal = order.items?.reduce((acc, item) => acc + (item.total || 0), 0) || 0

  return (
    <div className="pt-6 border-t border-stone-200">
      <h2 className="font-serif text-xl font-medium text-stone-800 mb-4">
        Bestellübersicht
      </h2>
      
      <div className="space-y-3 text-sm">
        {/* Item Subtotal - use calculated items total for clarity */}
        <div className="flex items-center justify-between text-stone-600">
          <span>Artikel</span>
          <span>{getAmount(itemsTotal)}</span>
        </div>
        
        {/* Discounts */}
        {order.discount_total > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-stone-600">Rabatt</span>
            <span className="text-green-600 font-medium">
              −{getAmount(order.discount_total)}
            </span>
          </div>
        )}
        
        {/* Gift Cards */}
        {order.gift_card_total > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-stone-600">Geschenkkarte</span>
            <span className="text-green-600 font-medium">
              −{getAmount(order.gift_card_total)}
            </span>
          </div>
        )}
        
        {/* Shipping */}
        <div className="flex items-center justify-between text-stone-600">
          <span>Versand</span>
          <span>{getAmount(order.shipping_total)}</span>
        </div>
        
        {/* Tax breakdown - show as "davon MwSt." */}
        <div className="flex items-center justify-between text-stone-500 text-xs pt-1">
          <span>davon MwSt. (20%)</span>
          <span>{getAmount(order.tax_total)}</span>
        </div>
        
        {/* Divider */}
        <div className="border-t border-stone-200 pt-3 mt-3" />
        
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-stone-800">Gesamt</span>
          <span className="text-lg font-semibold text-stone-800">
            {getAmount(order.total)}
          </span>
        </div>
        
        {/* Tax note */}
        <p className="text-xs text-stone-500">
          inkl. MwSt.
        </p>
      </div>
    </div>
  )
}

export default OrderSummary
