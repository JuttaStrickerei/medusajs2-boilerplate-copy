import LookModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const LOOK_MODULE = "look"

export default Module(LOOK_MODULE, {
  service: LookModuleService,
})
