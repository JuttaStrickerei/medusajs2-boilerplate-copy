"use client"

import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import { Skeleton } from "@components/ui"

type ItemsTemplateProps = {
  cart: HttpTypes.StoreCart
}

const ItemsPreviewTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart.items
  const hasOverflow = items && items.length > 4

  return (
    <div
      className={clx({
        "overflow-y-auto overflow-x-hidden no-scrollbar max-h-[320px]":
          hasOverflow,
      })}
    >
      <div className="divide-y divide-stone-100" data-testid="items-table">
        {items
          ? items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => {
                return (
                  <Item
                    key={item.id}
                    item={item}
                    type="preview"
                    currencyCode={cart.currency_code}
                  />
                )
              })
          : repeat(3).map((i) => {
              return <SkeletonPreviewItem key={i} />
            })}
      </div>
    </div>
  )
}

// Simple skeleton for preview items
function SkeletonPreviewItem() {
  return (
    <div className="flex gap-4 py-4">
      <Skeleton className="w-16 h-16 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

export default ItemsPreviewTemplate
