import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

interface ProductRailProps {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}

export default function ProductRail({ collection, region }: ProductRailProps) {
  const products = collection.products

  if (!products || products.length === 0) {
    return null
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-serif text-xl font-medium text-stone-800">
          {collection.title}
        </h3>
      </div>
      <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 small:gap-6">
        {products.slice(0, 4).map((product) => (
          <ProductPreview
            key={product.id}
            product={product as HttpTypes.StoreProduct}
            region={region}
          />
        ))}
      </div>
    </div>
  )
}

