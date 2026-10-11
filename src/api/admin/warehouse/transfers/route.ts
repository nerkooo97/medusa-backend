import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WAREHOUSE_MODULE } from "../../../../modules/warehouse"
import WarehouseModuleService from "../../../../modules/warehouse/service"
import { createStockTransferWorkflow } from "../../../../workflows/warehouse/create-stock-transfer"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const warehouseService: WarehouseModuleService = req.scope.resolve(WAREHOUSE_MODULE)

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

  const filters: Record<string, any> = {}
  if (req.query.status) {
    filters.status = req.query.status
  }
  if (req.query.source_location_id) {
    filters.source_location_id = req.query.source_location_id
  }
  if (req.query.destination_location_id) {
    filters.destination_location_id = req.query.destination_location_id
  }

  const [transfers, count] = await warehouseService.listAndCountStockTransfers(
    filters,
    {
      relations: ["items"],
      skip: offset,
      take: limit,
      order: { created_at: "DESC" },
    }
  )

  res.json({
    stock_transfers: transfers,
    count,
    limit,
    offset,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any

  const { result } = await createStockTransferWorkflow(req.scope).run({
    input: {
      ...body,
      created_by: (req as any).auth_context?.actor_id ?? null,
    },
  })

  res.status(201).json({
    stock_transfer: result,
  })
}
