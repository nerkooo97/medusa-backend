import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refreshMarketplaceListingWorkflow } from "../../../../../../workflows/marketplace/refresh-marketplace-listing"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id

  const { result } = await refreshMarketplaceListingWorkflow(req.scope).run({
    input: {
      listing_id: id,
    },
  })

  res.json({ result })
}
