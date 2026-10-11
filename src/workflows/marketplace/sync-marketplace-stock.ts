import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../modules/marketplace"
import MarketplaceModuleService from "../../modules/marketplace/service"

export type SyncMarketplaceStockInput = {
  listing_id: string
  new_quantity?: number
}

export const syncMarketplaceStockStep = createStep(
  "sync-marketplace-stock-step",
  async (input: SyncMarketplaceStockInput, { container }) => {
    const marketplaceService: MarketplaceModuleService = container.resolve(MARKETPLACE_MODULE)
    const query = container.resolve("query")

    // 1. Dohvati listing
    const listing = await marketplaceService.retrieveMarketplaceListing(input.listing_id)
    if (!listing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Marketplace listing sa ID '${input.listing_id}' nije pronađen.`
      )
    }

    // 2. Dohvati konekciju
    const connection = await marketplaceService.retrieveMarketplaceConnection(listing.connection_id)
    if (!connection || !connection.is_active) {
      return new StepResponse(listing)
    }

    let calculatedStock = input.new_quantity

    // Ako nije direktno proslijeđena nova količina, izračunaj iz Medusa skladišta
    if (calculatedStock === undefined) {
      try {
        if (connection.default_stock_location_id) {
          const { data: inventoryLevels } = await query.graph({
            entity: "inventory_level",
            fields: ["stocked_quantity", "reserved_quantity"],
            filters: {
              location_id: connection.default_stock_location_id,
            },
          })
          if (inventoryLevels?.[0]) {
            calculatedStock = Math.max(
              0,
              (inventoryLevels[0].stocked_quantity || 0) - (inventoryLevels[0].reserved_quantity || 0)
            )
          }
        }
      } catch {
        calculatedStock = listing.last_synced_quantity
      }
    }

    const finalStock = calculatedStock ?? 0
    const isAvailable = finalStock > 0

    // 3. Pozovi provajder
    const provider = marketplaceService.getProvider(connection.provider_id)
    try {
      await provider.syncStock(connection, listing.external_id, finalStock, isAvailable)

      // 4. Ažuriraj listing
      const updatedListing = await marketplaceService.updateMarketplaceListings({
        id: listing.id,
        last_synced_quantity: finalStock,
        status: isAvailable ? "active" : "hidden",
        last_synced_at: new Date(),
        last_sync_error: null,
      })

      // 5. Upiši log
      await marketplaceService.createMarketplaceSyncLogs({
        event_type: "stock_sync",
        status: "success",
        payload: { external_id: listing.external_id, quantity: finalStock, available: isAvailable },
        connection_id: connection.id,
        listing_id: listing.id,
      })

      return new StepResponse(updatedListing)
    } catch (err: any) {
      await marketplaceService.updateMarketplaceListings({
        id: listing.id,
        last_sync_error: err.message,
      })
      await marketplaceService.createMarketplaceSyncLogs({
        event_type: "stock_sync",
        status: "error",
        payload: { external_id: listing.external_id, quantity: finalStock },
        error_message: err.message,
        connection_id: connection.id,
        listing_id: listing.id,
      })
      throw err
    }
  }
)

export const syncMarketplaceStockWorkflow = createWorkflow(
  "sync-marketplace-stock-workflow",
  (input: SyncMarketplaceStockInput) => {
    const listing = syncMarketplaceStockStep(input)
    return new WorkflowResponse(listing)
  }
)
