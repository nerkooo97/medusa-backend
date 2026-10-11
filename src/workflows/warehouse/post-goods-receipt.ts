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

export type PostGoodsReceiptInput = {
  id: string
  posted_by?: string | null
}

export const validateAndPrepareReceiptStep = createStep(
  "validate-and-prepare-receipt-step",
  async (input: PostGoodsReceiptInput, { container }) => {
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)

    const receipt = await warehouseService.retrieveGoodsReceipt(input.id, {
      relations: ["items"],
    })

    if (!receipt) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Prijemnica sa ID '${input.id}' nije pronađena.`
      )
    }

    if (receipt.status !== "draft") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Samo prijemnice u statusu 'draft' se mogu proknjižiti. Trenutni status: '${receipt.status}'.`
      )
    }

    if (!receipt.items || receipt.items.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Prijemnica nema unešenih stavki.`
      )
    }

    // Priprema za adjustInventoryLevelsStep (količine su pozitivne jer je ULAZ)
    const adjustments = receipt.items.map((item) => ({
      inventory_item_id: item.inventory_item_id,
      location_id: receipt.stock_location_id,
      adjustment: item.quantity,
    }))

    return new StepResponse({ receipt, adjustments })
  }
)

export const recordStockMovementsAndPostReceiptStep = createStep(
  "record-stock-movements-and-post-receipt-step",
  async (
    input: {
      receipt: any
      posted_by?: string | null
    },
    { container }
  ) => {
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    const { receipt, posted_by } = input

    // 1. Zabilježi svaki ulaz u audit ledger (StockMovement)
    const movementsData = receipt.items.map((item: any) => ({
      inventory_item_id: item.inventory_item_id,
      stock_location_id: receipt.stock_location_id,
      sku: item.sku,
      quantity_change: item.quantity,
      document_type: "receipt",
      document_id: receipt.id,
      reference_number: receipt.receipt_number,
      notes: `Prijemnica ${receipt.receipt_number} od ${receipt.supplier_name} (Faktura: ${receipt.invoice_number})`,
      created_by: posted_by ?? receipt.created_by ?? null,
    }))

    await warehouseService.createStockMovements(movementsData)

    // 2. Ažuriraj status prijemnice na 'posted'
    const updatedReceipt = await warehouseService.updateGoodsReceipts({
      id: receipt.id,
      status: "posted",
      received_at: new Date(),
    })

    return new StepResponse(updatedReceipt, { receiptId: receipt.id })
  },
  async (compensateData: { receiptId: string } | undefined, { container }) => {
    if (!compensateData?.receiptId) return
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    // Vraćanje statusa na draft ako dođe do pada
    await warehouseService.updateGoodsReceipts({
      id: compensateData.receiptId,
      status: "draft",
      received_at: null,
    })
  }
)

export const postGoodsReceiptWorkflow = createWorkflow(
  "post-goods-receipt-workflow",
  (input: PostGoodsReceiptInput) => {
    const { receipt, adjustments } = validateAndPrepareReceiptStep(input)

    // Uvećava zalihe u Medusa Core Inventory modulu
    adjustInventoryLevelsStep(adjustments)

    // Zapisuje audit trag i zaključava prijemnicu
    const finalReceipt = recordStockMovementsAndPostReceiptStep({
      receipt,
      posted_by: input.posted_by,
    })

    return new WorkflowResponse(finalReceipt)
  }
)
