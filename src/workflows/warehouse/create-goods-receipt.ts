import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { WAREHOUSE_MODULE } from "../../modules/warehouse"
import WarehouseModuleService from "../../modules/warehouse/service"

export type CreateGoodsReceiptInput = {
  supplier_name: string
  invoice_number: string
  invoice_date?: Date | string | null
  stock_location_id: string
  notes?: string | null
  created_by?: string | null
  items: {
    inventory_item_id: string
    sku: string
    title?: string | null
    quantity: number
    unit_cost?: number | null
    total_cost?: number | null
    batch_number?: string | null
  }[]
}

export const createGoodsReceiptStep = createStep(
  "create-goods-receipt-step",
  async (input: CreateGoodsReceiptInput, { container }) => {
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)

    // Automatski generiši sekvencijalni broj prijemnice
    const receipt_number = await warehouseService.generateReceiptNumber()

    const createdReceipt = await warehouseService.createGoodsReceipts({
      receipt_number,
      supplier_name: input.supplier_name,
      invoice_number: input.invoice_number,
      invoice_date: input.invoice_date ? new Date(input.invoice_date) : null,
      stock_location_id: input.stock_location_id,
      notes: input.notes ?? null,
      created_by: input.created_by ?? null,
      status: "draft",
    })

    const items = await warehouseService.createGoodsReceiptItems(
      input.items.map((item) => ({
        goods_receipt_id: createdReceipt.id,
        inventory_item_id: item.inventory_item_id,
        sku: item.sku,
        title: item.title ?? null,
        quantity: item.quantity,
        unit_cost: item.unit_cost ?? null,
        total_cost:
          item.total_cost ??
          (item.unit_cost ? item.unit_cost * item.quantity : null),
        batch_number: item.batch_number ?? null,
      }))
    )

    return new StepResponse(
      { ...createdReceipt, items },
      createdReceipt.id
    )
  },
  async (receiptId: string, { container }) => {
    if (!receiptId) return
    const warehouseService: WarehouseModuleService = container.resolve(WAREHOUSE_MODULE)
    await warehouseService.deleteGoodsReceipts(receiptId)
  }
)

export const createGoodsReceiptWorkflow = createWorkflow(
  "create-goods-receipt-workflow",
  (input: CreateGoodsReceiptInput) => {
    const receipt = createGoodsReceiptStep(input)
    return new WorkflowResponse(receipt)
  }
)
