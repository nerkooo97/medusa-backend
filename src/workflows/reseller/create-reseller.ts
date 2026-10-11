import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { RESELLER_MODULE } from "../../modules/reseller"
import ResellerModuleService from "../../modules/reseller/service"

export type CreateResellerInput = {
  name: string
  contact_person?: string
  email: string
  phone: string
  commission_type?: "percentage" | "fixed_amount"
  commission_rate?: number
  sales_channel_id?: string
  payout_info?: Record<string, any>
  metadata?: Record<string, any>
}

export const createResellerStep = createStep(
  "create-reseller-step",
  async (input: CreateResellerInput, { container }) => {
    const resellerService: ResellerModuleService = container.resolve(RESELLER_MODULE)

    const apiKey = resellerService.generateApiKey()

    const reseller = await resellerService.createResellers({
      name: input.name,
      contact_person: input.contact_person || null,
      email: input.email.toLowerCase().trim(),
      phone: input.phone,
      commission_type: input.commission_type || "percentage",
      commission_rate: input.commission_rate ?? 10,
      sales_channel_id: input.sales_channel_id || null,
      api_key: apiKey,
      payout_info: input.payout_info || null,
      metadata: input.metadata || null,
    })

    return new StepResponse(reseller, reseller.id)
  },
  async (resellerId: string, { container }) => {
    const resellerService: ResellerModuleService = container.resolve(RESELLER_MODULE)
    await resellerService.deleteResellers(resellerId)
  }
)

export const createResellerWorkflow = createWorkflow(
  "create-reseller-workflow",
  (input: CreateResellerInput) => {
    const reseller = createResellerStep(input)
    return new WorkflowResponse(reseller)
  }
)
