import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { adjustInventoryLevelsStep } from "@medusajs/medusa/core-flows"
import { MedusaError } from "@medusajs/framework/utils"
import { WAREHOUSE_MODULE } from "../../modules/warehouse"
import WarehouseModuleService from "../../modules/warehouse/service"

export type DispatchStockTransferInput = {
  id: string
  dispatched_by?: string | null
}

export const validateAndPrepareDispatchStep = createStep(
  "validate-and-prepare-dispatch-step",
  async (input: DispatchStockTransferInput, { container }) => {
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)

    const transfer = await warehouseService.retrieveStockTransfer(input.id, {
      relations: ["items"],
    })

    if (!transfer) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Međuskladišnica sa ID '${input.id}' nije pronađena.`
      )
    }

    if (transfer.status !== "draft") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Samo međuskladišnice u statusu 'draft' se mogu otpremiti. Trenutni status: '${transfer.status}'.`
      )
    }

    // Oduzimamo zalihe sa izvornog magacina (negativno prilagođavanje)
    const adjustments = transfer.items.map((item) => ({
      inventory_item_id: item.inventory_item_id,
      location_id: transfer.source_location_id,
      adjustment: -item.quantity,
    }))

    return new StepResponse({ transfer, adjustments })
  }
)

export const recordDispatchMovementsStep = createStep(
  "record-dispatch-movements-step",
  async (
    input: {
      transfer: any
      dispatched_by?: string | null
    },
    { container }
  ) => {
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    const { transfer, dispatched_by } = input

    // Zabilježi izlaz u audit ledger
    const movementsData = transfer.items.map((item: any) => ({
      inventory_item_id: item.inventory_item_id,
      stock_location_id: transfer.source_location_id,
      sku: item.sku,
      quantity_change: -item.quantity,
      document_type: "transfer_dispatch",
      document_id: transfer.id,
      reference_number: transfer.transfer_number,
      notes: `Otprema transfera ${transfer.transfer_number} ka odredištu`,
      created_by: dispatched_by ?? transfer.created_by ?? null,
    }))

    await warehouseService.createStockMovements(movementsData)

    const updatedTransfer = await warehouseService.updateStockTransfers({
      id: transfer.id,
      status: "in_transit",
      dispatched_at: new Date(),
    })

    return new StepResponse(updatedTransfer, { transferId: transfer.id })
  },
  async (compensateData: { transferId: string } | undefined, { container }) => {
    if (!compensateData?.transferId) return
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    await warehouseService.updateStockTransfers({
      id: compensateData.transferId,
      status: "draft",
      dispatched_at: null,
    })
  }
)

export const dispatchStockTransferWorkflow = createWorkflow(
  "dispatch-stock-transfer-workflow",
  (input: DispatchStockTransferInput) => {
    const { transfer, adjustments } = validateAndPrepareDispatchStep(input)

    // Oduzmi zalihe sa polaznog magacina
    adjustInventoryLevelsStep(adjustments)

    // Ažuriraj status na in_transit i zabilježi audit
    const finalTransfer = recordDispatchMovementsStep({
      transfer,
      dispatched_by: input.dispatched_by,
    })

    return new WorkflowResponse(finalTransfer)
  }
)
