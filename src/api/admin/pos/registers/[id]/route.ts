import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../../modules/pos"
import PosModuleService from "../../../../../modules/pos/service"
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

  const operatorsWithDetails = (register.operators || []).map((op: any) => {
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

  const activeSession = (register.sessions || []).find((s: any) => s.status === "open")

  res.json({
    register: {
      ...register,
      sales_channel: salesChannel ? { id: salesChannel.id, name: salesChannel.name } : null,
      stock_location: stockLocation ? { id: stockLocation.id, name: stockLocation.name } : null,
      operators: operatorsWithDetails,
      active_session: activeSession || null,
    },
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const id = req.params.id
  const body = req.body as any

  try {
    const updateData: Record<string, any> = { id }

    if (body.name !== undefined) updateData.name = body.name
    if (body.code !== undefined) updateData.code = body.code
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status

    if (body.store_name !== undefined) updateData.store_name = body.store_name
    if (body.store_address !== undefined) updateData.store_address = body.store_address
    if (body.store_city !== undefined) updateData.store_city = body.store_city
    if (body.store_postal_code !== undefined) updateData.store_postal_code = body.store_postal_code
    if (body.store_country_code !== undefined) updateData.store_country_code = body.store_country_code
    if (body.store_phone !== undefined) updateData.store_phone = body.store_phone
    if (body.store_email !== undefined) updateData.store_email = body.store_email
    if (body.tax_id !== undefined) updateData.tax_id = body.tax_id
    if (body.vat_id !== undefined) updateData.vat_id = body.vat_id

    if (body.sales_channel_id !== undefined) updateData.sales_channel_id = body.sales_channel_id
    if (body.stock_location_id !== undefined) updateData.stock_location_id = body.stock_location_id

    if (body.supported_payment_methods !== undefined) {
      updateData.supported_payment_methods = body.supported_payment_methods
    }
    if (body.default_payment_method !== undefined) {
      updateData.default_payment_method = body.default_payment_method
    }

    if (body.fiscal_printer_type !== undefined) updateData.fiscal_printer_type = body.fiscal_printer_type
    if (body.fiscal_printer_ip !== undefined) updateData.fiscal_printer_ip = body.fiscal_printer_ip
    if (body.fiscal_printer_port !== undefined) {
      updateData.fiscal_printer_port = body.fiscal_printer_port ? Number(body.fiscal_printer_port) : null
    }
    if (body.fiscal_device_serial !== undefined) updateData.fiscal_device_serial = body.fiscal_device_serial
    if (body.receipt_header !== undefined) updateData.receipt_header = body.receipt_header
    if (body.receipt_footer !== undefined) updateData.receipt_footer = body.receipt_footer

    if (body.metadata !== undefined) updateData.metadata = body.metadata

    const updated = await posService.updatePosRegisters(updateData)

    res.json({ register: updated })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const id = req.params.id

  try {
    await posService.deletePosRegisters(id)
    res.json({ success: true, message: "POS kasa je uspješno obrisana." })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
