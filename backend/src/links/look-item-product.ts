import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import LookModule from "../modules/look"

// Jedes Look-Teil zeigt auf genau ein bestehendes Produkt.
// Bewusst OHNE deleteCascade: Link-Löschungen (removeRemoteLinkStep) würden
// sonst das verknüpfte Produkt mitlöschen. Teile gelöschter Produkte werden
// in den API-Routen ausgefiltert.
export default defineLink(
  LookModule.linkable.lookItem,
  ProductModule.linkable.product
)
