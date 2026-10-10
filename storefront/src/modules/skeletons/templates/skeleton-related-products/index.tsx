import repeat from "@lib/util/repeat"
import { PRODUCT_GRID_WIDE } from "@modules/products/components/product-preview/card-styles"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonRelatedProducts = () => {
  return (
    <div className="product-page-constraint">
      <div className="flex flex-col gap-8 items-center text-center mb-8">
        <div className="w-20 h-6 animate-pulse bg-gray-100"></div>
        <div className="flex flex-col gap-4 items-center text-center mb-16">
          <div className="w-96 h-10 animate-pulse bg-gray-100"></div>
          <div className="w-48 h-10 animate-pulse bg-gray-100"></div>
        </div>
      </div>
      <ul className={`${PRODUCT_GRID_WIDE} flex-1`}>
        {repeat(3).map((index) => (
          <li key={index}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SkeletonRelatedProducts
