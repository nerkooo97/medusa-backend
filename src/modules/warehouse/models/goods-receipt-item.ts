import { model } from "@medusajs/framework/utils"
import { GoodsReceipt } from "./goods-receipt"

export const GoodsReceiptItem = model.define("goods_receipt_item", {
  id: model.id().primaryKey(),
  inventory_item_id: model.text(),
  sku: model.text(),
  title: model.text().nullable(),
  quantity: model.number(),
  unit_cost: model.bigNumber().nullable(),
  total_cost: model.bigNumber().nullable(),
  batch_number: model.text().nullable(),
  goods_receipt: model.belongsTo(() => GoodsReceipt, {
    mappedBy: "items",
  }),
})
