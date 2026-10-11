import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RESELLER_MODULE } from "../../../../modules/reseller"
import ResellerModuleService from "../../../../modules/reseller/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const resellerService: ResellerModuleService = req.scope.resolve(RESELLER_MODULE)
  const { reseller_id, limit = "50", offset = "0" } = req.query as any

  const filters: Record<string, any> = {}
  if (reseller_id) filters.reseller_id = reseller_id

  const [payouts, count] = await resellerService.listAndCountResellerPayouts(
    filters,
    {
      relations: ["reseller", "orders"],
      order: { created_at: "DESC" },
      take: Number(limit),
      skip: Number(offset),
    }
  )

  res.json({
    payouts,
    count,
    limit: Number(limit),
    offset: Number(offset),
  })
}
