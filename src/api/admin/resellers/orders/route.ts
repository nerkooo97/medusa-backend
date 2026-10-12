import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RESELLER_MODULE } from "../../../../modules/reseller"
import ResellerModuleService from "../../../../modules/reseller/service"

import { syncResellerOrdersWithMedusa } from "../../../../utils/reseller-order-sync"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const resellerService: ResellerModuleService = req.scope.resolve(RESELLER_MODULE)

  const { reseller_id, order_status, payout_status, limit = "50", offset = "0" } = req.query as any

  const filters: Record<string, any> = {}
  if (reseller_id) filters.reseller_id = reseller_id
  if (order_status) filters.order_status = order_status
  if (payout_status) filters.payout_status = payout_status

  const [orders, count] = await resellerService.listAndCountResellerOrders(
    filters,
    {
      relations: ["reseller", "payout"],
      order: { created_at: "DESC" },
      take: Number(limit),
      skip: Number(offset),
    }
  )

  await syncResellerOrdersWithMedusa(orders, req.scope)

  res.json({
    orders,
    count,
    limit: Number(limit),
    offset: Number(offset),
  })
}
