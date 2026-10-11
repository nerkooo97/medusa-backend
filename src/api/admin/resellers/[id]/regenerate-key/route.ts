import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RESELLER_MODULE } from "../../../../../modules/reseller"
import ResellerModuleService from "../../../../../modules/reseller/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const resellerService: ResellerModuleService = req.scope.resolve(RESELLER_MODULE)
  const id = req.params.id

  const reseller = await resellerService.retrieveReseller(id)
  if (!reseller) {
    return res.status(404).json({ message: "Preprodavač nije pronađen." })
  }

  const newApiKey = resellerService.generateApiKey()
  const updated = await resellerService.updateResellers({
    id,
    api_key: newApiKey,
  })

  res.json({
    reseller: updated,
    api_key: newApiKey,
    message: "Novi API ključ je uspješno generisan.",
  })
}
