import { model } from "@medusajs/framework/utils"
import { Reseller } from "./reseller"
import { ResellerOrder } from "./reseller-order"

export const ResellerPayout = model.define("reseller_payout", {
  id: model.id().primaryKey(),
  amount: model.bigNumber(),
  payment_method: model.text().default("bank_transfer"),
  reference_number: model.text().nullable(),
  status: model.enum(["pending", "completed", "canceled"]).default("completed"),
  notes: model.text().nullable(),
  paid_at: model.dateTime().nullable(),
  reseller: model.belongsTo(() => Reseller, {
    mappedBy: "payouts",
  }),
  orders: model.hasMany(() => ResellerOrder, {
    mappedBy: "payout",
  }),
})
