import { MedusaService } from "@medusajs/framework/utils"
import Look from "./models/look"
import LookItem from "./models/look-item"

class LookModuleService extends MedusaService({
  Look,
  LookItem,
}) {}

export default LookModuleService
