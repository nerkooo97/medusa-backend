import { model } from "@medusajs/framework/utils"
import { Reseller } from "./reseller"
import { ResellerPayout } from "./reseller-payout"

export const ResellerOrder = model.define("reseller_order", {
  id: model.id().primaryKey(),
  order_id: model.text().unique(), // ID Medusa Ordera
  customer_name: model.text(),
  customer_phone: model.text(),
  customer_address: model.text(),
  customer_city: model.text(),
  customer_postal_code: model.text().nullable(),
  retail_total: model.bigNumber().default(0), // Ukupan iznos koji kupac plaća (MPC)
  reseller_cost: model.bigNumber().default(0), // Nabavna cijena preprodavača (MPC umanjen za popust)
  commission_earned: model.bigNumber().default(0), // Zarada preprodavača
  order_status: model.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "returned",
    "canceled",
  ]).default("pending"),
  payout_status: model.enum([
    "unearned", // dok paket nije isporučen
    "eligible", // isporučeno, spremno za isplatu
    "paid",     // isplaćeno preprodavaču
  ]).default("unearned"),
  reseller: model.belongsTo(() => Reseller, {
    mappedBy: "orders",
  }),
  payout: model.belongsTo(() => ResellerPayout, {
    mappedBy: "orders",
  }).nullable(),
})
