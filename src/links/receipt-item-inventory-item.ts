import WarehouseModule from "../modules/warehouse"
import InventoryModule from "@medusajs/medusa/inventory"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  InventoryModule.linkable.inventoryItem,
  WarehouseModule.linkable.goodsReceiptItem
)
