import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { receiveStockTransferWorkflow } from "../../../../../../workflows/warehouse/receive-stock-transfer"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const { result } = await receiveStockTransferWorkflow(req.scope).run({
    input: {
      id,
      received_by: (req as any).auth_context?.actor_id ?? null,
    },
  })

  res.status(200).json({
    stock_transfer: result,
  })
}
