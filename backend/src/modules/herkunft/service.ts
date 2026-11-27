import { MedusaService } from "@medusajs/framework/utils"
import NewsletterHerkunft from "./models/newsletter-herkunft"

class HerkunftModuleService extends MedusaService({
  NewsletterHerkunft,
}) {}

export default HerkunftModuleService
