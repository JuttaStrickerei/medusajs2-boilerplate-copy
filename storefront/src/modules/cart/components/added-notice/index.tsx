import { HttpTypes } from "@medusajs/types"
import { Check } from "@components/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Bestätigung oben im Warenkorb, wenn die Kundin gerade von „In den Warenkorb“
 * kommt: was dazukam, und der Weg zurück zum Stück. Erscheint nur, wenn die
 * genannten Varianten wirklich im Warenkorb liegen.
 */
export default function AddedNotice({
  cart,
  variantIds,
  backPath,
}: {
  cart: HttpTypes.StoreCart
  variantIds: string[]
  backPath?: string
}) {
  const added = (cart.items ?? []).filter(
    (item) => !!item.variant_id && variantIds.includes(item.variant_id)
  )
  if (!added.length) return null

  const text =
    added.length === 1
      ? `${added[0].product_title ?? added[0].title} liegt in Ihrem Warenkorb.`
      : `${added.length} Teile liegen in Ihrem Warenkorb.`

  return (
    <div className="content-container pt-4 small:pt-5">
      <div
        role="status"
        data-testid="cart-added-notice"
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3"
      >
        <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-green-800">
          <Check size={18} className="flex-shrink-0 text-green-600" />
          <span>{text}</span>
        </p>
        <LocalizedClientLink
          href={backPath ?? "/store"}
          className="pl-[26px] text-sm text-stone-700 underline underline-offset-4 hover:text-stone-900 xsmall:pl-0"
          data-testid="cart-continue-shopping"
        >
          Weiter einkaufen
        </LocalizedClientLink>
      </div>
    </div>
  )
}
