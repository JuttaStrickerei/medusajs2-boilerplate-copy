import { cn, formatPrice, calculateDiscount } from "@lib/utils"

interface PriceProps {
  price: {
    calculated_price_number: number
    original_price_number: number
    currency_code: string
    price_type: string
  }
  className?: string
}

export default function PreviewPrice({ price, className }: PriceProps) {
  const isOnSale = price.price_type === "sale"
  const discount = isOnSale 
    ? calculateDiscount(price.original_price_number, price.calculated_price_number)
    : 0

  return (
    <div className={cn("", className)}>
      {/* Price Row */}
      <div className="flex items-baseline gap-2 flex-wrap">
        {/* Current Price */}
        <span
          className={cn(
            "text-lg font-semibold",
            isOnSale ? "text-red-600" : "text-stone-800"
          )}
          data-testid="product-price"
        >
          {formatPrice(price.calculated_price_number, price.currency_code)}
        </span>

        {/* Original Price (if on sale) */}
        {isOnSale && (
          <span
            className="text-sm text-stone-400 line-through"
            data-testid="original-price"
          >
            {formatPrice(price.original_price_number, price.currency_code)}
          </span>
        )}

        {/* Discount Badge */}
        {isOnSale && discount > 0 && (
          <span className="text-xs font-medium text-white bg-red-500 px-2 py-0.5 rounded-full">
            −{discount}%
          </span>
        )}
      </div>
      
      {/* VAT Note - Always shown */}
      <p className="text-[11px] text-stone-400 mt-1">
        inkl. MwSt.
      </p>
    </div>
  )
}
