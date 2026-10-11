import WarehouseModule from "../modules/warehouse"
import StockLocationModule from "@medusajs/medusa/stock-location"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  StockLocationModule.linkable.stockLocation,
  WarehouseModule.linkable.goodsReceipt
)
