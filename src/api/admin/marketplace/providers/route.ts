import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const providers = marketplaceService.listAvailableProviders()

  res.json({
    providers,
  })
}
