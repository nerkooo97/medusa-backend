import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETPLACE_MODULE } from "../../../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../../../modules/marketplace/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const id = req.params.id
  const body = req.body as any

  let credentials: any
  let providerId: string
  let baseUrl: string | undefined

  if (id === "new") {
    credentials = body.credentials
    providerId = body.provider_id
    baseUrl = body.base_url
  } else {
    const connection = await marketplaceService.retrieveMarketplaceConnection(id)
    credentials = body.credentials || connection.credentials
    providerId = connection.provider_id
    baseUrl = body.base_url || connection.base_url || undefined
  }

  const result = await marketplaceService.testProviderConnection(providerId, credentials, baseUrl)
  res.json({ result })
}
