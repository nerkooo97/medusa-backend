import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../../../modules/pos"
import PosModuleService from "../../../../../../modules/pos/service"
import { Modules } from "@medusajs/framework/utils"
import {
  createOrderWorkflow,
  createOrderPaymentCollectionWorkflow,
  completeOrderWorkflow,
} from "@medusajs/medusa/core-flows"

export const AUTHENTICATE = false

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const query = req.scope.resolve("query")
  const customerModuleService: any = req.scope.resolve(Modules.CUSTOMER)

  const registerParam = req.params.id

  // 1. Razrešavanje POS kase (po ID-u, kodu POS-001 ili Device Key-u)
  let register: any
  try {
    register = await posService.retrievePosRegister(registerParam)
  } catch (err) {
    try {
      const [byCode] = await posService.listAndCountPosRegisters({ code: registerParam }, { take: 1 })
      if (byCode && byCode.length > 0) {
        register = byCode[0]
      } else {
        const normalized = registerParam.replace(/POS-0*(\d+)/i, (_m, num) => `POS-${num.padStart(3, "0")}`)
        const [byNorm] = await posService.listAndCountPosRegisters({ code: normalized }, { take: 1 })
        if (byNorm && byNorm.length > 0) {
          register = byNorm[0]
        } else {
          const [byDev] = await posService.listAndCountPosRegisters({ device_key: registerParam }, { take: 1 })
          if (byDev && byDev.length > 0) {
            register = byDev[0]
          }
        }
      }
    } catch (searchErr) {
      console.warn("Greška pri traženju kase:", searchErr)
    }
  }

  if (!register) {
    return res.status(404).json({ message: "POS kasa nije pronađena. Provjerite ID ili šifru kase." })
  }

  // 2. Obavezna verifikacija Device Key-a
  const authDeviceKey = (req.headers["x-pos-device-key"] as string | undefined)?.trim()
  if (register.device_key && (!authDeviceKey || authDeviceKey !== register.device_key)) {
    return res.status(401).json({ message: "Neispravan ili nedostaje sigurnosni Device Key kase." })
  }

  // 3. Parsiranje podataka narudžbe sa POS kase
  const {
    items,
    payment_method,
    total_amount,
    paid_amount,
    change_amount,
    fiscal_receipt_number,
    operator_id,
    operator_name,
    customer,
    note,
    status,
  } = req.body as any

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Narudžba mora sadržavati barem jedan artikal." })
  }

  try {
    // 4. Razrešavanje stavki i stvarnih varijanti iz baze
    const lineItemsForOrder: any[] = []

    for (const item of items) {
      let variantId = item.variant_id
      let unitPrice = Number(item.unit_price ?? item.price ?? 0)
      let title = item.title || item.name || "POS Artikal"
      const quantity = Math.max(1, Number(item.quantity) || 1)

      // Ako je proslijeđen samo product_id ili variant_id zapravo počinje sa prod_, dohvati prvu varijantu proizvoda
      const targetProdId = item.product_id || (variantId && variantId.startsWith("prod_") ? variantId : null)
      if ((!variantId || variantId.startsWith("prod_")) && targetProdId) {
        try {
          const { data: prods } = await query.graph({
            entity: "product",
            fields: [
              "id",
              "title",
              "variants.id",
              "variants.title",
              "variants.prices.amount",
              "variants.prices.currency_code",
            ],
            filters: { id: targetProdId },
          })
          const prod: any = prods?.[0]
          const firstVar = prod?.variants?.[0]
          if (firstVar) {
            variantId = firstVar.id
            if (!title && prod.title) title = prod.title
            if (unitPrice === 0) {
              const bamPrice = firstVar.prices?.find((p: any) => p.currency_code?.toLowerCase() === "bam")
              unitPrice = Number(bamPrice?.amount ?? firstVar.prices?.[0]?.amount ?? 0)
            }
          }
        } catch (prodErr) {
          console.warn("Greška pri dohvatanju varijante proizvoda:", prodErr)
        }
      }

      lineItemsForOrder.push({
        variant_id: variantId,
        quantity,
        unit_price: unitPrice,
        title,
      })
    }

    // 5. Kupac (Pravno lice, fizičko lice, ili generički maloprodajni kupac)
    let customerId: string | undefined
    let customerEmail: string

    if (customer?.email) {
      customerEmail = customer.email.trim()
    } else if (customer?.phone) {
      const cleanPhone = customer.phone.replace(/[^0-9]/g, "")
      customerEmail = `kupac_${cleanPhone || Date.now()}@pos.local`
    } else if (customer?.tax_id) {
      customerEmail = `pravnolice_${customer.tax_id}@pos.local`
    } else {
      customerEmail = `pos_${register.code.toLowerCase().replace(/[^a-z0-9]/g, "")}@pikoalati.ba`
    }

    let existingCustomer: any = null
    try {
      if (customer?.phone) {
        const [byPhone] = await customerModuleService.listAndCountCustomers(
          { phone: customer.phone },
          { take: 1 }
        )
        if (byPhone && byPhone.length > 0) existingCustomer = byPhone[0]
      }
      if (!existingCustomer && customerEmail) {
        const [byEmail] = await customerModuleService.listAndCountCustomers(
          { email: customerEmail },
          { take: 1 }
        )
        if (byEmail && byEmail.length > 0) existingCustomer = byEmail[0]
      }
    } catch (cErr) {
      console.warn("Pretraga kupca:", cErr)
    }

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      try {
        const newCustomer = await customerModuleService.createCustomers({
          first_name: customer?.company_name || customer?.first_name || "Kupac",
          last_name: customer?.last_name || (customer?.company_name ? "(Pravno Lice)" : "Maloprodaja"),
          email: customerEmail,
          phone: customer?.phone || undefined,
          has_account: false,
          metadata: {
            source: "pos",
            pos_register_id: register.id,
            buyer_tax_id: customer?.tax_id || undefined,
            buyer_company: customer?.company_name || undefined,
          },
        })
        customerId = newCustomer.id
      } catch (createCustErr) {
        console.warn("Kreiranje kupca:", createCustErr)
      }
    }

    const customerDisplayName = customer?.company_name || customer?.first_name || "Kupac"
    const customerLastName = customer?.last_name || (customer?.company_name ? "" : "Maloprodaja")

    // 6. Kreiranje PRAVE Medusa narudžbe koja ide direktno u 'Orders'
    const { result: createdMedusaOrder } = await createOrderWorkflow(req.scope).run({
      input: {
        customer_id: customerId,
        currency_code: "bam",
        email: existingCustomer ? existingCustomer.email : customerEmail,
        status: status || "completed",
        sales_channel_id: register.sales_channel_id || undefined,
        shipping_address: {
          first_name: customerDisplayName,
          last_name: customerLastName,
          phone: customer?.phone || register.store_phone || "",
          address_1: customer?.address || register.store_address || "Maloprodajni objekat",
          city: register.store_city || "Sarajevo",
          postal_code: register.store_postal_code || "71000",
          country_code: "ba",
        },
        billing_address: {
          first_name: customerDisplayName,
          last_name: customerLastName,
          phone: customer?.phone || register.store_phone || "",
          address_1: customer?.address || register.store_address || "Maloprodajni objekat",
          city: register.store_city || "Sarajevo",
          postal_code: register.store_postal_code || "71000",
          country_code: "ba",
        },
        items: lineItemsForOrder,
        metadata: {
          source: "pos",
          pos_register_id: register.id,
          pos_register_code: register.code,
          pos_register_name: register.name,
          store_name: register.store_name,
          operator_id: operator_id || undefined,
          operator_name: operator_name || undefined,
          payment_method: payment_method || "Gotovina",
          total_amount: total_amount || undefined,
          paid_amount: paid_amount || undefined,
          change_amount: change_amount || undefined,
          fiscal_receipt_number: fiscal_receipt_number || undefined,
          buyer_jib: customer?.tax_id || undefined,
          buyer_company: customer?.company_name || undefined,
          buyer_pdv: customer?.vat_id || undefined,
          customer_note: note || undefined,
        },
      },
    })

    // 7. Automatsko evidentiranje i zaključivanje uplate (Payment Status -> Captured / Plaćeno)
    const orderTotal = Number(total_amount ?? createdMedusaOrder.total ?? 0)
    try {
      const { result: paymentCollections } = await createOrderPaymentCollectionWorkflow(req.scope).run({
        input: {
          order_id: createdMedusaOrder.id,
          amount: orderTotal,
        },
      })

      if (paymentCollections && paymentCollections.length > 0) {
        const paymentCollection = paymentCollections[0]
        const paymentModuleService = req.scope.resolve(Modules.PAYMENT) as any

        // Kreiranje i autorizacija sesije
        const session = await paymentModuleService.createPaymentSession(paymentCollection.id, {
          provider_id: "pp_system_default",
          currency_code: "bam",
          amount: orderTotal,
          data: {
            payment_method: payment_method || "Gotovina",
            fiscal_receipt_number: fiscal_receipt_number || undefined,
          },
        })

        const authorized = await paymentModuleService.authorizePaymentSession(session.id, {})
        const paymentId = authorized?.payment?.id || session.payment?.id

        if (paymentId) {
          await paymentModuleService.capturePayment({
            payment_id: paymentId,
            amount: orderTotal,
          })
        }

        await paymentModuleService.completePaymentCollections(paymentCollection.id)
      }
    } catch (payErr) {
      console.warn("Upozorenje: Nije uspjelo automatsko evidentiranje uplate:", payErr)
    }

    // 8. Oznaka isporuke na licu mjesta (Fulfillment Status -> Delivered / Preuzeto)
    try {
      const orderModuleService = req.scope.resolve(Modules.ORDER) as any
      const [orderWithItems] = await orderModuleService.listOrders(
        { id: createdMedusaOrder.id },
        { select: ["id", "items.id", "items.quantity"] }
      )

      if (orderWithItems?.items?.length) {
        await orderModuleService.registerDelivery({
          order_id: createdMedusaOrder.id,
          items: orderWithItems.items.map((i: any) => ({
            id: i.id,
            quantity: i.quantity,
          })),
        })
      }
    } catch (delivErr) {
      console.warn("Upozorenje: Nije uspjelo automatsko označavanje isporuke:", delivErr)
    }

    // 9. Postavljanje statusa narudžbe na completed
    try {
      await completeOrderWorkflow(req.scope).run({
        input: {
          orderIds: [createdMedusaOrder.id],
        },
      })
    } catch (compErr) {
      console.warn("Upozorenje: Nije uspjelo postavljanje statusa narudžbe na completed:", compErr)
    }

    res.status(200).json({
      success: true,
      order: createdMedusaOrder,
      order_id: createdMedusaOrder.id,
    })
  } catch (err: any) {
    console.error("Greška pri kreiranju POS narudžbe:", err)
    res.status(500).json({ message: "Greška pri kreiranju narudžbe: " + err.message })
  }
}
