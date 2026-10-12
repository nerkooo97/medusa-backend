import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const salesChannelService: any = req.scope.resolve(Modules.SALES_CHANNEL)
  const stockLocationService: any = req.scope.resolve(Modules.STOCK_LOCATION)
  const userService: any = req.scope.resolve(Modules.USER)

  let salesChannels: any[] = []
  let stockLocations: any[] = []
  let users: any[] = []

  try {
    const [scList] = await salesChannelService.listAndCountSalesChannels({})
    salesChannels = scList || []
  } catch (err) {
    console.warn("Could not list sales channels:", err)
  }

  try {
    const [slList] = await stockLocationService.listAndCountStockLocations({})
    stockLocations = slList || []
  } catch (err) {
    console.warn("Could not list stock locations:", err)
  }

  try {
    const [uList] = await userService.listAndCountUsers({})
    users = (uList || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      avatar_url: u.avatar_url,
    }))
  } catch (err) {
    console.warn("Could not list users:", err)
  }

  // Predefinisani načini plaćanja uobičajeni u maloprodaji / POS
  const paymentMethods = [
    { id: "cash", name: "Gotovina (Cash)", description: "Plaćanje gotovim novcem na kasi" },
    { id: "card", name: "Platna kartica (POS Terminal)", description: "Visa, Mastercard, Maestro" },
    { id: "wire_transfer", name: "Žiralno / Virman", description: "Plaćanje putem transakcijskog računa" },
    { id: "voucher", name: "Poklon bon / Vaučer", description: "Plaćanje vaučerom ili poklon bonom" },
  ]

  // Podržani fiskalni printeri (fokus na BiH tržište - FBiH i RS)
  const fiscalPrinterTypes = [
    { id: "none", name: "Bez fiskalnog uređaja (Samo POS račun)" },
    { id: "tring", name: "Tring (Tring Fiskalni Printer / Server)" },
    { id: "hcp", name: "HCP (Best / P2DS / Secunda / Ultima)" },
    { id: "tremol", name: "Tremol (FP05 / FP15 / FP24)" },
    { id: "generic_escpos", name: "Generički ESC/POS termalni printer (USB/LAN)" },
  ]

  res.json({
    sales_channels: salesChannels,
    stock_locations: stockLocations,
    users,
    payment_methods: paymentMethods,
    fiscal_printer_types: fiscalPrinterTypes,
  })
}
