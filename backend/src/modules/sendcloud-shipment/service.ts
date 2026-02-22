import { MedusaService } from "@medusajs/framework/utils"
import SendcloudShipment from "./models/sendcloud-shipment"

class SendcloudShipmentModuleService extends MedusaService({
  SendcloudShipment,
}) {}

export default SendcloudShipmentModuleService
