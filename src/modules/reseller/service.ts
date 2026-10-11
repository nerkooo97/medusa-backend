import { MedusaService } from "@medusajs/framework/utils"
import { Reseller } from "./models/reseller"
import { ResellerOrder } from "./models/reseller-order"
import { ResellerPayout } from "./models/reseller-payout"
import crypto from "crypto"

class ResellerModuleService extends MedusaService({
  Reseller,
  ResellerOrder,
  ResellerPayout,
}) {
  /**
   * Generiše jedinstveni sigurni API ključ za preprodavača
   */
  generateApiKey(): string {
    const randomHex = crypto.randomBytes(24).toString("hex")
    return `res_key_${randomHex}`
  }

  /**
   * Izračunava proviziju i nabavni trošak na osnovu postavki preprodavača
   */
  calculateCommission(
    reseller: { commission_type: string; commission_rate: any },
    retailTotal: number
  ) {
    const rate = Number(reseller.commission_rate) || 0
    let commission = 0

    if (reseller.commission_type === "percentage") {
      commission = Math.round((retailTotal * (rate / 100)) * 100) / 100
    } else {
      commission = Math.min(retailTotal, rate)
    }

    const resellerCost = Math.max(0, Math.round((retailTotal - commission) * 100) / 100)

    return {
      retailTotal,
      resellerCost,
      commission,
    }
  }
}

export default ResellerModuleService
