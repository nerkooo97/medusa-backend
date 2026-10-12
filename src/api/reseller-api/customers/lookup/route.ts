import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateReseller } from "../../auth-helper"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { reseller, resellerService } = await authenticateReseller(req)

    const rawQuery = ((req.query.phone || req.query.q || "") as string).trim()
    const cleanDigits = rawQuery.replace(/[^0-9]/g, "")

    if (cleanDigits.length < 3) {
      return res.json({ customers: [] })
    }

    const matchedMap = new Map<string, {
      first_name: string
      last_name?: string
      phone: string
      address: string
      city: string
      postal_code?: string
      email?: string
    }>()

    // 1. Pretraži prethodne narudžbe ovog preprodavača
    try {
      const [pastOrders] = await resellerService.listAndCountResellerOrders(
        { reseller_id: reseller.id },
        { take: 100, order: { created_at: "DESC" } }
      )

      for (const order of pastOrders || []) {
        const orderPhoneDigits = (order.customer_phone || "").replace(/[^0-9]/g, "")
        if (orderPhoneDigits.includes(cleanDigits)) {
          const names = (order.customer_name || "").trim().split(" ")
          const firstName = names[0] || ""
          const lastName = names.slice(1).join(" ")

          const key = orderPhoneDigits
          if (!matchedMap.has(key)) {
            matchedMap.set(key, {
              first_name: firstName,
              last_name: lastName || undefined,
              phone: order.customer_phone,
              address: order.customer_address || "",
              city: order.customer_city || "",
              postal_code: order.customer_postal_code || "71000",
            })
          }
        }
      }
    } catch (orderErr) {
      console.warn("[Customer Lookup] Greška pri pretrazi prethodnih narudžbi:", orderErr)
    }

    // 2. Pretraži centralni Customer modul u Medusi (uključujući adrese)
    try {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: dbCustomers } = await query.graph({
        entity: "customer",
        fields: [
          "id",
          "first_name",
          "last_name",
          "email",
          "phone",
          "addresses.address_1",
          "addresses.city",
          "addresses.postal_code",
          "addresses.phone",
          "addresses.first_name",
          "addresses.last_name",
          "addresses.is_default_shipping",
        ],
        filters: {},
      })

      for (const c of (dbCustomers as any[]) || []) {
        const cPhoneDigits = (c.phone || "").replace(/[^0-9]/g, "")
        const addr = c.addresses?.[0]
        const addrPhoneDigits = (addr?.phone || "").replace(/[^0-9]/g, "")

        const matches =
          (cPhoneDigits && cPhoneDigits.includes(cleanDigits)) ||
          (addrPhoneDigits && addrPhoneDigits.includes(cleanDigits))

        if (matches) {
          const finalPhone = c.phone || addr?.phone || ""
          const finalDigits = finalPhone.replace(/[^0-9]/g, "")
          if (!finalDigits) continue

          const existing = matchedMap.get(finalDigits)
          const realEmail =
            c.email && !c.email.endsWith("@reseller.local") ? c.email : undefined

          matchedMap.set(finalDigits, {
            first_name: c.first_name || addr?.first_name || existing?.first_name || "",
            last_name: c.last_name || addr?.last_name || existing?.last_name || undefined,
            phone: finalPhone || existing?.phone || "",
            address: addr?.address_1 || existing?.address || "",
            city: addr?.city || existing?.city || "",
            postal_code: addr?.postal_code || existing?.postal_code || "71000",
            email: realEmail || existing?.email,
          })
        }
      }
    } catch (custErr) {
      console.warn("[Customer Lookup] Greška pri pretrazi Medusa kupaca:", custErr)
    }

    const customers = Array.from(matchedMap.values()).slice(0, 5)

    res.json({ customers })
  } catch (err: any) {
    res.status(401).json({ message: err.message })
  }
}
