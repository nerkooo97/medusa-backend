import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETPLACE_MODULE } from "../../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../../modules/marketplace/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const connectionId = req.query.connection_id as string

  const filters: Record<string, any> = {}
  if (connectionId) {
    filters.connection_id = connectionId
  }

  const [mappings, count] = await marketplaceService.listAndCountMarketplaceCategoryMappings(filters)
  res.json({ mappings, count })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const body = req.body as any

  if (!body.connection_id || !body.medusa_category_id || !body.external_category_id) {
    return res.status(400).json({
      message: "connection_id, medusa_category_id i external_category_id su obavezni.",
    })
  }

  // Provjeri postoji li već mapiranje za ovaj par
  const [existing] = await marketplaceService.listAndCountMarketplaceCategoryMappings({
    connection_id: body.connection_id,
    medusa_category_id: body.medusa_category_id,
  })

  let mapping: any
  if (existing.length > 0) {
    mapping = await marketplaceService.updateMarketplaceCategoryMappings({
      id: existing[0].id,
      external_category_id: body.external_category_id,
      external_category_name: body.external_category_name ?? null,
      auto_publish: body.auto_publish ?? false,
    })
  } else {
    mapping = await marketplaceService.createMarketplaceCategoryMappings({
      connection_id: body.connection_id,
      medusa_category_id: body.medusa_category_id,
      external_category_id: body.external_category_id,
      external_category_name: body.external_category_name ?? null,
      auto_publish: body.auto_publish ?? false,
    })
  }

  res.json({ mapping })
}
