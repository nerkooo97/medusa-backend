import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { WAREHOUSE_MODULE } from "../modules/warehouse"
import WarehouseModuleService from "../modules/warehouse/service"

export default async function orderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; fulfillment_id: string }>) {
  const logger = container.resolve("logger")
  const { order_id, fulfillment_id } = data

  logger.info(
    `[Warehouse] Obrada kreiranja otpreme: order_id=${order_id}, fulfillment_id=${fulfillment_id}`
  )

  try {
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    const fulfillmentService = container.resolve(Modules.FULFILLMENT)
    const orderService = container.resolve(Modules.ORDER)
    const inventoryService = container.resolve(Modules.INVENTORY)

    // 1. Idempotencija: provjeri da li već postoje zapisi za ovaj fulfillment
    const existingMovements = await warehouseService.listStockMovements({
      document_id: fulfillment_id,
      document_type: "order_fulfillment",
    })

    if (existingMovements.length > 0) {
      logger.info(
        `[Warehouse] Kretanja zaliha za fulfillment ${fulfillment_id} su već evidentirana. Preskačem.`
      )
      return
    }

    // 2. Dohvati fulfillment sa stavkama
    const fulfillment = await fulfillmentService.retrieveFulfillment(fulfillment_id, {
      relations: ["items"],
    })

    if (!fulfillment || !fulfillment.items || fulfillment.items.length === 0) {
      logger.warn(
        `[Warehouse] Fulfillment ${fulfillment_id} nema stavki ili nije pronađen.`
      )
      return
    }

    // 3. Dohvati podatke o narudžbi za referentni broj
    let orderDisplayId = order_id
    let customerNote = ""
    try {
      const order = await orderService.retrieveOrder(order_id)
      if (order) {
        orderDisplayId = order.display_id ? `ORD-${order.display_id}` : order.id
        customerNote = order.email ? ` (Kupac: ${order.email})` : ""
      }
    } catch (e: any) {
      logger.warn(`[Warehouse] Nije uspjelo dohvatanje narudžbe ${order_id}: ${e.message}`)
    }

    const locationId = fulfillment.location_id
    if (!locationId) {
      logger.warn(`[Warehouse] Fulfillment ${fulfillment_id} nema definisan location_id.`)
      return
    }

    // 4. Za svaku stavku kreiraj zapis o izlazu sa stanja
    const movementsToCreate: any[] = []

    for (const item of fulfillment.items) {
      let invItemId = item.inventory_item_id

      // Ako fulfillmentItem nema direktno inventory_item_id, potraži po SKU
      if (!invItemId && item.sku) {
        try {
          const [invItems] = await inventoryService.listAndCountInventoryItems({
            sku: item.sku,
          })
          if (invItems && invItems.length > 0) {
            invItemId = invItems[0].id
          }
        } catch (e) {
          // Nastavi
        }
      }

      if (!invItemId) {
        logger.warn(
          `[Warehouse] Stavka ${item.title || item.sku} nema povezan Inventory Item. Preskačem knjiženje.`
        )
        continue
      }

      const qty = Number(item.quantity)
      if (qty <= 0) continue

      movementsToCreate.push({
        inventory_item_id: invItemId,
        stock_location_id: locationId,
        sku: item.sku || null,
        quantity_change: -qty, // Negativna promjena / izlaz robe
        document_type: "order_fulfillment" as const,
        document_id: fulfillment.id,
        reference_number: orderDisplayId,
        notes: `Otprema narudžbe ${orderDisplayId}${customerNote}`,
        created_by: (fulfillment as any).created_by || null,
      })
    }

    if (movementsToCreate.length > 0) {
      await warehouseService.createStockMovements(movementsToCreate)
      logger.info(
        `[Warehouse] Uspješno zabilježen izlaz zaliha za ${movementsToCreate.length} stavki po narudžbi ${orderDisplayId} (Fulfillment: ${fulfillment.id})`
      )
    }
  } catch (err: any) {
    logger.error(
      `[Warehouse] Greška pri obradi order.fulfillment_created: ${err.message}`,
      err
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}
