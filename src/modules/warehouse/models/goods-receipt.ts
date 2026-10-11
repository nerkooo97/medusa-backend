import { model } from "@medusajs/framework/utils"
import { GoodsReceiptItem } from "./goods-receipt-item"

export const GoodsReceipt = model.define("goods_receipt", {
  id: model.id().primaryKey(),
  receipt_number: model.text().unique(),
  supplier_name: model.text(),
  invoice_number: model.text(),
  invoice_date: model.dateTime().nullable(),
  received_at: model.dateTime().nullable(),
  stock_location_id: model.text(),
  status: model.enum(["draft", "posted", "cancelled"]).default("draft"),
  notes: model.text().nullable(),
  created_by: model.text().nullable(),
  items: model.hasMany(() => GoodsReceiptItem, {
    mappedBy: "goods_receipt",
  }),
})
