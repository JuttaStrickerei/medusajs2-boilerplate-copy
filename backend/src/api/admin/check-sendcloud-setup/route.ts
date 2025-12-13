import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Helper endpoint to check Sendcloud provider setup
 * GET /admin/check-sendcloud-setup
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT)
    const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION)
    const query = req.scope.resolve("query")

    // 1. Check all providers
    const providers = await fulfillmentService.listFulfillmentProviders()
    const sendcloudProvider = providers.find(p => p.id.includes("sendcloud"))

    // 2. Check all stock locations
    const locations = await stockLocationService.listStockLocations({})

    // 3. Check which locations have sendcloud linked
    const locationsWithProviders = await Promise.all(
      locations.map(async (loc) => {
        try {
          const { data } = await query.graph({
            entity: "stock_location",
            fields: ["id", "name", "fulfillment_providers.id"],
            filters: { id: loc.id },
          })
          return data?.[0]
        } catch (error) {
          return { id: loc.id, name: loc.name, error: error.message }
        }
      })
    )

    return res.json({
      sendcloud_provider: sendcloudProvider || null,
      all_providers: providers.map(p => ({ id: p.id })),
      stock_locations: locationsWithProviders,
      summary: {
        sendcloud_exists: !!sendcloudProvider,
        sendcloud_id: sendcloudProvider?.id,
        locations_count: locations.length,
        need_to_link: !sendcloudProvider ? "Provider not found" : "Check locations above",
      },
    })
  } catch (error) {
    console.error("[CheckSetup] Error:", error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
