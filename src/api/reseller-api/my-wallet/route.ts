import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateReseller } from "../auth-helper"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { reseller, resellerService } = await authenticateReseller(req)

    const [orders] = await resellerService.listAndCountResellerOrders({
      reseller_id: reseller.id,
    })

    // Sinhronizacija statusa prije računanja stanja novčanika
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
        console.warn("[Reseller Wallet Sync] Greška pri provjeri statusa:", syncErr)
      }
    }

    const [payouts] = await resellerService.listAndCountResellerPayouts(
      { reseller_id: reseller.id },
      { order: { created_at: "DESC" } }
    )

    const totalRetail = orders.reduce(
      (sum, o) => sum + (Number(o.retail_total) || 0),
      0
    )
    const totalCommission = orders.reduce(
      (sum, o) => sum + (Number(o.commission_earned) || 0),
      0
    )
    const eligibleAmount = orders
      .filter((o) => o.payout_status === "eligible")
      .reduce((sum, o) => sum + (Number(o.commission_earned) || 0), 0)
    const paidAmount = orders
      .filter((o) => o.payout_status === "paid")
      .reduce((sum, o) => sum + (Number(o.commission_earned) || 0), 0)
    const pendingFulfillmentAmount = orders
      .filter((o) => o.payout_status === "unearned" && o.order_status !== "canceled" && o.order_status !== "returned")
      .reduce((sum, o) => sum + (Number(o.commission_earned) || 0), 0)

    res.json({
      reseller_id: reseller.id,
      name: reseller.name,
      wallet: {
        total_retail_sales: Math.round(totalRetail * 100) / 100,
        total_commission_earned: Math.round(totalCommission * 100) / 100,
        eligible_for_payout: Math.round(eligibleAmount * 100) / 100,
        pending_fulfillment: Math.round(pendingFulfillmentAmount * 100) / 100,
        already_paid: Math.round(paidAmount * 100) / 100,
        currency: "BAM",
      },
      payout_history: payouts,
    })
  } catch (err: any) {
    res.status(401).json({ message: err.message })
  }
}
