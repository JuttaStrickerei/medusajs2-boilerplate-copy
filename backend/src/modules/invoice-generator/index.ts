import InvoiceModuleService from "./service"
import  createDefaultConfigLoader  from "./loaders/create-default-config"
import { Module } from "@medusajs/framework/utils"

export const INVOICE_MODULE = "invoice-generator"

export default Module(INVOICE_MODULE, {
  service: InvoiceModuleService,
  loaders: [createDefaultConfigLoader],
})