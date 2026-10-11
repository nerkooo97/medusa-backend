import { Module } from "@medusajs/framework/utils"
import ResellerModuleService from "./service"

export const RESELLER_MODULE = "resellerModuleService"

export default Module(RESELLER_MODULE, {
  service: ResellerModuleService,
})
