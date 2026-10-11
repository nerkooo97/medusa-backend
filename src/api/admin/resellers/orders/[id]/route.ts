import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RESELLER_MODULE } from "../../../../../modules/reseller"
import ResellerModuleService from "../../../../../modules/reseller/service"

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const resellerService: ResellerModuleService = req.scope.resolve(RESELLER_MODULE)
  const id = req.params.id
  const { order_status, payout_status } = req.body as any

  const updateData: Record<string, any> = { id }
  if (order_status) {
    updateData.order_status = order_status
    if (order_status === "delivered" && !payout_status) {
      updateData.payout_status = "eligible"
    } else if (order_status === "returned" || order_status === "canceled") {
      updateData.payout_status = "unearned"
    }
  }
  if (payout_status) {
    updateData.payout_status = payout_status
  }

  try {
    const updated = await resellerService.updateResellerOrders(updateData)
    res.json({ order: updated, message: "Status narudžbe je uspješno ažuriran." })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
