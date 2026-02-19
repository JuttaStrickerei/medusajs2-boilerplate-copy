import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminCollection, DetailWidgetProps } from "@medusajs/framework/types"
import EntityImageUpload from "../components/entity-image-upload"

const CollectionImageWidget = ({
  data: collection,
}: DetailWidgetProps<AdminCollection>) => {
  return (
    <EntityImageUpload
      entityId={collection.id}
      entityType="collection"
      metadata={collection.metadata}
    />
  )
}

export const config = defineWidgetConfig({
  zone: "product_collection.details.before",
})

export default CollectionImageWidget
