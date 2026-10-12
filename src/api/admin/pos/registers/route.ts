import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../modules/pos"
import PosModuleService from "../../../../modules/pos/service"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const salesChannelService: any = req.scope.resolve(Modules.SALES_CHANNEL)
  const stockLocationService: any = req.scope.resolve(Modules.STOCK_LOCATION)
  const userService: any = req.scope.resolve(Modules.USER)

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

  const filters: Record<string, any> = {}
  if (req.query.status) {
    filters.status = req.query.status
  }
  if (req.query.store_city) {
    filters.store_city = req.query.store_city
  }

  const [registers, count] = await posService.listAndCountPosRegisters(filters, {
    relations: ["operators", "sessions"],
    skip: offset,
    take: limit,
    order: { created_at: "DESC" },
  })

  // Dohvatamo povezane nazive kanala i skladišta
  let salesChannels: any[] = []
  let stockLocations: any[] = []
  let users: any[] = []

  try {
    const [scList] = await salesChannelService.listAndCountSalesChannels({})
    salesChannels = scList || []
  } catch (err) {
    console.warn("Could not list sales channels:", err)
  }

  try {
    const [slList] = await stockLocationService.listAndCountStockLocations({})
    stockLocations = slList || []
  } catch (err) {
    console.warn("Could not list stock locations:", err)
  }

  try {
    const [uList] = await userService.listAndCountUsers({})
    users = uList || []
  } catch (err) {
    console.warn("Could not list users:", err)
  }

  const enrichedRegisters = registers.map((reg: any) => {
    const sc = salesChannels.find((s) => s.id === reg.sales_channel_id)
    const sl = stockLocations.find((l) => l.id === reg.stock_location_id)
    const activeSession = (reg.sessions || []).find((s: any) => s.status === "open")

    const operatorsWithDetails = (reg.operators || []).map((op: any) => {
      const u = users.find((usr) => usr.id === op.user_id)
      return {
        ...op,
        user: u
          ? {
              id: u.id,
              email: u.email,
              first_name: u.first_name,
              last_name: u.last_name,
            }
          : null,
      }
    })

    return {
      ...reg,
      sales_channel: sc ? { id: sc.id, name: sc.name } : null,
      stock_location: sl ? { id: sl.id, name: sl.name } : null,
      operators: operatorsWithDetails,
      active_session: activeSession || null,
      operators_count: (reg.operators || []).length,
    }
  })

  res.json({
    registers: enrichedRegisters,
    count,
    limit,
    offset,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const body = req.body as any

  if (!body.name) {
    return res.status(400).json({ message: "Polje 'name' (naziv kase) je obavezno." })
  }
  if (!body.store_name) {
    return res.status(400).json({ message: "Polje 'store_name' (naziv poslovne jedinice) je obavezno." })
  }
  if (!body.store_address) {
    return res.status(400).json({ message: "Polje 'store_address' (adresa poslovne jedinice) je obavezno." })
  }
  if (!body.store_city) {
    return res.status(400).json({ message: "Polje 'store_city' (grad) je obavezno." })
  }

  try {
    // Generisanje šifre kase ako nije unijeta
    const code = body.code?.trim() || (await posService.generateRegisterCode())
    const deviceKey = body.device_key?.trim() || posService.generateDeviceKey()

    // Kreiranje POS kase
    const createdRegister = await posService.createPosRegisters({
      name: body.name,
      code,
      description: body.description || null,
      status: body.status || "active",

      store_name: body.store_name,
      store_address: body.store_address,
      store_city: body.store_city,
      store_postal_code: body.store_postal_code || "",
      store_country_code: body.store_country_code || "ba",
      store_phone: body.store_phone || null,
      store_email: body.store_email || null,
      tax_id: body.tax_id || null,
      vat_id: body.vat_id || null,

      sales_channel_id: body.sales_channel_id || null,
      stock_location_id: body.stock_location_id || null,

      supported_payment_methods: body.supported_payment_methods || ["cash", "card", "wire_transfer"],
      default_payment_method: body.default_payment_method || "cash",

      fiscal_printer_type: body.fiscal_printer_type || "none",
      fiscal_printer_ip: body.fiscal_printer_ip || null,
      fiscal_printer_port: body.fiscal_printer_port ? Number(body.fiscal_printer_port) : null,
      fiscal_device_serial: body.fiscal_device_serial || null,
      receipt_header: body.receipt_header || null,
      receipt_footer: body.receipt_footer || null,

      device_key: deviceKey,
      metadata: body.metadata || null,
    })

    // Ako su proslijeđeni inicijalni korisnici / kasiri za ovu kasu
    if (Array.isArray(body.operators) && body.operators.length > 0) {
      for (const op of body.operators) {
        if (op.user_id) {
          await posService.createPosRegisterOperators({
            register_id: createdRegister.id,
            user_id: op.user_id,
            role: op.role || "cashier",
            pin_code: op.pin_code || null,
            is_active: op.is_active !== undefined ? Boolean(op.is_active) : true,
          })
        }
      }
    }

    // Povezivanje preko link servisa ako postoje sales_channel_id i stock_location_id
    const remoteLink = req.scope.resolve("remoteLink") as any
    if (remoteLink && body.sales_channel_id) {
      try {
        await remoteLink.create({
          [Modules.SALES_CHANNEL]: { sales_channel_id: body.sales_channel_id },
          [POS_MODULE]: { pos_register_id: createdRegister.id },
        })
      } catch (linkErr) {
        console.warn("Could not link sales channel to pos register:", linkErr)
      }
    }

    if (remoteLink && body.stock_location_id) {
      try {
        await remoteLink.create({
          [Modules.STOCK_LOCATION]: { stock_location_id: body.stock_location_id },
          [POS_MODULE]: { pos_register_id: createdRegister.id },
        })
      } catch (linkErr) {
        console.warn("Could not link stock location to pos register:", linkErr)
      }
    }

    const completeRegister = await posService.retrievePosRegister(createdRegister.id, {
      relations: ["operators"],
    })

    res.status(201).json({ register: completeRegister })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
