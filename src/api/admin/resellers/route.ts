import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RESELLER_MODULE } from "../../../modules/reseller"
import ResellerModuleService from "../../../modules/reseller/service"
import { createResellerWorkflow } from "../../../workflows/reseller/create-reseller"

import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const resellerService: ResellerModuleService = req.scope.resolve(RESELLER_MODULE)
  const salesChannelService: any = req.scope.resolve(Modules.SALES_CHANNEL)

  const [resellers] = await resellerService.listAndCountResellers(
    {},
    { order: { created_at: "DESC" } }
  )

  let salesChannels: any[] = []
  try {
    const [scList] = await salesChannelService.listAndCountSalesChannels({})
    salesChannels = scList || []
  } catch (scErr) {
    console.warn("Could not list sales channels:", scErr)
  }

  // Za svakog preprodavača izračunaj statistiku i spoji kanal prodaje
  const results = await Promise.all(
    resellers.map(async (r: any) => {
      const [orders] = await resellerService.listAndCountResellerOrders({
        reseller_id: r.id,
      })

      const totalRetail = orders.reduce(
        (sum, o) => sum + (Number(o.retail_total) || 0),
        0
      )
      const totalCommission = orders.reduce(
        (sum, o) => sum + (Number(o.commission_earned) || 0),
        0
      )
      const eligibleUnpaid = orders
        .filter((o) => o.payout_status === "eligible")
        .reduce((sum, o) => sum + (Number(o.commission_earned) || 0), 0)
      const paidCommission = orders
        .filter((o) => o.payout_status === "paid")
        .reduce((sum, o) => sum + (Number(o.commission_earned) || 0), 0)

      const assignedChannel = salesChannels.find((sc) => sc.id === r.sales_channel_id)

      return {
        ...r,
        sales_channel: assignedChannel
          ? { id: assignedChannel.id, name: assignedChannel.name }
          : null,
        stats: {
          total_orders: orders.length,
          delivered_orders: orders.filter((o) => o.order_status === "delivered").length,
          returned_orders: orders.filter((o) => o.order_status === "returned").length,
          total_retail: Math.round(totalRetail * 100) / 100,
          total_commission: Math.round(totalCommission * 100) / 100,
          eligible_unpaid: Math.round(eligibleUnpaid * 100) / 100,
          paid_commission: Math.round(paidCommission * 100) / 100,
        },
      }
    })
  )

  res.json({ resellers: results, sales_channels: salesChannels })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const {
    name,
    contact_person,
    email,
    phone,
    commission_type,
    commission_rate,
    sales_channel_id,
    payout_info,
    metadata,
  } = req.body as any

  if (!name || !email || !phone) {
    return res.status(400).json({
      message: "Polja 'name', 'email' i 'phone' su obavezna.",
    })
  }

  try {
    const { result } = await createResellerWorkflow(req.scope).run({
      input: {
        name,
        contact_person,
        email,
        phone,
        commission_type: commission_type || "percentage",
        commission_rate: Number(commission_rate) || 10,
        sales_channel_id: sales_channel_id || null,
        payout_info: payout_info || null,
        metadata: metadata || null,
      },
    })

    res.status(201).json({ reseller: result })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
