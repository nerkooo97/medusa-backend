import PosModule from "../modules/pos"
import UserModule from "@medusajs/medusa/user"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  UserModule.linkable.user,
  PosModule.linkable.posRegisterOperator
)
