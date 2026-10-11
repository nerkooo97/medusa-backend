import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { RESELLER_MODULE } from "../../modules/reseller"
import ResellerModuleService from "../../modules/reseller/service"

export type ProcessResellerPayoutInput = {
  reseller_id: string
  amount?: number
  order_ids?: string[]
  payment_method?: string
  reference_number?: string
  notes?: string
}

export const processResellerPayoutStep = createStep(
  "process-reseller-payout-step",
  async (input: ProcessResellerPayoutInput, { container }) => {
    const resellerService: ResellerModuleService = container.resolve(RESELLER_MODULE)

    const reseller = await resellerService.retrieveReseller(input.reseller_id)
    if (!reseller) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Preprodavač sa ID '${input.reseller_id}' nije pronađen.`
      )
    }

    // Pronađi narudžbe spremne za isplatu
    let ordersToPay: any[] = []
    if (input.order_ids && input.order_ids.length > 0) {
      const [orders] = await resellerService.listAndCountResellerOrders({
        id: input.order_ids,
        reseller_id: reseller.id,
      })
      ordersToPay = orders
    } else {
      const [orders] = await resellerService.listAndCountResellerOrders({
        reseller_id: reseller.id,
        payout_status: "eligible",
      })
      ordersToPay = orders
    }

    if (ordersToPay.length === 0 && !input.amount) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Nema isporučenih narudžbi spremnih za isplatu za ovog preprodavača.`
      )
    }

    // Izračunaj ukupan iznos ako nije eksplicitno poslan
    const totalAmount =
      input.amount ??
      ordersToPay.reduce((sum, o) => sum + (Number(o.commission_earned) || 0), 0)

    // 1. Kreiraj zapis o isplati
    const payout = await resellerService.createResellerPayouts({
      reseller_id: reseller.id,
      amount: totalAmount,
      payment_method: input.payment_method || "bank_transfer",
      reference_number: input.reference_number || null,
      status: "completed",
      notes: input.notes || null,
      paid_at: new Date(),
    })

    // 2. Ažuriraj status narudžbi na 'paid'
    for (const ord of ordersToPay) {
      await resellerService.updateResellerOrders({
        id: ord.id,
        payout_status: "paid",
        payout_id: payout.id,
      })
    }

    return new StepResponse(
      { payout, ordersPaidCount: ordersToPay.length },
      payout.id
    )
  }
)

export const processResellerPayoutWorkflow = createWorkflow(
  "process-reseller-payout-workflow",
  (input: ProcessResellerPayoutInput) => {
    const result = processResellerPayoutStep(input)
    return new WorkflowResponse(result)
  }
)
