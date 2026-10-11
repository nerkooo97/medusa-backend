import { MedusaContainer } from "@medusajs/framework/types"
import { MARKETPLACE_MODULE } from "../modules/marketplace"
import MarketplaceModuleService from "../modules/marketplace/service"
import { syncMarketplaceStockWorkflow } from "../workflows/marketplace/sync-marketplace-stock"

export default async function marketplaceStockSyncJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const marketplaceService: MarketplaceModuleService = container.resolve(MARKETPLACE_MODULE)

  try {
    const [connections] = await marketplaceService.listAndCountMarketplaceConnections({
      is_active: true,
      auto_sync_stock: true,
    })

    if (!connections.length) return

    for (const connection of connections) {
      const [listings] = await marketplaceService.listAndCountMarketplaceListings({
        connection_id: connection.id,
      })

      for (const listing of listings) {
        try {
          await syncMarketplaceStockWorkflow(container).run({
            input: {
              listing_id: listing.id,
            },
          })
        } catch (err: any) {
          logger.warn(
            `[Marketplace Cron] Greška pri periodičnom usklađivanju listinga ${listing.id}: ${err.message}`
          )
        }
      }
    }
  } catch (err: any) {
    logger.error(`[Marketplace Cron] Greška u jobs/marketplace-stock-sync: ${err.message}`, err)
  }
}

export const config = {
  name: "marketplace-periodic-stock-sync",
  schedule: "*/15 * * * *", // Svakih 15 minuta
}
