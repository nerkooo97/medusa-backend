import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { WAREHOUSE_MODULE } from "../modules/warehouse"
import WarehouseModuleService from "../modules/warehouse/service"

export default async function orderFulfillmentCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; fulfillment_id: string }>) {
  const logger = container.resolve("logger")
  const { order_id, fulfillment_id } = data

  logger.info(
    `[Warehouse] Obrada otkazivanja otpreme: order_id=${order_id}, fulfillment_id=${fulfillment_id}`
  )

  try {
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    const fulfillmentService = container.resolve(Modules.FULFILLMENT)
    const orderService = container.resolve(Modules.ORDER)
    const inventoryService = container.resolve(Modules.INVENTORY)

    // 1. Dohvati postojeće zapise izlaza za ovaj fulfillment
    const existingMovements = await warehouseService.listStockMovements({
      document_id: fulfillment_id,
      document_type: "order_fulfillment",
    })

    let orderDisplayId = order_id
    try {
      const order = await orderService.retrieveOrder(order_id)
      if (order?.display_id) {
        orderDisplayId = `ORD-${order.display_id}`
      }
    } catch (e) {
      // Ignoriši
    }

    const movementsToCreate: any[] = []

    if (existingMovements.length > 0) {
      for (const mov of existingMovements) {
        // Za svako negativno kretanje (izlaz), upisujemo storno sa pozitivnim predznakom
        if (mov.quantity_change < 0) {
          movementsToCreate.push({
            inventory_item_id: mov.inventory_item_id,
            stock_location_id: mov.stock_location_id,
            sku: mov.sku,
            quantity_change: Math.abs(mov.quantity_change), // Pozitivna promjena / povrat na stanje
            document_type: "adjustment" as const,
            document_id: fulfillment_id,
            reference_number: orderDisplayId,
            notes: `Storno otpreme narudžbe ${orderDisplayId} (Fulfillment opozvan)`,
            created_by: null,
          })
        }
      }
    } else {
      // Ako fulfillment nije bio evidentiran, dohvati stavke direktno iz fulfillmenta
      const fulfillment = await fulfillmentService.retrieveFulfillment(fulfillment_id, {
        relations: ["items"],
      })

      if (fulfillment?.items && fulfillment.location_id) {
        for (const item of fulfillment.items) {
          let invItemId = item.inventory_item_id
          if (!invItemId && item.sku) {
            const [invItems] = await inventoryService.listAndCountInventoryItems({
              sku: item.sku,
            })
            if (invItems && invItems.length > 0) {
              invItemId = invItems[0].id
            }
          }
          if (invItemId) {
            movementsToCreate.push({
              inventory_item_id: invItemId,
              stock_location_id: fulfillment.location_id,
              sku: item.sku || null,
              quantity_change: Math.abs(Number(item.quantity)),
              document_type: "adjustment" as const,
              document_id: fulfillment.id,
              reference_number: orderDisplayId,
              notes: `Storno otpreme narudžbe ${orderDisplayId} (Fulfillment opozvan)`,
              created_by: null,
            })
          }
        }
      }
    }

    if (movementsToCreate.length > 0) {
      await warehouseService.createStockMovements(movementsToCreate)
      logger.info(
        `[Warehouse] Uspješno storniran izlaz za ${movementsToCreate.length} stavki po narudžbi ${orderDisplayId} (Fulfillment: ${fulfillment_id})`
      )
    }
  } catch (err: any) {
    logger.error(
      `[Warehouse] Greška pri obradi order.fulfillment_canceled: ${err.message}`,
      err
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_canceled",
}
