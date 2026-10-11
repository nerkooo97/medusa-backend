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

export type ReceiveStockTransferInput = {
  id: string
  received_by?: string | null
}

export const validateAndPrepareReceiveStep = createStep(
  "validate-and-prepare-receive-step",
  async (input: ReceiveStockTransferInput, { container }) => {
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

    if (transfer.status !== "in_transit") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Samo međuskladišnice u statusu 'in_transit' se mogu zaprimiti na odredištu. Trenutni status: '${transfer.status}'.`
      )
    }

    // Dodajemo zalihe na odredišni magacin (pozitivno prilagođavanje)
    const adjustments = transfer.items.map((item) => ({
      inventory_item_id: item.inventory_item_id,
      location_id: transfer.destination_location_id,
      adjustment: item.quantity,
    }))

    return new StepResponse({ transfer, adjustments })
  }
)

export const recordReceiveMovementsStep = createStep(
  "record-receive-movements-step",
  async (
    input: {
      transfer: any
      received_by?: string | null
    },
    { container }
  ) => {
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    const { transfer, received_by } = input

    // Zabilježi prijem u audit ledger
    const movementsData = transfer.items.map((item: any) => ({
      inventory_item_id: item.inventory_item_id,
      stock_location_id: transfer.destination_location_id,
      sku: item.sku,
      quantity_change: item.quantity,
      document_type: "transfer_receive",
      document_id: transfer.id,
      reference_number: transfer.transfer_number,
      notes: `Prijem transfera ${transfer.transfer_number} na odredište`,
      created_by: received_by ?? null,
    }))

    await warehouseService.createStockMovements(movementsData)

    const updatedTransfer = await warehouseService.updateStockTransfers({
      id: transfer.id,
      status: "completed",
      received_at: new Date(),
    })

    return new StepResponse(updatedTransfer, { transferId: transfer.id })
  },
  async (compensateData: { transferId: string } | undefined, { container }) => {
    if (!compensateData?.transferId) return
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    await warehouseService.updateStockTransfers({
      id: compensateData.transferId,
      status: "in_transit",
      received_at: null,
    })
  }
)

export const receiveStockTransferWorkflow = createWorkflow(
  "receive-stock-transfer-workflow",
  (input: ReceiveStockTransferInput) => {
    const { transfer, adjustments } = validateAndPrepareReceiveStep(input)

    // Dodaj zalihe na odredišni magacin
    adjustInventoryLevelsStep(adjustments)

    // Ažuriraj status na completed i zabilježi audit
    const finalTransfer = recordReceiveMovementsStep({
      transfer,
      received_by: input.received_by,
    })

    return new WorkflowResponse(finalTransfer)
  }
)
