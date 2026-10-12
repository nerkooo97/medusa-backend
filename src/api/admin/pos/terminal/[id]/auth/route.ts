import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../../../modules/pos"
import PosModuleService from "../../../../../../modules/pos/service"
import { Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = false

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const userService: any = req.scope.resolve(Modules.USER)
  const registerParam = req.params.id
  const { user_id, pin_code } = req.body as any

  if (!user_id) {
    return res.status(400).json({ message: "Polje 'user_id' je obavezno." })
  }

  // Razrešavanje stvarnog ID-a kase ako je proslijeđen kod (npr. POS-01 ili POS-001)
  let targetRegisterId = registerParam
  try {
    const reg = await posService.retrievePosRegister(registerParam)
    targetRegisterId = reg.id
  } catch (err) {
    try {
      const [byCode] = await posService.listAndCountPosRegisters({ code: registerParam }, { take: 1 })
      if (byCode && byCode.length > 0) {
        targetRegisterId = byCode[0].id
      } else {
        const normalized = registerParam.replace(/POS-0*(\d+)/i, (_m, num) => `POS-${num.padStart(3, "0")}`)
        const [byNorm] = await posService.listAndCountPosRegisters({ code: normalized }, { take: 1 })
        if (byNorm && byNorm.length > 0) {
          targetRegisterId = byNorm[0].id
        }
      }
    } catch (searchErr) {
      console.warn("Greška pri traženju kase:", searchErr)
    }
  }

  try {
    const validation = await posService.validateOperator(targetRegisterId, user_id, pin_code)

    if (!validation.valid || !validation.operator) {
      return res.status(401).json({
        success: false,
        message: validation.message || "Neautorizovan pristup.",
        requires_pin: validation.requires_pin || false,
      })
    }

    const operator = validation.operator
    if (!operator) {
      return res.status(401).json({ success: false, message: "Operater nije pronađen." })
    }
    const user = await userService.retrieveUser(user_id)
    const activeSession = await posService.getActiveSession(targetRegisterId)

    res.json({
      success: true,
      operator: {
        operator_id: operator.id,
        user_id: operator.user_id,
        role: operator.role,
        name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email : "Operater",
        email: user?.email || null,
      },
      current_session: activeSession
        ? {
            id: activeSession.id,
            status: activeSession.status,
            opened_at: activeSession.opened_at,
            opening_cash: activeSession.opening_cash,
          }
        : null,
    })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
