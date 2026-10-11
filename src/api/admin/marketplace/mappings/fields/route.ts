import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETPLACE_MODULE } from "../../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../../modules/marketplace/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const connectionId = req.query.connection_id as string
  const externalCategoryId = req.query.external_category_id as string | undefined

  const filters: Record<string, any> = {}
  if (connectionId) {
    filters.connection_id = connectionId
  }
  if (externalCategoryId) {
    filters.external_category_id = externalCategoryId
  }

  const [mappings, count] = await marketplaceService.listAndCountMarketplaceFieldMappings(filters)
  res.json({ mappings, count })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const body = req.body as any

  if (!body.connection_id || !body.external_attribute_id || !body.source_key) {
    return res.status(400).json({
      message: "connection_id, external_attribute_id i source_key su obavezni.",
    })
  }

  // Provjeri postoji li već mapiranje za ovaj atribut
  const filters: Record<string, any> = {
    connection_id: body.connection_id,
    external_attribute_id: body.external_attribute_id,
  }
  if (body.external_category_id) {
    filters.external_category_id = body.external_category_id
  }

  const [existing] = await marketplaceService.listAndCountMarketplaceFieldMappings(filters)

  let mapping: any
  if (existing.length > 0) {
    mapping = await marketplaceService.updateMarketplaceFieldMappings({
      id: existing[0].id,
      source_type: body.source_type || "fixed_value",
      source_key: body.source_key,
      external_attribute_name: body.external_attribute_name ?? null,
      default_value: body.default_value ?? null,
      value_mappings: body.value_mappings ?? null,
      transformation: body.transformation ?? null,
    })
  } else {
    mapping = await marketplaceService.createMarketplaceFieldMappings({
      connection_id: body.connection_id,
      external_category_id: body.external_category_id ?? null,
      external_attribute_id: body.external_attribute_id,
      external_attribute_name: body.external_attribute_name ?? null,
      source_type: body.source_type || "fixed_value",
      source_key: body.source_key,
      default_value: body.default_value ?? null,
      value_mappings: body.value_mappings ?? null,
      transformation: body.transformation ?? null,
    })
  }

  res.json({ mapping })
}
