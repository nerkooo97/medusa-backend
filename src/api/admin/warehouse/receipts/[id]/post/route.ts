import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { postGoodsReceiptWorkflow } from "../../../../../../workflows/warehouse/post-goods-receipt"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const { result } = await postGoodsReceiptWorkflow(req.scope).run({
    input: {
      id,
      posted_by: (req as any).auth_context?.actor_id ?? null,
    },
  })

  res.status(200).json({
    goods_receipt: result,
  })
}
