import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const connectionId = req.query.connection_id as string
  const parentId = req.query.parent_id as string | undefined

  if (!connectionId) {
    return res.status(400).json({ message: "Parametar connection_id je obavezan." })
  }

  const connection = await marketplaceService.retrieveMarketplaceConnection(connectionId)
  const provider = marketplaceService.getProvider(connection.provider_id)

  const categories = await provider.fetchCategories(connection, parentId)
  res.json({ categories })
}
