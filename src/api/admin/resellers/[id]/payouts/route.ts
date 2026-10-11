import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { processResellerPayoutWorkflow } from "../../../../../workflows/reseller/process-reseller-payout"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const resellerId = req.params.id
  const { amount, order_ids, payment_method, reference_number, notes } = req.body as any

  try {
    const { result } = await processResellerPayoutWorkflow(req.scope).run({
      input: {
        reseller_id: resellerId,
        amount: amount ? Number(amount) : undefined,
        order_ids,
        payment_method,
        reference_number,
        notes,
      },
    })

    res.status(201).json({
      success: true,
      payout: result.payout,
      orders_paid_count: result.ordersPaidCount,
      message: `Isplata od ${result.payout.amount} KM je uspješno zabilježena.`,
    })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
