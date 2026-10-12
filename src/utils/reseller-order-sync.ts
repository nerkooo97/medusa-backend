import { RESELLER_MODULE } from "../modules/reseller"
import ResellerModuleService from "../modules/reseller/service"

export async function syncResellerOrdersWithMedusa(
  orders: any[],
  scope: any
): Promise<any[]> {
  if (!orders || orders.length === 0) return orders

  const orderIds = orders.map((o) => o.order_id).filter(Boolean)
  if (orderIds.length === 0) return orders

  try {
    const query = scope.resolve("query")
    const resellerService: ResellerModuleService = scope.resolve(RESELLER_MODULE)

    const { data: medusaOrders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "status",
        "fulfillment_status",
        "payment_status",
        "fulfillments.id",
        "fulfillments.shipped_at",
        "fulfillments.delivered_at",
        "fulfillments.canceled_at",
      ],
      filters: { id: orderIds },
    })

    const medusaOrderMap = new Map((medusaOrders as any[]).map((mo: any) => [mo.id, mo]))

    for (const ro of orders) {
      const mo = medusaOrderMap.get(ro.order_id)
      if (!mo) continue

      ro.medusa_order = mo
      ro.display_id = mo.display_id

      let targetOrderStatus = ro.order_status
      let targetPayoutStatus = ro.payout_status

      const hasDeliveredFulfillment = mo.fulfillments?.some((f: any) => Boolean(f.delivered_at))
      const hasShippedFulfillment = mo.fulfillments?.some((f: any) => Boolean(f.shipped_at))

      // 1. Canceled / Stornirano
      if (mo.status === "canceled" || mo.fulfillment_status === "canceled") {
        targetOrderStatus = "canceled"
        if (ro.payout_status !== "paid") {
          targetPayoutStatus = "unearned"
        }
      }
      // 2. Delivered / Isporučeno (ili narudžba završena u Medusa)
      else if (
        mo.fulfillment_status === "delivered" ||
        mo.fulfillment_status === "partially_delivered" ||
        hasDeliveredFulfillment ||
        mo.status === "completed"
      ) {
        targetOrderStatus = "delivered"
        if (ro.payout_status !== "paid") {
          targetPayoutStatus = "eligible"
        }
      }
      // 3. Shipped / Poslano
      else if (
        mo.fulfillment_status === "shipped" ||
        mo.fulfillment_status === "partially_shipped" ||
        hasShippedFulfillment
      ) {
        targetOrderStatus = "shipped"
      }
      // 4. Processing / U pripremi (pakuje se / priprema se)
      else if (
        mo.fulfillment_status === "fulfilled" ||
        mo.fulfillment_status === "partially_fulfilled" ||
        (mo.fulfillments && mo.fulfillments.length > 0)
      ) {
        targetOrderStatus = "processing"
      }
      // 5. Pending / Na čekanju (nije još spakovano / not_fulfilled)
      else {
        targetOrderStatus = "pending"
      }

      if (targetOrderStatus !== ro.order_status || targetPayoutStatus !== ro.payout_status) {
        ro.order_status = targetOrderStatus
        ro.payout_status = targetPayoutStatus

        await resellerService.updateResellerOrders({
          id: ro.id,
          order_status: targetOrderStatus,
          payout_status: targetPayoutStatus,
        })
      }
    }
  } catch (err) {
    console.warn("[syncResellerOrdersWithMedusa] Greška pri sinhronizaciji:", err)
  }

  return orders
}
