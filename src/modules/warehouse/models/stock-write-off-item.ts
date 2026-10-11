import { model } from "@medusajs/framework/utils"
import { StockWriteOff } from "./stock-write-off"

export const StockWriteOffItem = model.define("stock_write_off_item", {
  id: model.id().primaryKey(),
  inventory_item_id: model.text(),
  sku: model.text(),
  title: model.text().nullable(),
  quantity: model.number(),
  unit_cost: model.bigNumber().nullable(),
  total_cost: model.bigNumber().nullable(),
  item_notes: model.text().nullable(),
  stock_write_off: model.belongsTo(() => StockWriteOff, {
    mappedBy: "items",
  }),
})
