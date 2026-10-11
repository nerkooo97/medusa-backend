import { model } from "@medusajs/framework/utils"
import { StockTransfer } from "./stock-transfer"

export const StockTransferItem = model.define("stock_transfer_item", {
  id: model.id().primaryKey(),
  inventory_item_id: model.text(),
  sku: model.text(),
  title: model.text().nullable(),
  quantity: model.number(),
  stock_transfer: model.belongsTo(() => StockTransfer, {
    mappedBy: "items",
  }),
})
