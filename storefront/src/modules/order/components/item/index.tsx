import { HttpTypes } from "@medusajs/types"
import { Table } from "@medusajs/ui"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-20">
        <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
          <Thumbnail thumbnail={item.thumbnail} size="square" className="w-full h-full object-contain" />
        </div>
      </Table.Cell>

      <Table.Cell className="text-left">
        <p
          className="text-sm font-medium text-stone-800"
          data-testid="product-name"
        >
          {item.product_title}
        </p>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      <Table.Cell className="!pr-0">
        <div className="flex flex-col items-end justify-center">
          <div className="flex items-center gap-1 text-sm text-stone-600">
            <span data-testid="product-quantity">{item.quantity}×</span>
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </div>
          <div className="text-sm font-medium text-stone-800">
            <LineItemPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </div>
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
