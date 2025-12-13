import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import { cn, formatPrice, calculateDiscount } from "@lib/utils"

interface ProductPriceProps {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  className?: string
}

export default function ProductPrice({
  product,
  variant,
  className,
}: ProductPriceProps) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const price = variant ? variantPrice : cheapestPrice

  if (!price) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-stone-400">Preis auf Anfrage</span>
      </div>
    )
  }

  const isOnSale = price.price_type === "sale"
  const discount = isOnSale
    ? calculateDiscount(price.original_price_number, price.calculated_price_number)
    : 0

  return (
    <div className={cn("flex flex-col gap-1", className)} data-testid="product-price">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Current Price */}
        <span
          className={cn(
            "text-2xl font-medium",
            isOnSale ? "text-red-600" : "text-stone-800"
          )}
        >
          {formatPrice(price.calculated_price_number, price.currency_code)}
        </span>

        {/* Original Price (if on sale) */}
        {isOnSale && (
          <span className="text-lg text-stone-400 line-through">
            {formatPrice(price.original_price_number, price.currency_code)}
          </span>
        )}

        {/* Discount Badge */}
        {isOnSale && discount > 0 && (
          <span className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded">
            -{discount}%
          </span>
        )}
      </div>

      {/* VAT Notice */}
      <p className="text-xs text-stone-500">
        inkl. MwSt., zzgl.{" "}
        <a href="/shipping" className="underline hover:text-stone-700">
          Versandkosten
        </a>
      </p>
    </div>
  )
}
