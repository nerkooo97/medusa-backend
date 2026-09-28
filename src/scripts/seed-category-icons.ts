import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { getAllCategoryIconsMap } from "../config/shops"

export default async function seedCategoryIcons({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productService = container.resolve(Modules.PRODUCT)

  const categoryIcons = getAllCategoryIconsMap()

  logger.info("🏷️ Postavljanje tačnih Lucide ikonica na postojeće kategorije iz centralne konfiguracije...")

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "metadata"],
  })

  for (const cat of categories) {
    const icon = categoryIcons[cat.handle]
    if (icon) {
      await productService.updateProductCategories(cat.id, {
        metadata: {
          ...(cat.metadata || {}),
          icon,
        },
      })
      logger.info(`✅ Postavljena ikonica '${icon}' za kategoriju '${cat.name}' (${cat.handle})`)
    }
  }

  logger.info("🎉 Sve ikonice uspješno ažurirane!")
}
