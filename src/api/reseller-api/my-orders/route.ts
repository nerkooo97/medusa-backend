import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateReseller } from "../auth-helper"
import { syncResellerOrdersWithMedusa } from "../../../utils/reseller-order-sync"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { reseller, resellerService } = await authenticateReseller(req)

    const [orders, count] = await resellerService.listAndCountResellerOrders(
      { reseller_id: reseller.id },
      { order: { created_at: "DESC" }, take: 100 }
    )

    await syncResellerOrdersWithMedusa(orders, req.scope)

    res.json({
      orders,
      count,
    })
  } catch (err: any) {
    res.status(401).json({ message: err.message })
  }
}
