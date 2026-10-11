import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { WAREHOUSE_MODULE } from "../../../../../modules/warehouse"
import WarehouseModuleService from "../../../../../modules/warehouse/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const warehouseService: WarehouseModuleService = req.scope.resolve(WAREHOUSE_MODULE)
  const { id } = req.params

  const receipt = await warehouseService.retrieveGoodsReceipt(id, {
    relations: ["items"],
  })

  if (!receipt) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Prijemnica sa ID '${id}' nije pronađena.`
    )
  }

  res.json({
    goods_receipt: receipt,
  })
}
