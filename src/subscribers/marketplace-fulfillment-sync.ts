import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../modules/marketplace"
import MarketplaceModuleService from "../modules/marketplace/service"
import { syncMarketplaceStockWorkflow } from "../workflows/marketplace/sync-marketplace-stock"

export default async function marketplaceFulfillmentSyncHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; fulfillment_id: string }>) {
  const logger = container.resolve("logger")
  const { order_id, fulfillment_id } = data

  try {
    const marketplaceService: MarketplaceModuleService = container.resolve(MARKETPLACE_MODULE)
    const fulfillmentService = container.resolve(Modules.FULFILLMENT)
    const orderService = container.resolve(Modules.ORDER)

    const fulfillment = await fulfillmentService.retrieveFulfillment(fulfillment_id, {
      relations: ["items"],
    })

    if (!fulfillment?.items?.length) return

    // Preuzmi stavke narudžbe da dobijemo product_id / variant_id
    const order = await orderService.retrieveOrder(order_id, {
      relations: ["items"],
    })

    const productIds: string[] = []
    for (const item of order.items || []) {
      if (item.product_id && !productIds.includes(item.product_id)) {
        productIds.push(item.product_id)
      }
    }

    if (productIds.length === 0) return

    // Pronađi sve aktivne listinge za ove proizvode
    for (const prodId of productIds) {
      const [listings] = await marketplaceService.listAndCountMarketplaceListings({
        product_id: prodId,
      })

      for (const listing of listings) {
        const connection = await marketplaceService.retrieveMarketplaceConnection(
          listing.connection_id
        )

        if (connection?.is_active && connection.auto_sync_stock) {
          logger.info(
            `[Marketplace Sync] Pokrećem automatsku sinhronizaciju zaliha za listing ${listing.external_id} (${connection.name}) nakon otpreme narudžbe.`
          )
          await syncMarketplaceStockWorkflow(container).run({
            input: {
              listing_id: listing.id,
            },
          })
        }
      }
    }
  } catch (err: any) {
    logger.error(
      `[Marketplace Sync] Greška pri automatskoj sinhronizaciji zaliha nakon fulfillmenta: ${err.message}`,
      err
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}
