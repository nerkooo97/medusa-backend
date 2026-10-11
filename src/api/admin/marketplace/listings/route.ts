import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"
import { publishMarketplaceProductWorkflow } from "../../../../workflows/marketplace/publish-marketplace-product"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

  const filters: Record<string, any> = {}
  if (req.query.connection_id) {
    filters.connection_id = req.query.connection_id
  }
  if (req.query.product_id) {
    filters.product_id = req.query.product_id
  }
  if (req.query.status) {
    filters.status = req.query.status
  }

  const [listings, count] = await marketplaceService.listAndCountMarketplaceListings(filters, {
    relations: ["connection"],
    skip: offset,
    take: limit,
    order: { created_at: "DESC" },
  })

  res.json({
    listings,
    count,
    limit,
    offset,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any

  if (!body.connection_id || !body.product_id) {
    return res.status(400).json({
      message: "connection_id i product_id su obavezni.",
    })
  }

  try {
    const { result } = await publishMarketplaceProductWorkflow(req.scope).run({
      input: {
        connection_id: body.connection_id,
        product_id: body.product_id,
        variant_id: body.variant_id,
        override_price: body.override_price,
      },
    })

    res.status(201).json({
      listing: result,
    })
  } catch (err: any) {
    res.status(400).json({
      message: err.message || "Greška pri objavi proizvoda na marketplace.",
    })
  }
}
