import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WAREHOUSE_MODULE } from "../../../../modules/warehouse"
import WarehouseModuleService from "../../../../modules/warehouse/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const warehouseService: WarehouseModuleService = req.scope.resolve(WAREHOUSE_MODULE)

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

  const filters: Record<string, any> = {}
  if (req.query.inventory_item_id) {
    filters.inventory_item_id = req.query.inventory_item_id
  }
  if (req.query.stock_location_id) {
    filters.stock_location_id = req.query.stock_location_id
  }
  if (req.query.document_type) {
    filters.document_type = req.query.document_type
  }
  if (req.query.document_id) {
    filters.document_id = req.query.document_id
  }

  const [movements, count] = await warehouseService.listAndCountStockMovements(
    filters,
    {
      skip: offset,
      take: limit,
      order: { created_at: "DESC" },
    }
  )

  res.json({
    stock_movements: movements,
    count,
    limit,
    offset,
  })
}
