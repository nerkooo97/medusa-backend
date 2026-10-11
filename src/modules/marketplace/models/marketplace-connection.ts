import { model } from "@medusajs/framework/utils"
import { MarketplaceCategoryMapping } from "./marketplace-category-mapping"
import { MarketplaceFieldMapping } from "./marketplace-field-mapping"
import { MarketplaceListing } from "./marketplace-listing"
import { MarketplaceSyncLog } from "./marketplace-sync-log"

export const MarketplaceConnection = model.define("marketplace_connection", {
  id: model.id().primaryKey(),
  name: model.text(),
  provider_id: model.text(), // 'olx', 'allegro', etc.
  sales_channel_id: model.text(),
  auth_type: model.enum(["credentials_login", "credentials", "bearer_token", "api_key", "client_tokens", "oauth2"]).default("credentials_login"),
  credentials: model.json(), // { username, password, token, client_id, etc. }
  base_url: model.text().nullable(),
  is_active: model.boolean().default(true),
  auto_sync_stock: model.boolean().default(true),
  auto_sync_prices: model.boolean().default(false),
  default_stock_location_id: model.text().nullable(),
  default_settings: model.json().nullable(), // { city_id, country_id, default_state, etc. }
  metadata: model.json().nullable(),
  category_mappings: model.hasMany(() => MarketplaceCategoryMapping, {
    mappedBy: "connection",
  }),
  field_mappings: model.hasMany(() => MarketplaceFieldMapping, {
    mappedBy: "connection",
  }),
  listings: model.hasMany(() => MarketplaceListing, {
    mappedBy: "connection",
  }),
  sync_logs: model.hasMany(() => MarketplaceSyncLog, {
    mappedBy: "connection",
  }),
})
