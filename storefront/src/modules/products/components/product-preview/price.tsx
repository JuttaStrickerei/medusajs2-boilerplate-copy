import { formatPrice, calculateDiscount } from "@lib/utils"

interface PriceProps {
  price: {
    calculated_price_number: number
    original_price_number: number
    currency_code: string
    price_type: string
  }
  className?: string
}

// Ruhiger Preis wie auf den Look-Kacheln: 14px, mittleres Gewicht
export default function PreviewPrice({ price, className }: PriceProps) {
  const isOnSale = price.price_type === "sale"
  const discount = isOnSale
    ? calculateDiscount(
        price.original_price_number,
        price.calculated_price_number
      )
    : 0

  return (
    <div className={className}>
      <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm font-medium leading-5 tabular-nums">
        <span
          className={isOnSale ? "text-red-700" : "text-stone-900"}
          data-testid="product-price"
        >
          {formatPrice(price.calculated_price_number, price.currency_code)}
        </span>
        {isOnSale && (
          <span
            className="text-[13px] font-normal text-stone-500 line-through"
            data-testid="original-price"
          >
            {formatPrice(price.original_price_number, price.currency_code)}
          </span>
        )}
        {isOnSale && discount > 0 && (
          <span className="rounded-full bg-red-600 px-1.5 text-[11px] leading-4 text-white">
            −{discount}%
          </span>
        )}
      </p>
      {/* Pflichtangabe; stone-500 statt stone-400 für ausreichenden Kontrast */}
      <p className="text-[11px] leading-4 text-stone-500">inkl. MwSt.</p>
    </div>
  )
}
