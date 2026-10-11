import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../modules/marketplace"
import MarketplaceModuleService from "../../modules/marketplace/service"

export type PublishMarketplaceProductInput = {
  connection_id: string
  product_id: string
  variant_id?: string
  override_price?: number
}

export const publishMarketplaceProductStep = createStep(
  "publish-marketplace-product-step",
  async (input: PublishMarketplaceProductInput, { container }) => {
    const marketplaceService: MarketplaceModuleService = container.resolve(MARKETPLACE_MODULE)
    const query = container.resolve("query")

    // 1. Dohvati konekciju
    const connection = await marketplaceService.retrieveMarketplaceConnection(input.connection_id)
    if (!connection) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Marketplace konekcija sa ID '${input.connection_id}' nije pronađena.`
      )
    }

    if (!connection.is_active) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Konekcija '${connection.name}' je deaktivirana.`
      )
    }

    // 2. Dohvati detalje proizvoda preko Medusa query servisa
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "subtitle",
        "description",
        "thumbnail",
        "material",
        "weight",
        "origin_country",
        "images.url",
        "categories.id",
        "categories.name",
        "sales_channels.id",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.barcode",
        "variants.material",
        "variants.metadata",
        "variants.options.value",
        "variants.options.option.title",
        "variants.prices.amount",
        "variants.prices.currency_code",
      ],
      filters: {
        id: input.product_id,
      },
    })

    const product = products?.[0]
    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Proizvod sa ID '${input.product_id}' nije pronađen.`
      )
    }

    // Provjera prodajnog kanala
    if (connection.sales_channel_id) {
      const productSalesChannelIds = product.sales_channels?.map((sc: any) => sc.id) || []
      if (!productSalesChannelIds.includes(connection.sales_channel_id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Proizvod '${product.title}' ne pripada prodajnom kanalu dodijeljenom ovom marketplace nalogu. Proizvod mora biti dodijeljen tom kanalu prije objave.`
        )
      }
    }

    const variant = input.variant_id
      ? product.variants?.find((v: any) => v.id === input.variant_id)
      : product.variants?.[0]

    // 3. Pronađi mapiranje kategorije
    const productCategoryIds = product.categories?.map((c: any) => c.id) || []
    const [allCategoryMappings] = await marketplaceService.listAndCountMarketplaceCategoryMappings({
      connection_id: connection.id,
    })

    const categoryMapping = allCategoryMappings.find((m) =>
      productCategoryIds.includes(m.medusa_category_id)
    )

    if (!categoryMapping) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Proizvod '${product.title}' nema mapiranu kategoriju za marketplace '${connection.name}'. Prvo podesite mapiranje kategorije.`
      )
    }

    // 4. Dohvati mapiranja polja
    const [fieldMappings] = await marketplaceService.listAndCountMarketplaceFieldMappings({
      connection_id: connection.id,
    })

    // 5. Izračunaj važeću cijenu (preferira se BAM / KM)
    let calculatedPrice = input.override_price || 0
    const variantAny = variant as any
    if (!calculatedPrice && variantAny?.prices?.length) {
      const bamPrice = variantAny.prices.find((p: any) => p.currency_code?.toLowerCase() === "bam")
      calculatedPrice = bamPrice ? bamPrice.amount : variantAny.prices[0].amount
    }

    // 6. Dohvati trenutno stanje zaliha
    let currentStock = 1
    try {
      if (variant?.id && connection.default_stock_location_id) {
        const { data: inventoryLevels } = await query.graph({
          entity: "inventory_level",
          fields: ["stocked_quantity", "reserved_quantity"],
          filters: {
            location_id: connection.default_stock_location_id,
          },
        })
        if (inventoryLevels?.[0]) {
          currentStock = Math.max(
            0,
            (inventoryLevels[0].stocked_quantity || 0) - (inventoryLevels[0].reserved_quantity || 0)
          )
        }
      }
    } catch {
      // Zadrži default fallback ako inventory modul nije povezan za ovaj variant
    }

    // 7. Pozovi provajder za objavu na eksterni marketplace
    const provider = marketplaceService.getProvider(connection.provider_id)
    let publishResult: any
    try {
      publishResult = await provider.publishListing({
        product,
        variant,
        categoryMapping,
        fieldMappings,
        connectionSettings: connection,
        currentStock,
        price: calculatedPrice,
      })
    } catch (err: any) {
      // Zabilježi grešku u audit log
      await marketplaceService.createMarketplaceSyncLogs({
        event_type: "publish",
        status: "error",
        payload: { product_id: product.id, variant_id: variant?.id },
        error_message: err.message,
        connection_id: connection.id,
      })
      throw err
    }

    // 8. Sačuvaj ili ažuriraj MarketplaceListing
    const [existingListings] = await marketplaceService.listAndCountMarketplaceListings({
      connection_id: connection.id,
      product_id: product.id,
    })

    let listing: any
    if (existingListings.length > 0) {
      listing = await marketplaceService.updateMarketplaceListings({
        id: existingListings[0].id,
        external_id: publishResult.externalId,
        external_url: publishResult.externalUrl ?? null,
        status: publishResult.status || "active",
        last_synced_price: calculatedPrice,
        last_synced_quantity: currentStock,
        last_synced_at: new Date(),
        last_sync_error: null,
      })
    } else {
      listing = await marketplaceService.createMarketplaceListings({
        connection_id: connection.id,
        product_id: product.id,
        variant_id: variant?.id ?? null,
        external_id: publishResult.externalId,
        external_url: publishResult.externalUrl ?? null,
        status: publishResult.status || "active",
        last_synced_price: calculatedPrice,
        last_synced_quantity: currentStock,
        last_synced_at: new Date(),
      })
    }

    // 9. Upiši uspješan SyncLog
    await marketplaceService.createMarketplaceSyncLogs({
      event_type: "publish",
      status: "success",
      payload: { external_id: publishResult.externalId, price: calculatedPrice, stock: currentStock },
      response: publishResult.rawResponse ?? null,
      connection_id: connection.id,
      listing_id: listing.id,
    })

    return new StepResponse(listing, { listingId: listing.id })
  }
)

export const publishMarketplaceProductWorkflow = createWorkflow(
  "publish-marketplace-product-workflow",
  (input: PublishMarketplaceProductInput) => {
    const listing = publishMarketplaceProductStep(input)
    return new WorkflowResponse(listing)
  }
)
