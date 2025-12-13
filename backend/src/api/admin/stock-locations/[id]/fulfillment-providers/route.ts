import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * GET - List fulfillment providers for a stock location
 * POST - Associate a provider with a stock location
 */

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: location_id } = req.params

  try {
    const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT)

    // Get all providers
    const providers = await fulfillmentService.listFulfillmentProviders()

    console.log("[ProviderAPI] All providers:", providers.map(p => ({ id: p.id })))

    // Use Query to get location with providers
    const query = req.scope.resolve("query")
    const { data: locations } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name", "fulfillment_providers.*"],
      filters: {
        id: location_id,
      },
    })

    const location = locations?.[0]

    return res.json({
      location: {
        id: location?.id,
        name: location?.name,
        fulfillment_providers: location?.fulfillment_providers || [],
      },
      all_providers: providers.map(p => ({
        id: p.id,
      })),
    })
  } catch (error) {
    console.error("[ProviderAPI] Error:", error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: location_id } = req.params
  const { provider_id } = req.body as { provider_id: string }

  try {
    const link = req.scope.resolve("link")

    // Link provider to location
    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: location_id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: provider_id,
      },
    })

    return res.json({
      message: "Provider linked successfully",
      location_id,
      provider_id,
    })
  } catch (error) {
    console.error("[ProviderAPI] Error linking provider:", error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
