import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateReseller } from "../auth-helper"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { reseller, resellerService } = await authenticateReseller(req)

    const [orders, count] = await resellerService.listAndCountResellerOrders(
      { reseller_id: reseller.id },
      { order: { created_at: "DESC" }, take: 100 }
    )

    res.json({
      orders,
      count,
    })
  } catch (err: any) {
    res.status(401).json({ message: err.message })
  }
}
