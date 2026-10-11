import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../modules/marketplace"
import MarketplaceModuleService from "../../modules/marketplace/service"

export type RefreshMarketplaceListingInput = {
  listing_id: string
}

export const refreshMarketplaceListingStep = createStep(
  "refresh-marketplace-listing-step",
  async (input: RefreshMarketplaceListingInput, { container }) => {
    const marketplaceService: MarketplaceModuleService = container.resolve(MARKETPLACE_MODULE)

    const listing = await marketplaceService.retrieveMarketplaceListing(input.listing_id)
    if (!listing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Listing sa ID '${input.listing_id}' nije pronađen.`
      )
    }

    const connection = await marketplaceService.retrieveMarketplaceConnection(listing.connection_id)
    const provider = marketplaceService.getProvider(connection.provider_id)

    if (!provider.refreshListing) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Provajder '${connection.provider_id}' ne podržava funkciju obnavljanja (refresh).`
      )
    }

    try {
      const res = await provider.refreshListing(connection, listing.external_id)

      await marketplaceService.createMarketplaceSyncLogs({
        event_type: "refresh",
        status: "success",
        payload: { external_id: listing.external_id },
        response: res,
        connection_id: connection.id,
        listing_id: listing.id,
      })

      return new StepResponse({ success: true, message: res.message })
    } catch (err: any) {
      await marketplaceService.createMarketplaceSyncLogs({
        event_type: "refresh",
        status: "error",
        payload: { external_id: listing.external_id },
        error_message: err.message,
        connection_id: connection.id,
        listing_id: listing.id,
      })
      throw err
    }
  }
)

export const refreshMarketplaceListingWorkflow = createWorkflow(
  "refresh-marketplace-listing-workflow",
  (input: RefreshMarketplaceListingInput) => {
    const result = refreshMarketplaceListingStep(input)
    return new WorkflowResponse(result)
  }
)
