import { model } from "@medusajs/framework/utils"
import { MarketplaceConnection } from "./marketplace-connection"
import { MarketplaceSyncLog } from "./marketplace-sync-log"

export const MarketplaceListing = model.define("marketplace_listing", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  variant_id: model.text().nullable(),
  external_id: model.text(), // ID na oglasniku, npr. '40'
  external_url: model.text().nullable(), // npr. 'https://olx.ba/artikal/40'
  status: model.enum(["draft", "active", "hidden", "finished", "failed"]).default("draft"),
  last_synced_price: model.bigNumber().nullable(),
  last_synced_quantity: model.number().default(0),
  sync_hash: model.text().nullable(),
  last_synced_at: model.dateTime().nullable(),
  last_sync_error: model.text().nullable(),
  external_data: model.json().nullable(),
  connection: model.belongsTo(() => MarketplaceConnection, {
    mappedBy: "listings",
  }),
  sync_logs: model.hasMany(() => MarketplaceSyncLog, {
    mappedBy: "listing",
  }),
})
