import { model } from "@medusajs/framework/utils"
import { StockTransferItem } from "./stock-transfer-item"

export const StockTransfer = model.define("stock_transfer", {
  id: model.id().primaryKey(),
  transfer_number: model.text().unique(),
  source_location_id: model.text(),
  destination_location_id: model.text(),
  status: model.enum(["draft", "in_transit", "completed", "cancelled"]).default("draft"),
  dispatched_at: model.dateTime().nullable(),
  received_at: model.dateTime().nullable(),
  notes: model.text().nullable(),
  created_by: model.text().nullable(),
  items: model.hasMany(() => StockTransferItem, {
    mappedBy: "stock_transfer",
  }),
})
