import { Module } from "@medusajs/framework/utils"
import PosModuleService from "./service"

export const POS_MODULE = "posModuleService"

export default Module(POS_MODULE, {
  service: PosModuleService,
})
