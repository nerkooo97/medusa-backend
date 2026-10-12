import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../../../modules/pos"
import PosModuleService from "../../../../../../modules/pos/service"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const salesChannelService: any = req.scope.resolve(Modules.SALES_CHANNEL)
  const stockLocationService: any = req.scope.resolve(Modules.STOCK_LOCATION)
  const userService: any = req.scope.resolve(Modules.USER)

  const id = req.params.id

  let register: any
  try {
    register = await posService.retrievePosRegister(id, {
      relations: ["operators", "sessions"],
    })
  } catch (err: any) {
    return res.status(404).json({ message: "POS kasa nije pronađena." })
  }

  // Opcionalna provjera device ključa ako je poslan u headeru
  const authDeviceKey = req.headers["x-pos-device-key"] as string | undefined
  if (authDeviceKey && authDeviceKey !== register.device_key) {
    return res.status(401).json({ message: "Neispravan sigurnosni ključ kase (x-pos-device-key)." })
  }

  let salesChannel: any = null
  let stockLocation: any = null
  let users: any[] = []

  if (register.sales_channel_id) {
    try {
      salesChannel = await salesChannelService.retrieveSalesChannel(register.sales_channel_id)
    } catch (err) {
      console.warn("Could not retrieve sales channel:", err)
    }
  }

  if (register.stock_location_id) {
    try {
      stockLocation = await stockLocationService.retrieveStockLocation(register.stock_location_id)
    } catch (err) {
      console.warn("Could not retrieve stock location:", err)
    }
  }

  try {
    const [uList] = await userService.listAndCountUsers({})
    users = uList || []
  } catch (err) {
    console.warn("Could not list users:", err)
  }

  // Lista ovlaštenih operatera pripremljena za Expo aplikaciju (bez izlaganja samog PIN koda!)
  const authorizedOperators = (register.operators || [])
    .filter((op: any) => op.is_active)
    .map((op: any) => {
      const u = users.find((usr) => usr.id === op.user_id)
      return {
        operator_id: op.id,
        user_id: op.user_id,
        role: op.role,
        has_pin: Boolean(op.pin_code),
        name: u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email : "Nepoznat operater",
        email: u?.email || null,
      }
    })

  const activeSession = (register.sessions || []).find((s: any) => s.status === "open")

  // Standardni nazivi načina plaćanja
  const paymentLabels: Record<string, string> = {
    cash: "Gotovina",
    card: "Platna kartica",
    wire_transfer: "Žiralno / Virman",
    voucher: "Poklon bon",
  }

  const paymentMethodsFormatted = (register.supported_payment_methods || ["cash", "card"]).map((method: string) => ({
    id: method,
    label: paymentLabels[method] || method,
    is_default: method === register.default_payment_method,
  }))

  res.json({
    terminal: {
      id: register.id,
      name: register.name,
      code: register.code,
      status: register.status,
      unit: {
        name: register.store_name,
        address: register.store_address,
        city: register.store_city,
        postal_code: register.store_postal_code,
        country_code: register.store_country_code,
        phone: register.store_phone,
        email: register.store_email,
        tax_id: register.tax_id, // JIB / PIB
        vat_id: register.vat_id, // PDV broj
      },
      sales_channel: salesChannel
        ? {
            id: salesChannel.id,
            name: salesChannel.name,
            description: salesChannel.description,
          }
        : null,
      stock_location: stockLocation
        ? {
            id: stockLocation.id,
            name: stockLocation.name,
          }
        : null,
      payment_methods: paymentMethodsFormatted,
      fiscal_hardware: {
        type: register.fiscal_printer_type || "none",
        ip: register.fiscal_printer_ip,
        port: register.fiscal_printer_port,
        device_serial: register.fiscal_device_serial,
        receipt_header: register.receipt_header,
        receipt_footer: register.receipt_footer,
      },
      current_session: activeSession
        ? {
            id: activeSession.id,
            status: activeSession.status,
            opened_at: activeSession.opened_at,
            opening_cash: activeSession.opening_cash,
            opened_by_user_id: activeSession.opened_by_user_id,
          }
        : null,
      operators: authorizedOperators,
    },
  })
}
