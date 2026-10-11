import { model } from "@medusajs/framework/utils"
import { MarketplaceConnection } from "./marketplace-connection"
import { MarketplaceListing } from "./marketplace-listing"

export const MarketplaceSyncLog = model.define("marketplace_sync_log", {
  id: model.id().primaryKey(),
  event_type: model.text(), // 'publish', 'stock_sync', 'price_update', 'refresh', 'delete'
  status: model.enum(["success", "error", "warning"]).default("success"),
  payload: model.json().nullable(),
  response: model.json().nullable(),
  error_message: model.text().nullable(),
  connection: model.belongsTo(() => MarketplaceConnection, {
    mappedBy: "sync_logs",
  }),
  listing: model.belongsTo(() => MarketplaceListing, {
    mappedBy: "sync_logs",
  }).nullable(),
})
