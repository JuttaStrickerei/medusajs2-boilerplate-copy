import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import LookModule from "../modules/look"

// Jedes Look-Teil zeigt auf genau ein bestehendes Produkt.
// Wird das Produkt gelöscht, fällt das Look-Teil mit weg.
export default defineLink(
  LookModule.linkable.lookItem,
  {
    linkable: ProductModule.linkable.product,
    deleteCascade: true,
  }
)
