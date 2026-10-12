import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../../../../modules/pos"
import PosModuleService from "../../../../../../../modules/pos/service"

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const operatorId = req.params.operator_id
  const body = req.body as any

  try {
    const updateData: Record<string, any> = { id: operatorId }

    if (body.role !== undefined) updateData.role = body.role
    if (body.pin_code !== undefined) updateData.pin_code = body.pin_code
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active)
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    const updated = await posService.updatePosRegisterOperators(updateData)

    res.json({ operator: updated })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const operatorId = req.params.operator_id

  try {
    await posService.deletePosRegisterOperators(operatorId)
    res.json({ success: true, message: "Korisnik je uklonjen sa kase." })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
