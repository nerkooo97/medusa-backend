import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateReseller } from "../auth-helper"
import { createOrderWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { RESELLER_MODULE } from "../../../modules/reseller"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { reseller, resellerService } = await authenticateReseller(req)
    const { customer, items, note } = req.body as any

    if (!customer?.first_name || !customer?.phone || !customer?.address || !customer?.city) {
      return res.status(400).json({
        message: "Podaci o kupcu (ime, telefon, adresa, grad) su obavezni.",
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Narudžba mora sadržavati barem jednu stavku ('items').",
      })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const variantIds = items.map((i: any) => i.variant_id)

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "title",
        "sku",
        "product.title",
        "product.sales_channels.id",
        "prices.amount",
        "prices.currency_code",
      ],
      filters: { id: variantIds },
    })

    // Ako preprodavač ima definisan kanal prodaje, provjeri da li svi naručeni artikli pripadaju tom kanalu
    if (reseller.sales_channel_id) {
      for (const item of items) {
        const v: any = ((variants as any[]) || []).find((varItem: any) => varItem.id === item.variant_id)
        const inChannel = v?.product?.sales_channels?.some(
          (sc: any) => sc.id === reseller.sales_channel_id
        )
        if (!inChannel) {
          return res.status(403).json({
            message: `Artikal '${v?.title || item.variant_id}' nije dostupan u vašem prodajnom kanalu.`,
          })
        }
      }
    }

    let calculatedRetailTotal = 0
    const lineItemsForOrder: any[] = []

    for (const item of items) {
      const v: any = ((variants as any[]) || []).find((varItem: any) => varItem.id === item.variant_id)
      const bamPrice =
        v?.prices?.find((p: any) => p.currency_code?.toLowerCase() === "bam") ||
        v?.prices?.[0]
      const price = bamPrice ? Number(bamPrice.amount) : 0
      const qty = Number(item.quantity) || 1
      calculatedRetailTotal += price * qty

      const itemTitle = v?.product?.title
        ? `${v.product.title} - ${v.title}`
        : v?.title || "Artikal"

      lineItemsForOrder.push({
        variant_id: item.variant_id,
        quantity: qty,
        unit_price: price,
        title: itemTitle,
      })
    }

    const pricing = resellerService.calculateCommission(reseller, calculatedRetailTotal)
    const fullName = `${customer.first_name} ${customer.last_name || ""}`.trim()
    const cleanPhone = (customer.phone || "").replace(/[^0-9]/g, "")
    const customerEmail =
      customer.email?.trim() || `kupac_${cleanPhone || Date.now()}@reseller.local`

    // 1. Pronalaženje ili kreiranje STANDARDNOG Medusa Kupca (Customer Module)
    const customerModuleService: any = req.scope.resolve(Modules.CUSTOMER)
    let existingCustomer: any = null

    if (customer.phone) {
      const [byPhone] = await customerModuleService.listAndCountCustomers(
        { phone: customer.phone },
        { take: 1 }
      )
      if (byPhone && byPhone.length > 0) {
        existingCustomer = byPhone[0]
      }
    }

    if (!existingCustomer && customerEmail) {
      const [byEmail] = await customerModuleService.listAndCountCustomers(
        { email: customerEmail },
        { take: 1 }
      )
      if (byEmail && byEmail.length > 0) {
        existingCustomer = byEmail[0]
      }
    }

    let customerId = existingCustomer?.id
    if (!existingCustomer) {
      const newCustomer = await customerModuleService.createCustomers({
        first_name: customer.first_name,
        last_name: customer.last_name || "",
        email: customerEmail,
        phone: customer.phone,
        has_account: false,
        metadata: {
          source: "reseller",
          reseller_id: reseller.id,
          reseller_name: reseller.name,
        },
      })
      customerId = newCustomer.id

      // Sačuvaj i standardnu adresu za tog kupca u Medusi
      try {
        await customerModuleService.createCustomerAddresses({
          customer_id: customerId,
          first_name: customer.first_name,
          last_name: customer.last_name || "",
          phone: customer.phone,
          address_1: customer.address,
          city: customer.city,
          postal_code: customer.postal_code || "71000",
          country_code: "ba",
          is_default_shipping: true,
          is_default_billing: true,
        })
      } catch (addrErr) {
        console.warn("Nije uspjelo kreiranje adrese kupca:", addrErr)
      }
    }

    // 2. Kreiranje PRAVE standardne Medusa Order narudžbe u centralnom sistemu
    const { result: createdMedusaOrder } = await createOrderWorkflow(req.scope).run({
      input: {
        customer_id: customerId,
        currency_code: "bam",
        email: existingCustomer ? existingCustomer.email : customerEmail,
        status: "pending",
        sales_channel_id: reseller.sales_channel_id || undefined,
        shipping_address: {
          first_name: customer.first_name,
          last_name: customer.last_name || "",
          phone: customer.phone,
          address_1: customer.address,
          city: customer.city,
          postal_code: customer.postal_code || "71000",
          country_code: "ba",
        },
        billing_address: {
          first_name: customer.first_name,
          last_name: customer.last_name || "",
          phone: customer.phone,
          address_1: customer.address,
          city: customer.city,
          postal_code: customer.postal_code || "71000",
          country_code: "ba",
        },
        items: lineItemsForOrder,
        metadata: {
          source: "reseller",
          reseller_id: reseller.id,
          reseller_name: reseller.name,
          reseller_cost: pricing.resellerCost,
          commission_earned: pricing.commission,
          customer_note: note || undefined,
        },
      },
    })

    const orderId = createdMedusaOrder.id

    // 3. Kreiranje veze u Reseller modulu
    const resellerOrder = await resellerService.createResellerOrders({
      order_id: orderId,
      customer_name: fullName,
      customer_phone: customer.phone,
      customer_address: customer.address,
      customer_city: customer.city,
      customer_postal_code: customer.postal_code || null,
      retail_total: pricing.retailTotal,
      reseller_cost: pricing.resellerCost,
      commission_earned: pricing.commission,
      order_status: "pending",
      payout_status: "unearned",
      reseller_id: reseller.id,
    })

    // 4. Povezivanje preko Medusa Remote Link-a
    try {
      const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
      await link.create({
        [Modules.ORDER]: {
          order_id: orderId,
        },
        [RESELLER_MODULE]: {
          reseller_order_id: resellerOrder.id,
        },
      })
    } catch (linkErr: any) {
      console.warn("Nije uspjelo kreiranje remote linka:", linkErr?.message)
    }

    res.status(201).json({
      success: true,
      order_id: orderId,
      customer_id: customerId,
      medusa_order: {
        id: createdMedusaOrder.id,
        display_id: (createdMedusaOrder as any).display_id,
        status: createdMedusaOrder.status,
      },
      reseller_order: resellerOrder,
      pricing: {
        retail_total: pricing.retailTotal,
        reseller_cost: pricing.resellerCost,
        commission_earned: pricing.commission,
      },
      message: "Narudžba i kupac su uspješno evidentirani u standardnom Medusa sistemu.",
    })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
