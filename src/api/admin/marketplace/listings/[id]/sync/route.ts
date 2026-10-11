import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { syncMarketplaceStockWorkflow } from "../../../../../../workflows/marketplace/sync-marketplace-stock"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id
  const body = req.body as any

  const { result } = await syncMarketplaceStockWorkflow(req.scope).run({
    input: {
      listing_id: id,
      new_quantity: body.new_quantity,
    },
  })

  res.json({ listing: result })
}
