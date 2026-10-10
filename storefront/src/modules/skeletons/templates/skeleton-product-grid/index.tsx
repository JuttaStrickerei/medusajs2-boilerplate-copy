import repeat from "@lib/util/repeat"
import { PRODUCT_GRID } from "@modules/products/components/product-preview/card-styles"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonProductGrid = ({
  numberOfProducts = 8,
}: {
  numberOfProducts?: number
}) => {
  return (
    <ul className={`${PRODUCT_GRID} flex-1`} data-testid="products-list-loader">
      {repeat(numberOfProducts).map((index) => (
        <li key={index}>
          <SkeletonProductPreview />
        </li>
      ))}
    </ul>
  )
}

export default SkeletonProductGrid
