import {
  LoaderOptions,
  IMedusaInternalService,
} from "@medusajs/framework/types"
import { InvoiceConfig } from "../models/invoice_config"

export default async function createDefaultConfigLoader({
  container,
}: LoaderOptions) {
  const service: IMedusaInternalService<
    typeof InvoiceConfig
  > = container.resolve("invoiceConfigService")

  const [_, count] = await service.listAndCount()

  if (count > 0) {
    return
  }

  await service.create({
    company_name: "Jutta Strickerei",
    company_address: "Wiener Neustädterstraße 47, 7021, Draßburg",
    company_phone: "+43 2686 2259",
    company_email: "office@strickerei-jutta.at",
  })
}