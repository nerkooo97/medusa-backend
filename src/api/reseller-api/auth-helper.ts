import { MedusaRequest } from "@medusajs/framework/http"
import { RESELLER_MODULE } from "../../modules/reseller"
import ResellerModuleService from "../../modules/reseller/service"

export async function authenticateReseller(req: MedusaRequest) {
  const apiKey =
    (req.headers["x-reseller-api-key"] as string) ||
    (req.query.api_key as string) ||
    (req.headers["authorization"]?.replace(/^Bearer\s+/i, "") as string)

  if (!apiKey) {
    throw new Error("Nedostaje 'x-reseller-api-key' zaglavlje za autentifikaciju.")
  }

  const resellerService: ResellerModuleService = req.scope.resolve(RESELLER_MODULE)
  const [resellers] = await resellerService.listAndCountResellers({
    api_key: apiKey,
  })

  if (resellers.length === 0) {
    throw new Error("Nevažeći API ključ preprodavača.")
  }

  const reseller = resellers[0]
  if (reseller.status !== "active") {
    throw new Error("Korisnički račun preprodavača je deaktiviran ili blokiran.")
  }

  return { reseller, resellerService }
}
