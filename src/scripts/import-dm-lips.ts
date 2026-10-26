import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function importDmLips({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("💄 Pokrećem import DM ruževa za Look.ba...")

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "type"],
  })
  const shippingProfile = shippingProfiles[0]

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const lookChannel = salesChannels.find(
    (sc: any) => sc.name.toLowerCase().includes("look") || sc.id === "sc_01M50T97GQ8C8TN9QB5RBG891F"
  )

  if (!lookChannel) {
    logger.error("❌ Look.ba sales channel nije pronađen!")
    return
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"],
  })
  const categoryMap = new Map<string, string>()
  categories.forEach((c: any) => categoryMap.set(c.handle, c.id))
  const rootBeautyCatId = categoryMap.get("kozmetika")
  const lipsCatId = categoryMap.get("sminka-za-usne")

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  })
  const existingHandles = new Set(existingProducts.map((p: any) => p.handle))

  const dmProducts = [
  {
    "title": "CATRICE - Lippenstift Blur-Real Matte 040 Muted Romance, 3 g",
    "handle": "dm-catrice-lippenstift-blur-real-matte-040-muted-21",
    "description": "Originalni CATRICE ruž za usne sa dm.de. Lippenstift Blur-Real Matte 040 Muted Romance, 3 g. Dugotrajna postojanost, intenzivna pigmentacija i ugodan osjećaj na usnama.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1763989776/assets/pas/images/3483ee33-6ea0-4715-8116-0f82d7cf53db/catrice-lippenstift-blur-real-matte-040-muted-romance",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1763989776/assets/pas/images/3483ee33-6ea0-4715-8116-0f82d7cf53db/catrice-lippenstift-blur-real-matte-040-muted-romance",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1763989781/assets/pas/images/fe3dbf03-e8e2-450e-9208-0362ef8e1b0e/catrice-lippenstift-blur-real-matte-040-muted-romance",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1764022073/assets/pas/images/53f97739-1a7a-494a-b718-1ed913cddb2d/catrice-lippenstift-blur-real-matte-040-muted-romance",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1763989806/assets/pas/images/ed5bffac-adad-4767-985a-d67293889afd/catrice-lippenstift-blur-real-matte-040-muted-romance"
    ],
    "price_eur": 4.45,
    "price_bam": 8.7,
    "cat_handle": "sminka-za-usne",
    "sku": "LOOK-DM-021",
    "brand": "CATRICE"
  },
  {
    "title": "MAYBELLINE NEW YORK - Lippenstift Super Stay 24h 185 Rose Dust, 5 ml",
    "handle": "dm-maybelline-new-york-lippenstift-super-stay-24-22",
    "description": "Originalni MAYBELLINE NEW YORK ruž za usne sa dm.de. Lippenstift Super Stay 24h 185 Rose Dust, 5 ml. Dugotrajna postojanost, intenzivna pigmentacija i ugodan osjećaj na usnama.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1758059388/assets/pas/images/7d1982bc-694b-4810-b960-6fe336ee29fb/maybelline-new-york-lippenstift-super-stay-24h-185-rose-dust",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1758059388/assets/pas/images/7d1982bc-694b-4810-b960-6fe336ee29fb/maybelline-new-york-lippenstift-super-stay-24h-185-rose-dust",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747417239/assets/pas/images/760b3b74-f1ac-40ab-883a-1e1cc417e5f9/maybelline-new-york-lippenstift-super-stay-24h-185-rose-dust"
    ],
    "price_eur": 8.95,
    "price_bam": 17.5,
    "cat_handle": "sminka-za-usne",
    "sku": "LOOK-DM-022",
    "brand": "MAYBELLINE NEW YORK"
  },
  {
    "title": "MAYBELLINE NEW YORK - Lippenstift Super Stay Vinyl Ink 903 Amethyst Glimmer Edition, 4,2 ml",
    "handle": "dm-maybelline-new-york-lippenstift-super-stay-vi-23",
    "description": "Originalni MAYBELLINE NEW YORK ruž za usne sa dm.de. Lippenstift Super Stay Vinyl Ink 903 Amethyst Glimmer Edition, 4,2 ml. Dugotrajna postojanost, intenzivna pigmentacija i ugodan osjećaj na usnama.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1787956432/assets/pas/images/28b9f7e9-88cb-4830-abb4-4bc75e048727/maybelline-new-york-lippenstift-super-stay-vinyl-ink-903-amethyst-glimmer-edition",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1787956432/assets/pas/images/28b9f7e9-88cb-4830-abb4-4bc75e048727/maybelline-new-york-lippenstift-super-stay-vinyl-ink-903-amethyst-glimmer-edition",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1780907109/assets/pas/images/cbf2c5d4-47e1-4878-ac72-006f29098fe9/maybelline-new-york-lippenstift-super-stay-vinyl-ink-903-amethyst-glimmer-edition",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1780907117/assets/pas/images/528cbc66-808e-4d50-808d-0523c3fd589a/maybelline-new-york-lippenstift-super-stay-vinyl-ink-903-amethyst-glimmer-edition",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1787956485/assets/pas/images/08c7ba4c-c4e8-413a-b13d-bfaf2043a5aa/maybelline-new-york-lippenstift-super-stay-vinyl-ink-903-amethyst-glimmer-edition"
    ],
    "price_eur": 10.95,
    "price_bam": 21.42,
    "cat_handle": "sminka-za-usne",
    "sku": "LOOK-DM-023",
    "brand": "MAYBELLINE NEW YORK"
  },
  {
    "title": "ARTDECO - Lippenstiftfixierung Magic Fix, 5 ml",
    "handle": "dm-artdeco-lippenstiftfixierung-magic-fix-5-ml-24",
    "description": "Originalni ARTDECO ruž za usne sa dm.de. Lippenstiftfixierung Magic Fix, 5 ml. Dugotrajna postojanost, intenzivna pigmentacija i ugodan osjećaj na usnama.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747446878/assets/pas/images/2324a94f-0838-4a12-95c8-ec872736c8fb/artdeco-lippenstiftfixierung-magic-fix",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747446878/assets/pas/images/2324a94f-0838-4a12-95c8-ec872736c8fb/artdeco-lippenstiftfixierung-magic-fix",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1780783930/assets/pas/images/853d37b7-c5cd-4075-be4c-be9799a1ca3d/artdeco-lippenstiftfixierung-magic-fix",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1780783936/assets/pas/images/faf78579-c755-49f9-9560-28f6fd1b0149/artdeco-lippenstiftfixierung-magic-fix",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1780783933/assets/pas/images/f0e87a69-1d68-453d-8ad6-9f70ba216423/artdeco-lippenstiftfixierung-magic-fix"
    ],
    "price_eur": 12.95,
    "price_bam": 25.33,
    "cat_handle": "sminka-za-usne",
    "sku": "LOOK-DM-024",
    "brand": "ARTDECO"
  },
  {
    "title": "MAYBELLINE NEW YORK - Lippenstift Super Stay Matte Ink 65 Seductress, 5 ml",
    "handle": "dm-maybelline-new-york-lippenstift-super-stay-ma-25",
    "description": "Originalni MAYBELLINE NEW YORK ruž za usne sa dm.de. Lippenstift Super Stay Matte Ink 65 Seductress, 5 ml. Dugotrajna postojanost, intenzivna pigmentacija i ugodan osjećaj na usnama.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755072411/assets/pas/images/314c1f27-f63c-4987-9bfe-a6a8f51116af/maybelline-new-york-lippenstift-super-stay-matte-ink-65-seductress",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755072411/assets/pas/images/314c1f27-f63c-4987-9bfe-a6a8f51116af/maybelline-new-york-lippenstift-super-stay-matte-ink-65-seductress",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1758055580/assets/pas/images/677f267c-0fb6-4720-8496-2f65e373c853/maybelline-new-york-lippenstift-super-stay-matte-ink-65-seductress",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755072406/assets/pas/images/2ae43d1f-6ab6-417a-8c18-528a62d0572c/maybelline-new-york-lippenstift-super-stay-matte-ink-65-seductress",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755072401/assets/pas/images/4305dd64-1afa-4f9a-a640-e2074471e59a/maybelline-new-york-lippenstift-super-stay-matte-ink-65-seductress"
    ],
    "price_eur": 9.95,
    "price_bam": 19.46,
    "cat_handle": "sminka-za-usne",
    "sku": "LOOK-DM-025",
    "brand": "MAYBELLINE NEW YORK"
  }
];

  const productsToCreate = dmProducts
    .filter((p) => !existingHandles.has(p.handle))
    .map((p) => {
      const catList: { id: string }[] = []
      if (rootBeautyCatId) catList.push({ id: rootBeautyCatId })
      if (lipsCatId) catList.push({ id: lipsCatId })

      return {
        title: p.title,
        handle: p.handle,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile?.id,
        sales_channels: [{ id: lookChannel.id }],
        categories: catList,
        thumbnail: p.thumbnail,
        images: p.images.map((url) => ({ url })),
        options: [{ title: "Nijansa", values: ["Standard"] }],
        variants: [
          {
            title: "Standard",
            sku: p.sku,
            options: { Nijansa: "Standard" },
            prices: [
              { amount: p.price_bam, currency_code: "bam" },
              { amount: p.price_eur, currency_code: "eur" },
            ],
          },
        ],
      }
    })

  if (productsToCreate.length === 0) {
    logger.info("ℹ️ Svi ruževi već postoje.")
    return
  }

  await createProductsWorkflow(container).run({
    input: { products: productsToCreate as any },
  })

  logger.info("🎉 Uspješno uvezeno " + productsToCreate.length + " ruževa za Look.ba!")
}
