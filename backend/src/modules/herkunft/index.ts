import HerkunftModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const HERKUNFT_MODULE = "herkunft"

export default Module(HERKUNFT_MODULE, {
  service: HerkunftModuleService,
})
