import { MedusaService } from "@medusajs/framework/utils"
import RevocationDeclaration from "./models/revocation-declaration"

class RevocationModuleService extends MedusaService({
  RevocationDeclaration,
}) {}

export default RevocationModuleService
