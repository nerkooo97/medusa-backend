import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../../../modules/pos"
import PosModuleService from "../../../../../../modules/pos/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const registerId = req.params.id

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

  const [sessions, count] = await posService.listAndCountPosRegisterSessions(
    { register_id: registerId },
    {
      skip: offset,
      take: limit,
      order: { opened_at: "DESC" },
    }
  )

  res.json({
    sessions,
    count,
    limit,
    offset,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const registerId = req.params.id
  const { action, opening_cash, closing_cash, user_id, notes, session_id } = req.body as any

  try {
    if (action === "open") {
      if (!user_id) {
        return res.status(400).json({ message: "Polje 'user_id' je obavezno za otvaranje smjene." })
      }

      const session = await posService.openSession({
        register_id: registerId,
        opened_by_user_id: user_id,
        opening_cash: opening_cash !== undefined ? Number(opening_cash) : 0,
        notes,
      })

      return res.status(201).json({ session })
    }

    if (action === "close") {
      if (!session_id) {
        return res.status(400).json({ message: "Polje 'session_id' je obavezno za zatvaranje smjene." })
      }
      if (!user_id) {
        return res.status(400).json({ message: "Polje 'user_id' je obavezno za zatvaranje smjene." })
      }

      const session = await posService.closeSession({
        session_id,
        closed_by_user_id: user_id,
        closing_cash: closing_cash !== undefined ? Number(closing_cash) : 0,
        notes,
      })

      return res.json({ session })
    }

    return res.status(400).json({
      message: "Polje 'action' mora biti 'open' ili 'close'.",
    })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
