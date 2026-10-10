import RevocationModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const REVOCATION_MODULE = "revocation"

export default Module(REVOCATION_MODULE, {
  service: RevocationModuleService,
})
