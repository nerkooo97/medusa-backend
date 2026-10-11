import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETPLACE_MODULE } from "../../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../../modules/marketplace/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const id = req.params.id

  const listing = await marketplaceService.retrieveMarketplaceListing(id, {
    relations: ["connection", "sync_logs"],
  })

  res.json({ listing })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const marketplaceService: MarketplaceModuleService = req.scope.resolve(MARKETPLACE_MODULE)
  const id = req.params.id

  const listing = await marketplaceService.retrieveMarketplaceListing(id)
  const connection = await marketplaceService.retrieveMarketplaceConnection(listing.connection_id)
  const provider = marketplaceService.getProvider(connection.provider_id)

  try {
    await provider.deleteOrFinishListing(connection, listing.external_id)
  } catch (e) {
    // nastavi sa brisanjem lokalnog zapisa čak i ako je na oglasniku već obrisan
  }

  await marketplaceService.deleteMarketplaceListings(id)
  res.json({ id, object: "marketplace_listing", deleted: true })
}
