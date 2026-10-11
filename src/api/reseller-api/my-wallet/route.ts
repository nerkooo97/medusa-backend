import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateReseller } from "../auth-helper"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { reseller, resellerService } = await authenticateReseller(req)

    const [orders] = await resellerService.listAndCountResellerOrders({
      reseller_id: reseller.id,
    })

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
