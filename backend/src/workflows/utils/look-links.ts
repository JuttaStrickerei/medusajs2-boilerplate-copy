import { Modules } from "@medusajs/framework/utils"
import { LOOK_MODULE } from "../../modules/look"

type LookItemWithLink = {
  id: string
  product_link?: { product_id?: string | null } | null
}

// Link-Definitionen (Look-Teil <-> Produkt) für dismissRemoteLinkStep
export const toLinks = (items: LookItemWithLink[]) =>
  items
    .filter((item) => !!item.product_link?.product_id)
    .map((item) => ({
      [LOOK_MODULE]: { look_item_id: item.id },
      [Modules.PRODUCT]: { product_id: item.product_link!.product_id! },
    }))
