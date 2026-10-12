import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RESELLER_MODULE } from "../../../../modules/reseller"
import ResellerModuleService from "../../../../modules/reseller/service"

import { Modules } from "@medusajs/framework/utils"
import { syncResellerOrdersWithMedusa } from "../../../../utils/reseller-order-sync"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const resellerService: ResellerModuleService = req.scope.resolve(RESELLER_MODULE)
  const salesChannelService: any = req.scope.resolve(Modules.SALES_CHANNEL)
  const id = req.params.id

  const reseller = await resellerService.retrieveReseller(id)
  if (!reseller) {
    return res.status(404).json({ message: "Preprodavač nije pronađen." })
  }

  let salesChannels: any[] = []
  try {
    const [scList] = await salesChannelService.listAndCountSalesChannels({})
    salesChannels = scList || []
  } catch (scErr) {
    console.warn("Could not list sales channels:", scErr)
  }

  const assignedChannel = salesChannels.find((sc) => sc.id === reseller.sales_channel_id)

  const [allOrders] = await resellerService.listAndCountResellerOrders(
    { reseller_id: id },
    { order: { created_at: "DESC" } }
  )

  await syncResellerOrdersWithMedusa(allOrders, req.scope)

  const [payouts] = await resellerService.listAndCountResellerPayouts(
    { reseller_id: id },
    { order: { created_at: "DESC" } }
  )

  const totalRetail = allOrders.reduce(
    (sum, o) => sum + (Number(o.retail_total) || 0),
    0
  )
  const totalCommission = allOrders.reduce(
    (sum, o) => sum + (Number(o.commission_earned) || 0),
    0
  )
  const eligibleUnpaid = allOrders
    .filter((o) => o.payout_status === "eligible")
    .reduce((sum, o) => sum + (Number(o.commission_earned) || 0), 0)
  const paidCommission = allOrders
    .filter((o) => o.payout_status === "paid")
    .reduce((sum, o) => sum + (Number(o.commission_earned) || 0), 0)

  res.json({
    reseller: {
      ...reseller,
      sales_channel: assignedChannel
        ? { id: assignedChannel.id, name: assignedChannel.name }
        : null,
      stats: {
        total_orders: allOrders.length,
        pending_orders: allOrders.filter((o) => o.order_status === "pending").length,
        shipped_orders: allOrders.filter((o) => o.order_status === "shipped").length,
        delivered_orders: allOrders.filter((o) => o.order_status === "delivered").length,
        returned_orders: allOrders.filter((o) => o.order_status === "returned").length,
        canceled_orders: allOrders.filter((o) => o.order_status === "canceled").length,
        total_retail: Math.round(totalRetail * 100) / 100,
        total_commission: Math.round(totalCommission * 100) / 100,
        eligible_unpaid: Math.round(eligibleUnpaid * 100) / 100,
        paid_commission: Math.round(paidCommission * 100) / 100,
      },
      orders: allOrders,
      payouts: payouts,
    },
    sales_channels: salesChannels,
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const resellerService: ResellerModuleService = req.scope.resolve(RESELLER_MODULE)
  const id = req.params.id
  const body = req.body as any

  const updateData: Record<string, any> = { id }
  if (body.name !== undefined) updateData.name = body.name
  if (body.contact_person !== undefined) updateData.contact_person = body.contact_person
  if (body.email !== undefined) updateData.email = body.email.toLowerCase().trim()
  if (body.phone !== undefined) updateData.phone = body.phone
  if (body.status !== undefined) updateData.status = body.status
  if (body.commission_type !== undefined) updateData.commission_type = body.commission_type
  if (body.commission_rate !== undefined) updateData.commission_rate = Number(body.commission_rate)
  if (body.sales_channel_id !== undefined) {
    updateData.sales_channel_id =
      body.sales_channel_id === "all" || !body.sales_channel_id
        ? null
        : body.sales_channel_id
  }
  if (body.payout_info !== undefined) updateData.payout_info = body.payout_info

  try {
    const updated = await resellerService.updateResellers(updateData)
    res.json({ reseller: updated })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const resellerService: ResellerModuleService = req.scope.resolve(RESELLER_MODULE)
  const id = req.params.id

  try {
    await resellerService.deleteResellers(id)
    res.json({ success: true, message: "Preprodavač je uspješno obrisan." })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
