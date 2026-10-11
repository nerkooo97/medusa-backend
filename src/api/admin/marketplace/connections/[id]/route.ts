import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETPLACE_MODULE } from "../../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../../modules/marketplace/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const id = req.params.id

  const connection = await marketplaceService.retrieveMarketplaceConnection(id, {
    relations: ["category_mappings", "field_mappings"],
  })

  res.json({ connection })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const id = req.params.id
  const body = req.body as any

  const updated = await marketplaceService.updateMarketplaceConnections({
    id,
    ...body,
  })
  res.json({ connection: updated })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const id = req.params.id

  await marketplaceService.deleteMarketplaceConnections(id)
  res.json({ id, object: "marketplace_connection", deleted: true })
}
