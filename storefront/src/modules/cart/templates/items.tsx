import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  
  return (
    <div>
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-medium text-stone-800">
            Ihre Artikel
          </h2>
          <span className="text-sm text-stone-500">
            {items?.length || 0} {items?.length === 1 ? "Artikel" : "Artikel"}
          </span>
        </div>
      </div>

      {/* Table Header - Desktop */}
      <div className="hidden small:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-stone-50 border-b border-stone-200 text-sm font-medium text-stone-600">
        <span>Produkt</span>
        <span className="text-center">Menge</span>
        <span className="text-right">Einzelpreis</span>
        <span className="text-right">Gesamt</span>
      </div>

      {/* Items */}
      <div className="divide-y divide-stone-200">
        {items
          ? items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={cart?.currency_code}
                />
              ))
          : repeat(3).map((i) => <SkeletonLineItem key={i} />)}
      </div>
    </div>
  )
}

export default ItemsTemplate
