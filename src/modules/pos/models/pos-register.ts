import { model } from "@medusajs/framework/utils"
import { PosRegisterOperator } from "./pos-register-operator"
import { PosRegisterSession } from "./pos-register-session"

export const PosRegister = model.define("pos_register", {
  id: model.id().primaryKey(),
  name: model.text(), // npr. "Glavna Kasa 1", "Pult - Salon Centar"
  code: model.text().unique(), // npr. "POS-001", "KASA-01"
  description: model.text().nullable(),
  status: model.enum(["active", "inactive", "maintenance"]).default("active"),

  // Podaci o poslovnoj jedinici (objektu / prodajnom mjestu)
  store_name: model.text(), // Naziv poslovne jedinice npr. "PJ Sarajevo 1"
  store_address: model.text(), // Ulica i broj, npr. "Džemala Bijedića 160"
  store_city: model.text(), // Grad, npr. "Sarajevo"
  store_postal_code: model.text(), // Poštanski broj, npr. "71000"
  store_country_code: model.text().default("ba"),
  store_phone: model.text().nullable(),
  store_email: model.text().nullable(),
  tax_id: model.text().nullable(), // JIB / PIB (ključno za fiskalizaciju u BiH)
  vat_id: model.text().nullable(), // PDV broj (identifikacioni broj obveznika indirektnih poreza)

  // Veza sa Medusa resursima
  sales_channel_id: model.text().nullable(), // Povezani prodajni kanal
  stock_location_id: model.text().nullable(), // Povezani magacin / skladište sa kojeg se skida stanje

  // Načini plaćanja za ovu kasu
  supported_payment_methods: model.json().default(["cash", "card", "wire_transfer"]), // ["cash", "card", "wire_transfer", "voucher"]
  default_payment_method: model.text().default("cash"),

  // Fiskalni printer i hardverska konfiguracija (za BiH fiskalne printere: Tring, HCP, Tremol...)
  fiscal_printer_type: model.text().nullable(), // "tring", "hcp", "tremol", "generic", "none"
  fiscal_printer_ip: model.text().nullable(), // IP adresa mrežnog fiskalnog printera
  fiscal_printer_port: model.number().nullable(), // Port fiskalnog printera
  fiscal_device_serial: model.text().nullable(), // IBFM ili serijski broj fiskalnog uređaja
  receipt_header: model.text().nullable(), // Zaglavlje računa
  receipt_footer: model.text().nullable(), // Podnožje računa (npr. "Hvala na posjeti!")

  // Identifikator za Expo mobilnu / tablet aplikaciju
  device_key: model.text().unique(), // Sigurnosni ključ kase za autorizaciju Expo terminala

  metadata: model.json().nullable(),

  // Relacije
  operators: model.hasMany(() => PosRegisterOperator, {
    mappedBy: "register",
  }),
  sessions: model.hasMany(() => PosRegisterSession, {
    mappedBy: "register",
  }),
})
