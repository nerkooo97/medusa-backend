import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { WAREHOUSE_MODULE } from "../../../../../modules/warehouse"
import WarehouseModuleService from "../../../../../modules/warehouse/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const warehouseService: WarehouseModuleService = req.scope.resolve(WAREHOUSE_MODULE)
  const { id } = req.params

  const transfer = await warehouseService.retrieveStockTransfer(id, {
    relations: ["items"],
  })

  if (!transfer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Međuskladišnica sa ID '${id}' nije pronađena.`
    )
  }

  res.json({
    stock_transfer: transfer,
  })
}
