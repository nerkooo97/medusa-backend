import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createProductsWorkflow,
  createSalesChannelsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import * as fs from "fs"
import * as path from "path"

export default async function setupMultichannel({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("🚀 Starting Multi-Channel Setup for Alati & Šminka...")

  // 1. Fetch existing stock locations and shipping profiles
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  const defaultStockLocation = stockLocations[0]

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "type"],
  })
  const defaultShippingProfile = shippingProfiles[0]

  // 2. Create or find Sales Channels
  const { data: existingChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name", "description"],
  })

  let toolsChannel = existingChannels.find(
    (c: any) => c.name === "Alati Store" || c.name.toLowerCase().includes("alat")
  )
  if (!toolsChannel) {
    logger.info("Creating 'Alati Store' sales channel...")
    const {
      result: [created],
    } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: "Alati Store",
            description: "Prodajni kanal za alate, mašine i opremu",
          },
        ],
      },
    })
    toolsChannel = created
  }
  logger.info(`✅ Tools Sales Channel ID: ${toolsChannel.id}`)

  let beautyChannel = existingChannels.find(
    (c: any) =>
      c.name === "Šminka Store" ||
      c.name.toLowerCase().includes("sminka") ||
      c.name.toLowerCase().includes("šminka")
  )
  if (!beautyChannel) {
    logger.info("Creating 'Šminka Store' sales channel...")
    const {
      result: [created],
    } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: "Šminka Store",
            description: "Prodajni kanal za šminku, kozmetiku i njegu",
          },
        ],
      },
    })
    beautyChannel = created
  }
  logger.info(`✅ Beauty Sales Channel ID: ${beautyChannel.id}`)

  // 3. Link stock locations to both sales channels
  if (defaultStockLocation) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: defaultStockLocation.id,
        add: [toolsChannel.id, beautyChannel.id],
      },
    })
    logger.info("✅ Linked stock locations to both sales channels.")
  }

  // 4. Create or fetch Publishable API Keys
  const { data: existingApiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "token", "type"],
  })

  let toolsApiKey = existingApiKeys.find(
    (k: any) => k.title === "Alati Storefront Key" && k.type === "publishable"
  )
  if (!toolsApiKey) {
    logger.info("Creating Publishable API Key for Alati Store...")
    const {
      result: [created],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Alati Storefront Key",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    })
    toolsApiKey = created
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: toolsApiKey.id,
        add: [toolsChannel.id],
      },
    })
  }

  let beautyApiKey = existingApiKeys.find(
    (k: any) => k.title === "Šminka Storefront Key" && k.type === "publishable"
  )
  if (!beautyApiKey) {
    logger.info("Creating Publishable API Key for Šminka Store...")
    const {
      result: [created],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Šminka Storefront Key",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    })
    beautyApiKey = created
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: beautyApiKey.id,
        add: [beautyChannel.id],
      },
    })
  }

  logger.info("=======================================================")
  logger.info(`🔑 Alati API Key:  ${toolsApiKey.token}`)
  logger.info(`🔑 Šminka API Key: ${beautyApiKey.token}`)
  logger.info("=======================================================")

  // 5. Seed sample products for Alati Store
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  })
  const existingHandles = new Set(existingProducts.map((p: any) => p.handle))

  const toolsProductsToCreate = [
    {
      title: "Akumulatorska Bušilica 18V Pro",
      description: "Profesionalna aku bušilica sa dvije Li-Ion baterije i brzim punjačem.",
      handle: "aku-busilica-18v-pro",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: defaultShippingProfile?.id,
      sales_channels: [{ id: toolsChannel.id }],
      thumbnail: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=60",
      images: [
        { url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=60" }
      ],
      options: [{ title: "Model", values: ["Standard", "Set sa koferom"] }],
      variants: [
        {
          title: "Standard",
          sku: "ALAT-AKU-01",
          options: { Model: "Standard" },
          prices: [
            { amount: 129, currency_code: "eur" },
            { amount: 250, currency_code: "bam" }
          ]
        },
        {
          title: "Set sa koferom",
          sku: "ALAT-AKU-02",
          options: { Model: "Set sa koferom" },
          prices: [
            { amount: 159, currency_code: "eur" },
            { amount: 310, currency_code: "bam" }
          ]
        }
      ]
    },
    {
      title: "Set Ručnog Alata 108 dijelova",
      description: "Kompletan kofer sa nasadnim ključevima, odvijačima i kliještima od Chrome-Vanadium čelika.",
      handle: "set-rucnog-alata-108",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: defaultShippingProfile?.id,
      sales_channels: [{ id: toolsChannel.id }],
      thumbnail: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=60",
      images: [
        { url: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=60" }
      ],
      options: [{ title: "Pakovanje", values: ["Kofer"] }],
      variants: [
        {
          title: "Kofer",
          sku: "ALAT-SET-108",
          options: { Pakovanje: "Kofer" },
          prices: [
            { amount: 89, currency_code: "eur" },
            { amount: 175, currency_code: "bam" }
          ]
        }
      ]
    },
    {
      title: "Ugaona Brusilica 1200W",
      description: "Snažna električna brusilica za rezanje i brušenje metala i kamena.",
      handle: "ugaona-brusilica-1200w",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: defaultShippingProfile?.id,
      sales_channels: [{ id: toolsChannel.id }],
      thumbnail: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=60",
      images: [
        { url: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=60" }
      ],
      options: [{ title: "Snaga", values: ["1200W"] }],
      variants: [
        {
          title: "1200W",
          sku: "ALAT-BRUS-1200",
          options: { Snaga: "1200W" },
          prices: [
            { amount: 65, currency_code: "eur" },
            { amount: 125, currency_code: "bam" }
          ]
        }
      ]
    }
  ].filter((p) => !existingHandles.has(p.handle))

  if (toolsProductsToCreate.length > 0) {
    logger.info(`Creating ${toolsProductsToCreate.length} tools products...`)
    await createProductsWorkflow(container).run({
      input: { products: toolsProductsToCreate as any },
    })
    logger.info("✅ Tools products created successfully.")
  }

  // 6. Seed sample products for Šminka Store
  const beautyProductsToCreate = [
    {
      title: "Mat Ruž za Usne Velvet Red",
      description: "Dugotrajni tečni mat ruž sa baršunastim finišem i intenzivnom pigmentacijom.",
      handle: "mat-ruz-velvet-red",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: defaultShippingProfile?.id,
      sales_channels: [{ id: beautyChannel.id }],
      thumbnail: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=60",
      images: [
        { url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=60" }
      ],
      options: [{ title: "Nijansa", values: ["Ruby Red", "Cherry Wine", "Nude Rose"] }],
      variants: [
        {
          title: "Ruby Red",
          sku: "BEAUTY-RUZ-01",
          options: { Nijansa: "Ruby Red" },
          prices: [
            { amount: 18, currency_code: "eur" },
            { amount: 35, currency_code: "bam" }
          ]
        },
        {
          title: "Cherry Wine",
          sku: "BEAUTY-RUZ-02",
          options: { Nijansa: "Cherry Wine" },
          prices: [
            { amount: 18, currency_code: "eur" },
            { amount: 35, currency_code: "bam" }
          ]
        },
        {
          title: "Nude Rose",
          sku: "BEAUTY-RUZ-03",
          options: { Nijansa: "Nude Rose" },
          prices: [
            { amount: 18, currency_code: "eur" },
            { amount: 35, currency_code: "bam" }
          ]
        }
      ]
    },
    {
      title: "Hidratantni Serum sa Hijaluronom",
      description: "Intenzivni serum za dubinsku hidrataciju i blistavost kože lica sa vitaminom B5.",
      handle: "hidratantni-serum-hijaluron",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: defaultShippingProfile?.id,
      sales_channels: [{ id: beautyChannel.id }],
      thumbnail: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=60",
      images: [
        { url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=60" }
      ],
      options: [{ title: "Zapremina", values: ["30ml", "50ml"] }],
      variants: [
        {
          title: "30ml",
          sku: "BEAUTY-SERUM-30",
          options: { Zapremina: "30ml" },
          prices: [
            { amount: 24, currency_code: "eur" },
            { amount: 48, currency_code: "bam" }
          ]
        },
        {
          title: "50ml",
          sku: "BEAUTY-SERUM-50",
          options: { Zapremina: "50ml" },
          prices: [
            { amount: 34, currency_code: "eur" },
            { amount: 68, currency_code: "bam" }
          ]
        }
      ]
    },
    {
      title: "Paleta Sjenila Nude Glam 12 Boja",
      description: "Raskošna paleta sa mat i svjetlucavim nijansama za dnevni i večernji makeup.",
      handle: "paleta-sjenila-nude-glam",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: defaultShippingProfile?.id,
      sales_channels: [{ id: beautyChannel.id }],
      thumbnail: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=60",
      images: [
        { url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=60" }
      ],
      options: [{ title: "Paleta", values: ["Nude Glam"] }],
      variants: [
        {
          title: "Nude Glam",
          sku: "BEAUTY-PALETA-12",
          options: { Paleta: "Nude Glam" },
          prices: [
            { amount: 32, currency_code: "eur" },
            { amount: 62, currency_code: "bam" }
          ]
        }
      ]
    }
  ].filter((p) => !existingHandles.has(p.handle))

  if (beautyProductsToCreate.length > 0) {
    logger.info(`Creating ${beautyProductsToCreate.length} beauty products...`)
    await createProductsWorkflow(container).run({
      input: { products: beautyProductsToCreate as any },
    })
    logger.info("✅ Beauty products created successfully.")
  }

  // 7. Write keys to env files for storefronts
  const toolsEnvPath = path.resolve(process.cwd(), "../storefront/.env")
  if (fs.existsSync(toolsEnvPath)) {
    let content = fs.readFileSync(toolsEnvPath, "utf-8")
    content = content.replace(
      /NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*/,
      `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${toolsApiKey.token}`
    )
    fs.writeFileSync(toolsEnvPath, content, "utf-8")
    logger.info("💾 Updated apps/storefront/.env with Alati key")
  }

  const beautyEnvPath = path.resolve(process.cwd(), "../storefront-beauty/.env")
  if (fs.existsSync(beautyEnvPath)) {
    let content = fs.readFileSync(beautyEnvPath, "utf-8")
    content = content.replace(
      /NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*/,
      `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${beautyApiKey.token}`
    )
    fs.writeFileSync(beautyEnvPath, content, "utf-8")
    logger.info("💾 Updated apps/storefront-beauty/.env with Šminka key")
  }

  console.log("\n==================================================")
  console.log(`🔑 Alati Storefront Key: ${toolsApiKey.token}`)
  console.log(`🔑 Šminka Storefront Key: ${beautyApiKey.token}`)
  console.log("==================================================\n")

  logger.info("🎉 Multi-Channel Setup completed successfully!")
}
