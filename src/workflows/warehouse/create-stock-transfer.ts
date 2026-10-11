import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { WAREHOUSE_MODULE } from "../../modules/warehouse"
import WarehouseModuleService from "../../modules/warehouse/service"

export type CreateStockTransferInput = {
  source_location_id: string
  destination_location_id: string
  notes?: string | null
  created_by?: string | null
  items: {
    inventory_item_id: string
    sku: string
    title?: string | null
    quantity: number
  }[]
}

export const createStockTransferStep = createStep(
  "create-stock-transfer-step",
  async (input: CreateStockTransferInput, { container }) => {
    if (input.source_location_id === input.destination_location_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Izvorni i odredišni magacin ne mogu biti isti."
      )
    }

    if (!input.items || input.items.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Međuskladišnica mora sadržavati barem jedan artikal."
      )
    }

    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    const transfer_number = await warehouseService.generateTransferNumber()

    const createdTransfer = await warehouseService.createStockTransfers({
      transfer_number,
      source_location_id: input.source_location_id,
      destination_location_id: input.destination_location_id,
      notes: input.notes ?? null,
      created_by: input.created_by ?? null,
      status: "draft",
    })

    const items = await warehouseService.createStockTransferItems(
      input.items.map((item) => ({
        stock_transfer_id: createdTransfer.id,
        inventory_item_id: item.inventory_item_id,
        sku: item.sku,
        title: item.title ?? null,
        quantity: item.quantity,
      }))
    )

    return new StepResponse(
      { ...createdTransfer, items },
      createdTransfer.id
    )
  },
  async (transferId: string, { container }) => {
    if (!transferId) return
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    await warehouseService.deleteStockTransfers(transferId)
  }
)

export const createStockTransferWorkflow = createWorkflow(
  "create-stock-transfer-workflow",
  (input: CreateStockTransferInput) => {
    const transfer = createStockTransferStep(input)
    return new WorkflowResponse(transfer)
  }
)
