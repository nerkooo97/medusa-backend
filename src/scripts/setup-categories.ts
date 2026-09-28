import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { getAllShops } from "../config/shops"

export default async function setupCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("📁 Pokrećem kreiranje i strukturiranje kategorija iz centralnog registra shopova...")

  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "parent_category_id"],
  })

  const shops = getAllShops()

  for (const shop of shops) {
    logger.info(`📦 Provjeravam kategorije za shop: ${shop.name} (${shop.id})...`)

    // 1. Glavna / Root kategorija
    let rootCategory = existingCategories.find((c: any) => c.handle === shop.rootCategory.handle)
    if (!rootCategory) {
      logger.info(`Kreiram glavnu kategoriju '${shop.rootCategory.name}'...`)
      const { result: [created] } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: shop.rootCategory.name,
              handle: shop.rootCategory.handle,
              is_active: true,
              metadata: { channel: shop.channel.handle },
            },
          ],
        },
      })
      rootCategory = created
    }

    // 2. Podkategorije sa ikonama
    const subcategoriesToCreate = shop.categories.filter(
      (sub) => !existingCategories.some((ec: any) => ec.handle === sub.handle)
    )

    if (subcategoriesToCreate.length > 0 && rootCategory) {
      logger.info(`Kreiram ${subcategoriesToCreate.length} novih podkategorija za ${shop.name}...`)
      await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: subcategoriesToCreate.map((c) => ({
            name: c.name,
            handle: c.handle,
            parent_category_id: rootCategory.id,
            is_active: true,
            metadata: {
              channel: shop.channel.handle,
              icon: c.icon,
            },
          })),
        },
      })
      logger.info(`✅ Podkategorije za '${shop.name}' uspješno kreirane!`)
    }
  }

  // 3. Povezivanje artikala sa odgovarajućim kategorijama
  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"],
  })

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
  })

  const productCategoryMapping: Record<string, string> = {
    "aku-busilica-18v-pro": "aku-alati",
    "set-rucnog-alata-108": "rucni-alati",
    "ugaona-brusilica-1200w": "elektricni-alati",
    "hidratantni-serum-sa-hijaluronom": "njega-lica",
    "paleta-sjenila-nude-glam-12-boja": "sjenila-palete",
    "mat-ruz-za-usne-velvet-red": "sminka-za-usne",
  }

  for (const [prodHandle, catHandle] of Object.entries(productCategoryMapping)) {
    const product = products.find((p: any) => p.handle === prodHandle)
    const category = allCategories.find((c: any) => c.handle === catHandle)

    if (product && category) {
      await updateProductsWorkflow(container).run({
        input: {
          products: [
            {
              id: product.id,
              category_ids: [category.id],
            },
          ],
        },
      })
      logger.info(`  -> Artikal '${product.title}' dodijeljen u kategoriju '${category.name}' (${category.handle})`)
    }
  }

  logger.info("🎉 Strukturiranje kategorija uspješno završeno!")
}
