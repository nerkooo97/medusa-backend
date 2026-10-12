import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../../../modules/pos"
import PosModuleService from "../../../../../../modules/pos/service"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const userService: any = req.scope.resolve(Modules.USER)
  const registerId = req.params.id
  const { user_id, pin_code } = req.body as any

  if (!user_id) {
    return res.status(400).json({ message: "Polje 'user_id' je obavezno." })
  }

  try {
    const validation = await posService.validateOperator(registerId, user_id, pin_code)

    if (!validation.valid || !validation.operator) {
      return res.status(401).json({
        success: false,
        message: validation.message || "Neautorizovan pristup.",
        requires_pin: validation.requires_pin || false,
      })
    }

    const operator = validation.operator
    const user = await userService.retrieveUser(user_id)
    const activeSession = await posService.getActiveSession(registerId)

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
