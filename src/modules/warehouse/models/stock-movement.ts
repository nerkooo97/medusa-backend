import { model } from "@medusajs/framework/utils"

export const StockMovement = model.define("stock_movement", {
  id: model.id().primaryKey(),
  inventory_item_id: model.text(),
  stock_location_id: model.text(),
  sku: model.text().nullable(),
  quantity_change: model.number(),
  balance_after: model.number().nullable(),
  document_type: model.enum([
    "receipt",
    "transfer_dispatch",
    "transfer_receive",
    "order_fulfillment",
    "adjustment",
  ]),
  document_id: model.text(),
  reference_number: model.text().nullable(),
  notes: model.text().nullable(),
  created_by: model.text().nullable(),
})
