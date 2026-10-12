import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POS_MODULE } from "../../../../../../modules/pos"
import PosModuleService from "../../../../../../modules/pos/service"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const posService: PosModuleService = req.scope.resolve(POS_MODULE)
  const query = req.scope.resolve("query")
  const id = req.params.id

  let register: any
  try {
    register = await posService.retrievePosRegister(id)
  } catch (err) {
    try {
      const [byCode] = await posService.listAndCountPosRegisters(
        { code: id },
        { take: 1 }
      )
      if (byCode && byCode.length > 0) {
        register = byCode[0]
      } else {
        const normalized = id.replace(/POS-0*(\d+)/i, (_m, num) => `POS-${num.padStart(3, "0")}`)
        const [byNorm] = await posService.listAndCountPosRegisters(
          { code: normalized },
          { take: 1 }
        )
        if (byNorm && byNorm.length > 0) {
          register = byNorm[0]
        } else {
          const [byDev] = await posService.listAndCountPosRegisters(
            { device_key: id },
            { take: 1 }
          )
          if (byDev && byDev.length > 0) {
            register = byDev[0]
          }
        }
      }
    } catch {}
  }

  // Obavezna provjera: Šifra kase i Device Key se moraju poklopiti
  const authDeviceKey = (req.headers["x-pos-device-key"] as string | undefined)?.trim()
  if (register?.device_key && (!authDeviceKey || authDeviceKey !== register.device_key)) {
    return res.status(401).json({ message: "Neispravan ili nedostaje sigurnosni Device Key kase." })
  }

  try {
    const filters: any = {}
    if (register?.sales_channel_id) {
      filters.sales_channels = { id: register.sales_channel_id }
    }

    const { data: rawProducts } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "subtitle",
        "description",
        "thumbnail",
        "categories.id",
        "categories.name",
        "sales_channels.id",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "variants.inventory_quantity",
      ],
      filters,
    })

    let productsList = (rawProducts as any[]) || []

    // Ako u dodijeljenom prodajnom kanalu nema dodatih proizvoda, dohvati sve proizvode
    if (productsList.length === 0 && register?.sales_channel_id) {
      const { data: allProducts } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "subtitle",
          "description",
          "thumbnail",
          "categories.id",
          "categories.name",
          "variants.id",
          "variants.title",
          "variants.sku",
          "variants.prices.amount",
          "variants.prices.currency_code",
          "variants.inventory_quantity",
        ],
      })
      productsList = (allProducts as any[]) || []
    }

    const formattedProducts = productsList.map((p: any) => {
      const variant = p.variants?.[0]
      // Pronađi BAM cijenu, ili prvu definisanu cijenu
      const bamPrice = variant?.prices?.find(
        (pr: any) => pr.currency_code?.toLowerCase() === "bam"
      )?.amount
      const firstPrice = variant?.prices?.[0]?.amount
      const finalPrice = bamPrice ?? firstPrice ?? 0

      return {
        id: p.id,
        title: p.title,
        sku: variant?.sku || `ART-${p.id.slice(-6).toUpperCase()}`,
        thumbnail: p.thumbnail || null,
        price: Number(finalPrice) || 0,
        category_id: p.categories?.[0]?.id || "cat_general",
        category_name: p.categories?.[0]?.name || "Opšte",
        inventory_quantity: variant?.inventory_quantity ?? 50,
        tax_rate: "E",
        unit: "kom",
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          price: Number(v.prices?.find((pr: any) => pr.currency_code?.toLowerCase() === "bam")?.amount ?? v.prices?.[0]?.amount ?? finalPrice) || 0,
        })),
      }
    })

    res.json({
      products: formattedProducts,
      count: formattedProducts.length,
    })
  } catch (err: any) {
    res.status(500).json({ message: "Greška pri dohvatanju kataloga: " + err.message })
  }
}
