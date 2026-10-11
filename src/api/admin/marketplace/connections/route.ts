import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)

  const [connections, count] = await marketplaceService.listAndCountMarketplaceConnections(
    {},
    {
      order: { created_at: "DESC" },
    }
  )

  try {
    const query = req.scope.resolve("query")
    const { data: salesChannels } = await query.graph({
      entity: "sales_channel",
      fields: ["id", "name"],
    })
    const channelMap = new Map((salesChannels || []).map((sc: any) => [sc.id, sc.name]))
    const enriched = connections.map((conn: any) => ({
      ...conn,
      sales_channel_name: channelMap.get(conn.sales_channel_id) || conn.sales_channel_id,
    }))
    return res.json({
      connections: enriched,
      count,
    })
  } catch {
    return res.json({
      connections,
      count,
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const body = req.body as any

  if (!body.name || !body.provider_id || !body.sales_channel_id) {
    return res.status(400).json({
      message: "Naziv, ID provajdera i Prodajni Kanal (Sales Channel) su obavezni.",
    })
  }

  let authType = body.auth_type || body.credentials?.auth_mode || "credentials_login"
  if (authType === "credentials") authType = "credentials_login"
  if (authType === "client_tokens") authType = "api_key"

  const created = await marketplaceService.createMarketplaceConnections({
    name: body.name,
    provider_id: body.provider_id,
    sales_channel_id: body.sales_channel_id,
    auth_type: authType,
    credentials: body.credentials || {},
    base_url: body.base_url || null,
    is_active: body.is_active !== undefined ? body.is_active : true,
    auto_sync_stock: body.auto_sync_stock !== undefined ? body.auto_sync_stock : true,
    auto_sync_prices: body.auto_sync_prices !== undefined ? body.auto_sync_prices : false,
    default_stock_location_id: body.default_stock_location_id || null,
    default_settings: body.default_settings || null,
    metadata: body.metadata || null,
  })

  res.status(201).json({
    connection: created,
  })
}
