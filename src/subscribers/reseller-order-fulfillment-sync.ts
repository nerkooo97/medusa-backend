import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { RESELLER_MODULE } from "../modules/reseller"
import ResellerModuleService from "../modules/reseller/service"

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

    const resellerOrder = orders[0]

    if (
      name === "order.fulfillment_delivered" ||
      name === "fulfillment.delivered" ||
      name === "order.completed"
    ) {
      await resellerService.updateResellerOrders({
        id: resellerOrder.id,
        order_status: "delivered",
        payout_status: resellerOrder.payout_status === "paid" ? "paid" : "eligible",
      })
      logger.info(
        `[Reseller] Narudžba ${order_id} (Preprodavač) označena kao 'delivered' (provizija spremna za isplatu).`
      )
    } else if (
      name === "order.fulfillment_created" ||
      name === "fulfillment.created" ||
      name === "fulfillment.shipment_created"
    ) {
      if (resellerOrder.order_status !== "delivered") {
        await resellerService.updateResellerOrders({
          id: resellerOrder.id,
          order_status: "shipped",
        })
        logger.info(
          `[Reseller] Narudžba ${order_id} (Preprodavač) označena kao 'shipped'.`
        )
      }
    } else if (
      name === "order.fulfillment_canceled" ||
      name === "fulfillment.canceled" ||
      name === "order.canceled"
    ) {
      await resellerService.updateResellerOrders({
        id: resellerOrder.id,
        order_status: "canceled",
        payout_status: resellerOrder.payout_status === "paid" ? "paid" : "unearned",
      })
      logger.info(
        `[Reseller] Narudžba ${order_id} stornirana. Status postavljen na 'canceled'.`
      )
    }
  } catch (err: any) {
    logger.error(
      `[Reseller] Greška u resellerOrderFulfillmentSyncHandler: ${err.message}`,
      err
    )
  }
}

export const config: SubscriberConfig = {
  event: [
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
