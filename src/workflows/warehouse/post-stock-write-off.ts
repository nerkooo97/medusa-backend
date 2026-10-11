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

export type PostStockWriteOffInput = {
  id: string
  posted_by?: string | null
}

export const validateAndPrepareWriteOffStep = createStep(
  "validate-and-prepare-write-off-step",
  async (input: PostStockWriteOffInput, { container }) => {
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)

    const writeOff = await warehouseService.retrieveStockWriteOff(input.id, {
      relations: ["items"],
    })

    if (!writeOff) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Zapisnik o otpisu sa ID '${input.id}' nije pronađen.`
      )
    }

    if (writeOff.status !== "draft") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Samo zapisnici u statusu 'draft' se mogu proknjižiti. Trenutni status: '${writeOff.status}'.`
      )
    }

    if (!writeOff.items || writeOff.items.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Zapisnik o otpisu nema unešenih stavki.`
      )
    }

    // Skidanje zaliha (negativno prilagođavanje za svaki artikal)
    const adjustments = writeOff.items.map((item) => ({
      inventory_item_id: item.inventory_item_id,
      location_id: writeOff.stock_location_id,
      adjustment: -item.quantity,
    }))

    return new StepResponse({ writeOff, adjustments })
  }
)

export const recordStockMovementsAndPostWriteOffStep = createStep(
  "record-stock-movements-and-post-write-off-step",
  async (
    input: {
      writeOff: any
      posted_by?: string | null
    },
    { container }
  ) => {
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    const { writeOff, posted_by } = input

    // 1. Zabilježi svaki rashod u audit ledger (StockMovement)
    const movementsData = writeOff.items.map((item: any) => ({
      inventory_item_id: item.inventory_item_id,
      stock_location_id: writeOff.stock_location_id,
      sku: item.sku,
      quantity_change: -item.quantity, // Negativna promjena / izlaz zbog rashoda
      document_type: "adjustment",
      document_id: writeOff.id,
      reference_number: writeOff.write_off_number,
      notes: `Zapisnik o rashodu ${writeOff.write_off_number} (Razlog: ${writeOff.reason}${item.item_notes ? `, ${item.item_notes}` : ""})`,
      created_by: posted_by ?? writeOff.created_by ?? null,
    }))

    await warehouseService.createStockMovements(movementsData)

    // 2. Ažuriraj status zapisnika na 'posted'
    const updatedWriteOff = await warehouseService.updateStockWriteOffs({
      id: writeOff.id,
      status: "posted",
      posted_at: new Date(),
    })

    return new StepResponse(updatedWriteOff, { writeOffId: writeOff.id })
  },
  async (compensateData: { writeOffId: string } | undefined, { container }) => {
    if (!compensateData?.writeOffId) return
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    await warehouseService.updateStockWriteOffs({
      id: compensateData.writeOffId,
      status: "draft",
      posted_at: null,
    })
  }
)

export const postStockWriteOffWorkflow = createWorkflow(
  "post-stock-write-off-workflow",
  (input: PostStockWriteOffInput) => {
    const { writeOff, adjustments } = validateAndPrepareWriteOffStep(input)

    // Automatski skini zalihe u Medusa Core Inventory modulu
    adjustInventoryLevelsStep(adjustments)

    const postedWriteOff = recordStockMovementsAndPostWriteOffStep({
      writeOff,
      posted_by: input.posted_by,
    })

    return new WorkflowResponse(postedWriteOff)
  }
)
