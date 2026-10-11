import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { dispatchStockTransferWorkflow } from "../../../../../../workflows/warehouse/dispatch-stock-transfer"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const { result } = await dispatchStockTransferWorkflow(req.scope).run({
    input: {
      id,
      dispatched_by: (req as any).auth_context?.actor_id ?? null,
    },
  })

  res.status(200).json({
    stock_transfer: result,
  })
}
