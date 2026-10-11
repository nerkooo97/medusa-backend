import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { postStockWriteOffWorkflow } from "../../../../../../workflows/warehouse/post-stock-write-off"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const { result } = await postStockWriteOffWorkflow(req.scope).run({
    input: {
      id,
      posted_by: (req as any).auth_context?.actor_id ?? null,
    },
  })

  res.status(200).json({
    stock_write_off: result,
  })
}
