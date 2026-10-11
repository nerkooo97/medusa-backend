import { model } from "@medusajs/framework/utils"
import { MarketplaceConnection } from "./marketplace-connection"

export const MarketplaceCategoryMapping = model.define("marketplace_category_mapping", {
  id: model.id().primaryKey(),
  medusa_category_id: model.text(),
  external_category_id: model.text(), // e.g. '15' (Laptops na OLX)
  external_category_name: model.text().nullable(),
  auto_publish: model.boolean().default(false),
  metadata: model.json().nullable(),
  connection: model.belongsTo(() => MarketplaceConnection, {
    mappedBy: "category_mappings",
  }),
})
