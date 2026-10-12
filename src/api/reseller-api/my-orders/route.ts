import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateReseller } from "../auth-helper"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { reseller, resellerService } = await authenticateReseller(req)

    const [orders, count] = await resellerService.listAndCountResellerOrders(
      { reseller_id: reseller.id },
      { order: { created_at: "DESC" }, take: 100 }
    )

    // Automatska sinhronizacija sa stvarnim Medusa Order i Fulfillment statusima
    const orderIds = (orders || []).map((o: any) => o.order_id).filter(Boolean)
    if (orderIds.length > 0) {
      try {
        const query = req.scope.resolve("query")
        const { data: medusaOrders } = await query.graph({
          entity: "order",
          fields: [
            "id",
            "status",
            "fulfillment_status",
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

          let targetOrderStatus = ro.order_status
          let targetPayoutStatus = ro.payout_status

          const hasDeliveredFulfillment = mo.fulfillments?.some((f: any) => Boolean(f.delivered_at))
          const hasShippedFulfillment = mo.fulfillments?.some((f: any) => Boolean(f.shipped_at))

          // 1. Ako je fulfillment označen kao delivered ili je narudžba završena
          if (
            mo.fulfillment_status === "delivered" ||
            mo.fulfillment_status === "partially_delivered" ||
            hasDeliveredFulfillment ||
            mo.status === "completed"
          ) {
            targetOrderStatus = "delivered"
            if (ro.payout_status !== "paid") {
              targetPayoutStatus = "eligible"
            }
          } else if (
            mo.fulfillment_status === "shipped" ||
            mo.fulfillment_status === "partially_shipped" ||
            hasShippedFulfillment
          ) {
            targetOrderStatus = "shipped"
          } else if (mo.status === "canceled" || mo.fulfillment_status === "canceled") {
            targetOrderStatus = "canceled"
            if (ro.payout_status !== "paid") {
              targetPayoutStatus = "unearned"
            }
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
      } catch (syncErr) {
        console.warn("[Reseller Sync] Greška pri provjeri statusa narudžbi:", syncErr)
      }
    }

    res.json({
      orders,
      count,
    })
  } catch (err: any) {
    res.status(401).json({ message: err.message })
  }
}
