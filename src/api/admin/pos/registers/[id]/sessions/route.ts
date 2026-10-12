import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../../../modules/pos"
import PosModuleService from "../../../../../../modules/pos/service"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const registerParam = req.params.id

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
        const [byDev] = await posService.listAndCountPosRegisters({ device_key: registerParam }, { take: 1 })
        if (byDev && byDev.length > 0) {
          targetRegisterId = byDev[0].id
        }
      }
    } catch {}
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

  const [sessions, count] = await posService.listAndCountPosRegisterSessions(
    { register_id: targetRegisterId },
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
  const registerParam = req.params.id
  const { action, opening_cash, closing_cash, user_id, notes, session_id } = req.body as any

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
        const [byDev] = await posService.listAndCountPosRegisters({ device_key: registerParam }, { take: 1 })
        if (byDev && byDev.length > 0) {
          targetRegisterId = byDev[0].id
        }
      }
    } catch {}
  }

  // Obavezna provjera: Šifra kase i Device Key se moraju poklopiti
  const authDeviceKey = (req.headers["x-pos-device-key"] as string | undefined)?.trim()
  try {
    const reg = await posService.retrievePosRegister(targetRegisterId)
    if (reg?.device_key && (!authDeviceKey || authDeviceKey !== reg.device_key)) {
      return res.status(401).json({ message: "Neispravan ili nedostaje sigurnosni Device Key kase." })
    }
  } catch {}

  try {
    if (action === "open") {
      if (!user_id) {
        return res.status(400).json({ message: "Polje 'user_id' je obavezno za otvaranje smjene." })
      }

      const session = await posService.openSession({
        register_id: targetRegisterId,
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
