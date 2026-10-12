import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { RESELLER_MODULE } from "../modules/reseller"
import ResellerModuleService from "../modules/reseller/service"
import { syncResellerOrdersWithMedusa } from "../utils/reseller-order-sync"

export default async function resellerOrderFulfillmentSyncHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ order_id?: string; id?: string; fulfillment_id?: string }>) {
  const logger = container.resolve("logger")
  const order_id = (data as any)?.order_id || (data as any)?.id

  if (!order_id) return

  try {
    const resellerService: ResellerModuleService = container.resolve(RESELLER_MODULE)

    const [orders] = await resellerService.listAndCountResellerOrders({
      order_id,
    })

    if (orders.length === 0) return

    await syncResellerOrdersWithMedusa(orders, container)
    logger.info(
      `[Reseller Sync] Narudžba ${order_id} sinhronizovana sa Medusa eventom '${name}'.`
    )
  } catch (err: any) {
    logger.error(
      `[Reseller] Greška u resellerOrderFulfillmentSyncHandler: ${err.message}`,
      err
    )
  }
}

export const config: SubscriberConfig = {
  event: [
    "order.placed",
    "order.updated",
    "order.fulfillment_created",
    "order.fulfillment_delivered",
    "order.fulfillment_canceled",
    "fulfillment.created",
    "fulfillment.delivered",
    "fulfillment.canceled",
    "fulfillment.shipment_created",
    "order.completed",
    "order.canceled",
  ],
}
