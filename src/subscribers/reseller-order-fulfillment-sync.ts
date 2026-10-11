import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { RESELLER_MODULE } from "../modules/reseller"
import ResellerModuleService from "../modules/reseller/service"

export default async function resellerOrderFulfillmentSyncHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ order_id: string; fulfillment_id: string }>) {
  const logger = container.resolve("logger")
  const { order_id } = data

  if (!order_id) return

  try {
    const resellerService: ResellerModuleService = container.resolve(RESELLER_MODULE)

    const [orders] = await resellerService.listAndCountResellerOrders({
      order_id,
    })

    if (orders.length === 0) return

    const resellerOrder = orders[0]

    if (name === "order.fulfillment_created") {
      await resellerService.updateResellerOrders({
        id: resellerOrder.id,
        order_status: "shipped",
      })
      logger.info(
        `[Reseller] Narudžba ${order_id} (Preprodavač) označena kao 'shipped'.`
      )
    } else if (name === "order.fulfillment_canceled") {
      await resellerService.updateResellerOrders({
        id: resellerOrder.id,
        order_status: "canceled",
        payout_status: "unearned",
      })
      logger.info(
        `[Reseller] Otprema za narudžbu ${order_id} je poništena. Status postavljen na 'canceled'.`
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
  event: ["order.fulfillment_created", "order.fulfillment_canceled"],
}
