import PosModule from "../modules/pos"
import SalesChannelModule from "@medusajs/medusa/sales-channel"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  SalesChannelModule.linkable.salesChannel,
  PosModule.linkable.posRegister
)
