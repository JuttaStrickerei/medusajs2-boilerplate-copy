import { clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <div className="flex items-center gap-x-2">
      {price.price_type === "sale" && (
        <span
          className="text-sm text-stone-500 line-through"
          data-testid="original-price"
        >
          {price.original_price}
        </span>
      )}
      <span
        className={clx("font-medium", {
          "text-stone-800": price.price_type !== "sale",
          "text-red-600": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </span>
    </div>
  )
}
