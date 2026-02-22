import SendcloudShipmentModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const SENDCLOUD_SHIPMENT_MODULE = "sendcloudShipment"

export default Module(SENDCLOUD_SHIPMENT_MODULE, {
  service: SendcloudShipmentModuleService,
})
