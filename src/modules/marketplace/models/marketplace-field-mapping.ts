import { model } from "@medusajs/framework/utils"
import { MarketplaceConnection } from "./marketplace-connection"

export const MarketplaceFieldMapping = model.define("marketplace_field_mapping", {
  id: model.id().primaryKey(),
  external_category_id: model.text().nullable(), // Null = globalno mapiranje za sve kategorije
  external_attribute_id: model.text(), // npr. '901' (broj vrata), 'state', 'brand_id'
  external_attribute_name: model.text().nullable(),
  source_type: model.enum([
    "product_field",
    "variant_field",
    "metadata",
    "fixed_value",
    "template"
  ]).default("fixed_value"),
  source_key: model.text(), // npr. 'title', 'metadata.ram', 'new'
  default_value: model.text().nullable(),
  value_mappings: model.json().nullable(), // rječnik konverzije: { "Rabljeno": "used", "Novo": "new" }
  transformation: model.text().nullable(), // 'uppercase', 'lowercase', 'trim'
  connection: model.belongsTo(() => MarketplaceConnection, {
    mappedBy: "field_mappings",
  }),
})
