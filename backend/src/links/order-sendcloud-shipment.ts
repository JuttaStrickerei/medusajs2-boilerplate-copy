import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import SendcloudShipmentModule from "../modules/sendcloud-shipment"

export default defineLink(
  OrderModule.linkable.order,
  {
    linkable: SendcloudShipmentModule.linkable.sendcloudShipment,
    isList: true,
  }
)
