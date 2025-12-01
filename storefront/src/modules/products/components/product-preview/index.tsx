import { Text } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const [pricedProduct] = await getProductsById({
    ids: [product.id!],
    regionId: region.id,
  })

  if (!pricedProduct) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
  })

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      {/* Card Wrapper with Brand Styling */}
      <div
        className="hover-lift bg-white rounded-lg border border-stone-200 overflow-hidden transition-all duration-300"
        data-testid="product-wrapper"
      >
        {/* Image Container with 3:4 aspect ratio */}
        <div className="aspect-[3/4] overflow-hidden bg-stone-50">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3
            className="font-medium text-stone-800 mb-2 line-clamp-2"
            data-testid="product-title"
          >
            {product.title}
          </h3>

          <div className="flex items-center justify-between">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
