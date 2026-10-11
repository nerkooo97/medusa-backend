import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WAREHOUSE_MODULE } from "../../../../../modules/warehouse"
import WarehouseModuleService from "../../../../../modules/warehouse/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const warehouseService: WarehouseModuleService = req.scope.resolve(WAREHOUSE_MODULE)

  const writeOff = await warehouseService.retrieveStockWriteOff(id, {
    relations: ["items"],
  })

  if (!writeOff) {
    res.status(404).json({ message: `Zapisnik o otpisu ${id} nije pronađen.` })
    return
  }

  res.json({
    stock_write_off: writeOff,
  })
}
