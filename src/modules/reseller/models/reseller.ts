import { model } from "@medusajs/framework/utils"
import { ResellerOrder } from "./reseller-order"
import { ResellerPayout } from "./reseller-payout"

export const Reseller = model.define("reseller", {
  id: model.id().primaryKey(),
  name: model.text(),
  contact_person: model.text().nullable(),
  email: model.text().unique(),
  phone: model.text(),
  status: model.enum(["active", "inactive", "blocked"]).default("active"),
  commission_type: model.enum(["percentage", "fixed_amount"]).default("percentage"),
  commission_rate: model.bigNumber().default(10), // npr. 10% ili 10 KM
  sales_channel_id: model.text().nullable(),
  api_key: model.text().unique(),
  payout_info: model.json().nullable(), // { bank_name, account_number, recipient_name, iban }
  metadata: model.json().nullable(),
  orders: model.hasMany(() => ResellerOrder, {
    mappedBy: "reseller",
  }),
  payouts: model.hasMany(() => ResellerPayout, {
    mappedBy: "reseller",
  }),
})
