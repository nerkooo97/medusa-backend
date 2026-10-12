import PosModule from "../modules/pos"
import StockLocationModule from "@medusajs/medusa/stock-location"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  StockLocationModule.linkable.stockLocation,
  PosModule.linkable.posRegister
)
