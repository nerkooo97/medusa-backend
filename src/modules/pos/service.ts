import { MedusaService } from "@medusajs/framework/utils"
import { PosRegister } from "./models/pos-register"
import { PosRegisterOperator } from "./models/pos-register-operator"
import { PosRegisterSession } from "./models/pos-register-session"
import crypto from "crypto"

class PosModuleService extends MedusaService({
  PosRegister,
  PosRegisterOperator,
  PosRegisterSession,
}) {
  /**
   * Generiše jedinstveni sigurnosni ključ kase za Expo tablet / mobilnu aplikaciju
   */
  generateDeviceKey(): string {
    return `pos_dev_${crypto.randomBytes(16).toString("hex")}`
  }

  /**
   * Generiše sekvencijalnu šifru kase u formatu POS-001, POS-002...
   */
  async generateRegisterCode(): Promise<string> {
    const [, count] = await this.listAndCountPosRegisters()
    const nextNumber = (count + 1).toString().padStart(3, "0")
    return `POS-${nextNumber}`
  }

  /**
   * Pronalazi aktivnu (otvorenu) smjenu za zadatu kasu
   */
  async getActiveSession(registerId: string) {
    const [sessions] = await this.listAndCountPosRegisterSessions(
      {
        register_id: registerId,
        status: "open",
      },
      {
        take: 1,
        order: { opened_at: "DESC" },
      }
    )
    return sessions.length > 0 ? sessions[0] : null
  }

  /**
   * Otvara novu smjenu na kasi
   */
  async openSession(data: {
    register_id: string
    opened_by_user_id: string
    opening_cash?: number
    notes?: string
  }) {
    const existing = await this.getActiveSession(data.register_id)
    if (existing) {
      throw new Error("Kasa već ima aktivnu otvorenu smjenu. Zatvorite prethodnu smjenu prije otvaranja nove.")
    }

    return await this.createPosRegisterSessions({
      register_id: data.register_id,
      opened_by_user_id: data.opened_by_user_id,
      opening_cash: data.opening_cash ?? 0,
      status: "open",
      opened_at: new Date(),
      notes: data.notes || null,
    })
  }

  /**
   * Zatvara postojeću smjenu na kasi
   */
  async closeSession(data: {
    session_id: string
    closed_by_user_id: string
    closing_cash: number
    notes?: string
  }) {
    const session = await this.retrievePosRegisterSession(data.session_id)
    if (!session) {
      throw new Error("Smjena nije pronađena.")
    }
    if (session.status === "closed") {
      throw new Error("Smjena je već zatvorena.")
    }

    return await this.updatePosRegisterSessions({
      id: data.session_id,
      closed_by_user_id: data.closed_by_user_id,
      closing_cash: data.closing_cash,
      status: "closed",
      closed_at: new Date(),
      notes: data.notes ?? session.notes,
    })
  }

  /**
   * Provjera da li korisnik ima pristup kasi i validacija PIN koda (ako je postavljen)
   */
  async validateOperator(registerId: string, userId: string, pinCode?: string) {
    const [operators] = await this.listAndCountPosRegisterOperators({
      register_id: registerId,
      user_id: userId,
      is_active: true,
    })

    if (!operators.length) {
      return { valid: false, message: "Korisnik nije ovlašten za rad na ovoj kasi." }
    }

    const operator = operators[0]
    if (operator.pin_code) {
      if (!pinCode) {
        return { valid: false, message: "PIN kod je obavezan za ovog operatera.", requires_pin: true }
      }
      if (operator.pin_code !== pinCode) {
        return { valid: false, message: "Pogrešan PIN kod.", requires_pin: true }
      }
    }

    return { valid: true, operator }
  }
}

export default PosModuleService
