import InvoiceModuleService from "./service"
import  createDefaultConfigLoader  from "./loaders/create_default_config"
import { Module } from "@medusajs/framework/utils"

export const INVOICE_MODULE = "invoice_generator"

export default Module(INVOICE_MODULE, {
  service: InvoiceModuleService,
  loaders: [createDefaultConfigLoader],
})