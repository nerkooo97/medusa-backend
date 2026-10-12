import { model } from "@medusajs/framework/utils"
import { PosRegister } from "./pos-register"

export const PosRegisterOperator = model.define("pos_register_operator", {
  id: model.id().primaryKey(),
  user_id: model.text(), // ID registrovanog korisnika iz Medusa User modula
  role: model.enum(["cashier", "supervisor", "admin"]).default("cashier"),
  pin_code: model.text().nullable(), // Opcioni PIN za brzu touch prijavu na kasi
  is_active: model.boolean().default(true),
  metadata: model.json().nullable(),

  register: model.belongsTo(() => PosRegister, {
    mappedBy: "operators",
  }),
})
