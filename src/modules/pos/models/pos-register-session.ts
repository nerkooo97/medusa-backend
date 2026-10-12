import { model } from "@medusajs/framework/utils"
import { PosRegister } from "./pos-register"

export const PosRegisterSession = model.define("pos_register_session", {
  id: model.id().primaryKey(),
  opened_by_user_id: model.text(),
  closed_by_user_id: model.text().nullable(),
  status: model.enum(["open", "closed"]).default("open"),
  opened_at: model.dateTime(),
  closed_at: model.dateTime().nullable(),
  opening_cash: model.bigNumber().default(0), // Početni depozit u gotovini (polog)
  closing_cash: model.bigNumber().nullable(), // Završno stanje gotovine u kasi
  expected_cash: model.bigNumber().nullable(), // Očekivana gotovina
  notes: model.text().nullable(),
  metadata: model.json().nullable(),

  register: model.belongsTo(() => PosRegister, {
    mappedBy: "sessions",
  }),
})
