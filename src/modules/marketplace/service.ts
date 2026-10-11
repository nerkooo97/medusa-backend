import { MedusaService } from "@medusajs/framework/utils"
import { MarketplaceConnection } from "./models/marketplace-connection"
import { MarketplaceCategoryMapping } from "./models/marketplace-category-mapping"
import { MarketplaceFieldMapping } from "./models/marketplace-field-mapping"
import { MarketplaceListing } from "./models/marketplace-listing"
import { MarketplaceSyncLog } from "./models/marketplace-sync-log"
import { marketplaceRegistry } from "./providers"
import { IMarketplaceProvider, TestConnectionResult } from "./types"

class MarketplaceModuleService extends MedusaService({
  MarketplaceConnection,
  MarketplaceCategoryMapping,
  MarketplaceFieldMapping,
  MarketplaceListing,
  MarketplaceSyncLog,
}) {
  /**
   * Dohvata instancu provajdera po njegovom ID-ju (npr. 'olx')
   */
  getProvider(providerId: string): IMarketplaceProvider {
    const provider = marketplaceRegistry.get(providerId)
    if (!provider) {
      throw new Error(`Marketplace provajder '${providerId}' nije pronađen ili registrovan u sistemu.`)
    }
    return provider
  }

  /**
   * Vraća listu svih registrovanih provajdera sa njihovim auth shemama za Admin UI
   */
  listAvailableProviders() {
    return marketplaceRegistry.list()
  }

  /**
   * Testira ispravnost kredencijala za određeni provajder
   */
  async testProviderConnection(
    providerId: string,
    credentials: Record<string, any>,
    baseUrl?: string
  ): Promise<TestConnectionResult> {
    const provider = this.getProvider(providerId)
    return await provider.testConnection(credentials, baseUrl)
  }
}

export default MarketplaceModuleService
