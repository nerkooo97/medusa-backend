import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticateReseller } from "../auth-helper"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { reseller, resellerService } = await authenticateReseller(req)
    const query = req.scope.resolve("query")

    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "subtitle",
        "description",
        "thumbnail",
        "sales_channels.id",
        "sales_channels.name",
        "options.id",
        "options.title",
        "options.values.id",
        "options.values.value",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.options.id",
        "variants.options.value",
        "variants.options.option_id",
        "variants.prices.amount",
        "variants.prices.currency_code",
      ],
      filters: (reseller.sales_channel_id
        ? { sales_channels: { id: reseller.sales_channel_id } }
        : {}) as any,
    })

    // Dodatni filter: ako reseller ima postavljen kanal, osiguraj da su samo proizvodi tog kanala uključeni
    let availableProducts = (products as any[]) || []
    if (reseller.sales_channel_id) {
      availableProducts = availableProducts.filter((p: any) =>
        p.sales_channels?.some((sc: any) => sc.id === reseller.sales_channel_id)
      )
    }

    const catalog = availableProducts.map((p: any) => {
      // Map options
      const optionsMap = new Map<string, string>()
      const formattedOptions = (p.options || []).map((opt: any) => {
        optionsMap.set(opt.id, opt.title)
        const uniqueValues = Array.from(
          new Set(
            (opt.values || [])
              .map((v: any) => (typeof v === "string" ? v : v?.value))
              .filter(Boolean)
          )
        )
        return {
          id: opt.id,
          title: opt.title,
          values: uniqueValues,
        }
      })

      const variants = (p.variants || []).map((v: any) => {
        const bamPrice =
          v.prices?.find((pr: any) => pr.currency_code?.toLowerCase() === "bam") ||
          v.prices?.[0]
        const retailPrice = bamPrice ? Number(bamPrice.amount) : 0

        const pricing = resellerService.calculateCommission(reseller, retailPrice)

        // Map variant options as key-value pair: { "Boja": "Crna", "Veličina": "M" }
        const variantOptions: Record<string, string> = {}
        if (Array.isArray(v.options)) {
          for (const vo of v.options) {
            const optTitle = optionsMap.get(vo.option_id) || vo.option?.title
            if (optTitle && vo.value) {
              variantOptions[optTitle] = vo.value
            }
          }
        }

        // Fallback: ako variant.options nije direktno vezan, probaj izvući iz naslova varijante npr. "Crna / M"
        if (Object.keys(variantOptions).length === 0 && formattedOptions.length > 0 && v.title) {
          const parts = v.title.split("/").map((s: string) => s.trim())
          if (parts.length === formattedOptions.length) {
            formattedOptions.forEach((fo: any, idx: number) => {
              variantOptions[fo.title] = parts[idx]
            })
          }
        }

        return {
          id: v.id,
          title: v.title,
          sku: v.sku,
          retail_price: pricing.retailTotal,
          reseller_cost: pricing.resellerCost,
          profit_margin: pricing.commission,
          currency: "BAM",
          options: variantOptions,
        }
      })

      return {
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        thumbnail: p.thumbnail,
        options: formattedOptions,
        variants,
      }
    })

    res.json({
      reseller: {
        id: reseller.id,
        name: reseller.name,
        commission_type: reseller.commission_type,
        commission_rate: reseller.commission_rate,
        sales_channel_id: reseller.sales_channel_id || null,
      },
      products: catalog,
    })
  } catch (err: any) {
    res.status(401).json({ message: err.message })
  }
}
