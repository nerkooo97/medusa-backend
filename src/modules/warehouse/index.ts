import { Module } from "@medusajs/framework/utils"
import WarehouseModuleService from "./service"

export const WAREHOUSE_MODULE = "warehouseModuleService"

export default Module(WAREHOUSE_MODULE, {
  service: WarehouseModuleService,
})
