import { MedusaContainer } from "@medusajs/framework/types"
import { POS_MODULE } from "../modules/pos"
import PosModuleService from "../modules/pos/service"
import { Modules } from "@medusajs/framework/utils"

export default async function testPosModule({ container }: { container: MedusaContainer }) {
  console.log("=== Testiranje POS Modula ===")

  const posService: PosModuleService = container.resolve(POS_MODULE)
  const salesChannelService: any = container.resolve(Modules.SALES_CHANNEL)
  const stockLocationService: any = container.resolve(Modules.STOCK_LOCATION)

  // 1. Dohvat postojećih kanala i skladišta
  const [salesChannels] = await salesChannelService.listAndCountSalesChannels({})
  const [stockLocations] = await stockLocationService.listAndCountStockLocations({})

  console.log(`Dostupno prodajnih kanala: ${salesChannels.length}`)
  console.log(`Dostupno skladišta/magacina: ${stockLocations.length}`)

  const channelId = salesChannels[0]?.id || null
  const locationId = stockLocations[0]?.id || null

  // 2. Kreiranje testne POS kase
  const registerCode = await posService.generateRegisterCode()
  const deviceKey = posService.generateDeviceKey()

  console.log(`Generisan kod za kasu: ${registerCode}`)
  console.log(`Generisan device ključ: ${deviceKey}`)

  const register = await posService.createPosRegisters({
    name: "Glavna Kasa Sarajevo 1",
    code: registerCode,
    description: "POS terminal za maloprodajni objekat Alati Centar",
    status: "active",
    store_name: "Piko Alati - PJ Sarajevo 1",
    store_address: "Džemala Bijedića 160",
    store_city: "Sarajevo",
    store_postal_code: "71000",
    store_country_code: "ba",
    store_phone: "+387 33 123 456",
    store_email: "pos.sarajevo1@pikoalati.ba",
    tax_id: "4201234560001", // JIB
    vat_id: "201234560001", // PDV
    sales_channel_id: channelId,
    stock_location_id: locationId,
    supported_payment_methods: ["cash", "card", "wire_transfer"],
    default_payment_method: "cash",
    fiscal_printer_type: "tring",
    fiscal_printer_ip: "192.168.1.150",
    fiscal_printer_port: 8080,
    fiscal_device_serial: "TRING-IBFM-0042",
    receipt_header: "PIKO ALATI d.o.o.\nPJ Sarajevo 1\nDžemala Bijedića 160",
    receipt_footer: "Hvala na posjeti!\nKupujte sigurno - Piko Alati",
    device_key: deviceKey,
  })

  console.log("✅ Kreirana POS kasa:", {
    id: register.id,
    name: register.name,
    code: register.code,
    store_name: register.store_name,
    tax_id: register.tax_id,
    sales_channel_id: register.sales_channel_id,
    stock_location_id: register.stock_location_id,
  })

  // 3. Test otvaranja smjene
  const session = await posService.openSession({
    register_id: register.id,
    opened_by_user_id: "usr_admin_test",
    opening_cash: 200, // 200 KM početnog depozita
    notes: "Jutarnja smjena otvorena",
  })

  console.log("✅ Otvorena testna smjena:", {
    id: session.id,
    status: session.status,
    opening_cash: session.opening_cash,
  })

  // 4. Test dohvat aktivne smjene
  const active = await posService.getActiveSession(register.id)
  console.log("✅ Trenutno aktivna smjena:", active?.id)

  // 5. Test zatvaranja smjene
  const closed = await posService.closeSession({
    session_id: session.id,
    closed_by_user_id: "usr_admin_test",
    closing_cash: 850,
    notes: "Smjena uspješno završena sa 850 KM",
  })

  console.log("✅ Zatvorena smjena:", {
    id: closed.id,
    status: closed.status,
    closing_cash: closed.closing_cash,
  })

  console.log("=== POS Modul uspješno testiran! ===")
}
