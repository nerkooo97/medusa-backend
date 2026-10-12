import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../../../modules/pos"
import PosModuleService from "../../../../../../modules/pos/service"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const userService: any = req.scope.resolve(Modules.USER)
  const registerId = req.params.id
  const { user_id, role, pin_code, is_active } = req.body as any

  if (!user_id) {
    return res.status(400).json({ message: "Polje 'user_id' je obavezno." })
  }

  try {
    // Provjera da li korisnik postoji u User modulu
    const user = await userService.retrieveUser(user_id)
    if (!user) {
      return res.status(404).json({ message: "Korisnik sa zadatim ID-em ne postoji." })
    }

    // Provjera da li je već dodijeljen ovoj kasi
    const [existing] = await posService.listAndCountPosRegisterOperators({
      register_id: registerId,
      user_id: user_id,
    })

    if (existing.length > 0) {
      return res.status(400).json({ message: "Ovaj korisnik je već dodijeljen ovoj kasi." })
    }

    const createdOperator = await posService.createPosRegisterOperators({
      register_id: registerId,
      user_id,
      role: role || "cashier",
      pin_code: pin_code || null,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    })

    // Kreiramo remote link ka User modulu ako je dostupan
    const remoteLink = req.scope.resolve("remoteLink") as any
    if (remoteLink) {
      try {
        await remoteLink.create({
          [Modules.USER]: { user_id },
          [POS_MODULE]: { pos_register_operator_id: createdOperator.id },
        })
      } catch (linkErr) {
        console.warn("Could not link user to pos operator:", linkErr)
      }
    }

    res.status(201).json({
      operator: {
        ...createdOperator,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      },
    })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
