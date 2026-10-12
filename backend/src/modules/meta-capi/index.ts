import MetaCapiModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

// Meta Conversions API. medusa-config.js only loads this module when
// META_CAPI_ACCESS_TOKEN is set; without it the purchase subscriber only
// deletes the attribution data the storefront stored on the cart.
export const META_CAPI_MODULE = "metaCapi"

export default Module(META_CAPI_MODULE, {
  service: MetaCapiModuleService,
})
