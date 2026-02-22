import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  AdminProductCategory,
  DetailWidgetProps,
} from "@medusajs/framework/types"
import EntityImageUpload from "../components/entity-image-upload"

const CategoryImageWidget = ({
  data: category,
}: DetailWidgetProps<AdminProductCategory>) => {
  return (
    <EntityImageUpload
      entityId={category.id}
      entityType="category"
      metadata={category.metadata}
    />
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.before",
})

export default CategoryImageWidget
