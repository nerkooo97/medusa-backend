import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { WAREHOUSE_MODULE } from "../../modules/warehouse"
import WarehouseModuleService from "../../modules/warehouse/service"

export type CreateStockWriteOffInput = {
  stock_location_id: string
  reason: "damaged" | "expired" | "lost" | "internal_use" | "other"
  notes?: string | null
  commission_members?: string | null
  created_by?: string | null
  items: {
    inventory_item_id: string
    sku: string
    title?: string | null
    quantity: number
    unit_cost?: number | null
    total_cost?: number | null
    item_notes?: string | null
  }[]
}

export const createStockWriteOffStep = createStep(
  "create-stock-write-off-step",
  async (input: CreateStockWriteOffInput, { container }) => {
    if (!input.stock_location_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Magacin je obavezan za zapisnik o otpisu."
      )
    }

    if (!input.items || input.items.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Zapisnik o otpisu mora sadržavati barem jedan artikal."
      )
    }

    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    const write_off_number = await warehouseService.generateWriteOffNumber()

    const createdWriteOff = await warehouseService.createStockWriteOffs({
      write_off_number,
      stock_location_id: input.stock_location_id,
      reason: input.reason || "damaged",
      notes: input.notes ?? null,
      commission_members: input.commission_members ?? null,
      created_by: input.created_by ?? null,
      status: "draft",
    })

    const items = await warehouseService.createStockWriteOffItems(
      input.items.map((item) => ({
        stock_write_off_id: createdWriteOff.id,
        inventory_item_id: item.inventory_item_id,
        sku: item.sku,
        title: item.title ?? null,
        quantity: item.quantity,
        unit_cost: item.unit_cost ?? null,
        total_cost:
          item.total_cost ??
          (item.unit_cost ? item.unit_cost * item.quantity : null),
        item_notes: item.item_notes ?? null,
      }))
    )

    return new StepResponse(
      { ...createdWriteOff, items },
      createdWriteOff.id
    )
  },
  async (writeOffId: string, { container }) => {
    if (!writeOffId) return
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    await warehouseService.deleteStockWriteOffs(writeOffId)
  }
)

export const createStockWriteOffWorkflow = createWorkflow(
  "create-stock-write-off-workflow",
  (input: CreateStockWriteOffInput) => {
    const writeOff = createStockWriteOffStep(input)
    return new WorkflowResponse(writeOff)
  }
)
