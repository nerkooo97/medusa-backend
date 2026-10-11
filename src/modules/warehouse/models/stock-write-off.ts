import { model } from "@medusajs/framework/utils"
import { StockWriteOffItem } from "./stock-write-off-item"

export const StockWriteOff = model.define("stock_write_off", {
  id: model.id().primaryKey(),
  write_off_number: model.text().unique(),
  stock_location_id: model.text(),
  reason: model.enum([
    "damaged",
    "expired",
    "lost",
    "internal_use",
    "other",
  ]).default("damaged"),
  status: model.enum(["draft", "posted", "cancelled"]).default("draft"),
  notes: model.text().nullable(),
  commission_members: model.text().nullable(),
  created_by: model.text().nullable(),
  posted_at: model.dateTime().nullable(),
  items: model.hasMany(() => StockWriteOffItem, {
    mappedBy: "stock_write_off",
  }),
})
