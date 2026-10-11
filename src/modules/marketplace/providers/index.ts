import { IMarketplaceProvider } from "../types"
import { OlxMarketplaceProvider } from "./olx/olx-provider"

class MarketplaceProviderRegistry {
  private providers: Map<string, IMarketplaceProvider> = new Map()

  register(provider: IMarketplaceProvider): void {
    this.providers.set(provider.providerId.toLowerCase(), provider)
  }

  get(providerId: string): IMarketplaceProvider | undefined {
    return this.providers.get(providerId.toLowerCase())
  }

  list(): Array<{ providerId: string; displayName: string; iconName?: string; authSchema: any[] }> {
    return Array.from(this.providers.values()).map((p) => ({
      providerId: p.providerId,
      displayName: p.displayName,
      iconName: p.iconName,
      authSchema: p.getAuthSchema(),
    }))
  }
}

export const marketplaceRegistry = new MarketplaceProviderRegistry()

// Registracija ugrađenih (built-in) provajdera
marketplaceRegistry.register(new OlxMarketplaceProvider())

