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
        "variants.id",
        "variants.title",
        "variants.sku",
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
      const variants = (p.variants || []).map((v: any) => {
        const bamPrice =
          v.prices?.find((pr: any) => pr.currency_code?.toLowerCase() === "bam") ||
          v.prices?.[0]
        const retailPrice = bamPrice ? Number(bamPrice.amount) : 0

        const pricing = resellerService.calculateCommission(reseller, retailPrice)

        return {
          id: v.id,
          title: v.title,
          sku: v.sku,
          retail_price: pricing.retailTotal,
          reseller_cost: pricing.resellerCost,
          profit_margin: pricing.commission,
          currency: "BAM",
        }
      })

      return {
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        thumbnail: p.thumbnail,
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
