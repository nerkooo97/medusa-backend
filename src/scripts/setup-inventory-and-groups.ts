import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createCustomerGroupsWorkflow,
  createCustomersWorkflow,
  createInventoryLevelsWorkflow,
  createStockLocationsWorkflow,
  linkCustomersToCustomerGroupWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStockLocationsWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function setupInventoryAndGroups({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const customerService = container.resolve(Modules.CUSTOMER)

  logger.info("📦 Pokrećem konfiguraciju skladišta, zaliha i prodajnih grupa za resellere...")

  // =========================================================================
  // 1. SKLADIŠTA / MAGACINI (Stock Locations)
  // =========================================================================
  logger.info("🏢 Provjeravam i konfigurišem magacine (Stock Locations)...")

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const allSalesChannelIds = salesChannels.map((sc: any) => sc.id)
  logger.info(`Pronađeno prodajnih kanala: ${salesChannels.length} (${salesChannels.map((s: any) => s.name).join(", ")})`)

  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })

  // 1a. Renaming or creating Centralno Skladište Sarajevo
  let centralWarehouse = existingLocations.find(
    (loc: any) =>
      loc.name === "European Warehouse" ||
      loc.name.includes("Centralno") ||
      loc.name.includes("Sarajevo")
  )

  if (centralWarehouse && centralWarehouse.name !== "Centralno Skladište - Sarajevo") {
    logger.info(`Ažuriram skladište '${centralWarehouse.name}' u 'Centralno Skladište - Sarajevo'...`)
    await updateStockLocationsWorkflow(container).run({
      input: {
        selector: { id: centralWarehouse.id },
        update: {
          name: "Centralno Skladište - Sarajevo",
          address: {
            address_1: "Džemala Bijedića 120",
            city: "Sarajevo",
            country_code: "ba",
            postal_code: "71000",
          },
        },
      },
    })
    centralWarehouse.name = "Centralno Skladište - Sarajevo"
  } else if (!centralWarehouse) {
    logger.info("Kreiram 'Centralno Skladište - Sarajevo'...")
    const {
      result: [created],
    } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Centralno Skladište - Sarajevo",
            address: {
              address_1: "Džemala Bijedića 120",
              city: "Sarajevo",
              country_code: "ba",
              postal_code: "71000",
            },
          },
        ],
      },
    })
    centralWarehouse = created
  }

  // 1b. Additional warehouse: Magacin Tuzla
  let tuzlaWarehouse = existingLocations.find((loc: any) =>
    loc.name.includes("Tuzla")
  )
  if (!tuzlaWarehouse) {
    logger.info("Kreiram dodatno skladište 'Magacin Alati i Oprema - Tuzla'...")
    const {
      result: [created],
    } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Magacin Alati i Oprema - Tuzla",
            address: {
              address_1: "Bosanskih Branilaca 44",
              city: "Tuzla",
              country_code: "ba",
              postal_code: "75000",
            },
          },
        ],
      },
    })
    tuzlaWarehouse = created

    // Link fulfillment provider manual_manual
    try {
      await link.create({
        [Modules.STOCK_LOCATION]: {
          stock_location_id: tuzlaWarehouse.id,
        },
        [Modules.FULFILLMENT]: {
          fulfillment_provider_id: "manual_manual",
        },
      })
    } catch (e) {
      logger.warn(`Link fulfillment provider: ${e}`)
    }
  }

  const stockLocations = [centralWarehouse, tuzlaWarehouse].filter(Boolean)

  // 1c. Link all stock locations to all sales channels
  for (const loc of stockLocations) {
    try {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: {
          id: loc.id,
          add: allSalesChannelIds,
        },
      })
      logger.info(`✅ Povezano skladište '${loc.name}' sa svim prodajnim kanalima.`)
    } catch (e) {
      logger.warn(`Napomena kod povezivanja skladišta ${loc.name}: ${e}`)
    }
  }

  // =========================================================================
  // 2. STANJE ARTIKALA NA ZALIHAMA (Inventory Items & Location Levels)
  // =========================================================================
  logger.info("📦 Usklađujem inventarne stavke i unosim stanja u skladišta...")

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "sales_channels.name",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.manage_inventory",
      "variants.inventory_items.inventory_item_id",
      "variants.inventory_items.inventory.id",
      "variants.inventory_items.inventory.location_levels.location_id",
      "variants.inventory_items.inventory.location_levels.stocked_quantity",
    ],
  })

  const newInventoryLevels: {
    location_id: string
    inventory_item_id: string
    stocked_quantity: number
  }[] = []

  for (const product of products) {
    const isAlati = product.sales_channels?.some((sc: any) =>
      sc.name.toLowerCase().includes("alat")
    )
    const isBeauty = product.sales_channels?.some((sc: any) =>
      sc.name.toLowerCase().includes("sminka") ||
      sc.name.toLowerCase().includes("šminka")
    )

    for (const variant of product.variants || []) {
      let inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id

      // Ako varijanta nema kreiran Inventory Item, kreiramo ga i povezujemo
      if (!inventoryItemId) {
        logger.info(`Kreiram inventarnu stavku za varijantu: ${product.title} - ${variant.title} (${variant.sku})...`)
        const [createdItem] = await inventoryService.createInventoryItems([
          {
            sku: variant.sku || `SKU-${variant.id.slice(-6)}`,
            title: `${product.title} - ${variant.title}`,
            requires_shipping: true,
          },
        ])
        inventoryItemId = createdItem.id

        await link.create([
          {
            [Modules.PRODUCT]: { variant_id: variant.id },
            [Modules.INVENTORY]: { inventory_item_id: createdItem.id },
            data: { required_quantity: 1 },
          },
        ])
        logger.info(`  -> Povezana varijanta ${variant.id} sa inventarnom stavkom ${createdItem.id}`)
      }

      // Dohvatimo postojeća stanja na skladištima za ovu stavku
      const existingLevels =
        variant.inventory_items?.[0]?.inventory?.location_levels || []
      const hasCentralLevel = existingLevels.some(
        (l: any) => l.location_id === centralWarehouse.id
      )
      const hasTuzlaLevel = existingLevels.some(
        (l: any) => l.location_id === tuzlaWarehouse.id
      )

      // Količine: Alati imaju 120 u Sarajevu i 80 u Tuzli, Šminka 180 u Sarajevu i 40 u Tuzli
      const centralQty = isAlati ? 120 : isBeauty ? 180 : 200
      const tuzlaQty = isAlati ? 80 : isBeauty ? 40 : 50

      if (!hasCentralLevel) {
        newInventoryLevels.push({
          location_id: centralWarehouse.id,
          inventory_item_id: inventoryItemId,
          stocked_quantity: centralQty,
        })
      }

      if (!hasTuzlaLevel) {
        newInventoryLevels.push({
          location_id: tuzlaWarehouse.id,
          inventory_item_id: inventoryItemId,
          stocked_quantity: tuzlaQty,
        })
      }
    }
  }

  if (newInventoryLevels.length > 0) {
    logger.info(`Unosim ${newInventoryLevels.length} novih nivoa zaliha u magacine...`)
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: newInventoryLevels,
      },
    })
    logger.info(`✅ Uspješno dodana stanja za artikle u skladištima!`)
  } else {
    logger.info(`ℹ️ Svi artikli već imaju unesena stanja u skladištima.`)
  }

  // =========================================================================
  // 3. PRODAJNE GRUPE ZA RESELERE (Customer Groups)
  // =========================================================================
  logger.info("👥 Kreiram prodajne grupe za partnere i resellere...")

  const { data: existingGroups } = await query.graph({
    entity: "customer_group",
    fields: ["id", "name"],
  })

  const resellerGroupsData = [
    {
      name: "Preprodavači - Nivo 1 (B2B Standard)",
      metadata: {
        tier: 1,
        discount_percentage: 10,
        description: "Početni nivo za preprodavače sa 10% rabata na narudžbe",
        min_order_amount_bam: 200,
      },
    },
    {
      name: "Preprodavači - Nivo 2 (VIP Reseller)",
      metadata: {
        tier: 2,
        discount_percentage: 20,
        description: "VIP partneri sa većim mjesečnim volumenom i 20% rabata",
        min_order_amount_bam: 1000,
      },
    },
    {
      name: "Veleprodaja & Distributeri",
      metadata: {
        tier: 3,
        discount_percentage: 30,
        description: "Veleprodajni distributeri sa 30% rabata i paletnim isporukama",
        min_order_amount_bam: 3000,
      },
    },
    {
      name: "Građevinske Firme & Majstori",
      metadata: {
        tier: "b2b_craftsmen",
        discount_percentage: 15,
        description: "Registrovani majstori i građevinski obrti (Alati Store)",
        target_channel: "Alati Store",
      },
    },
    {
      name: "Beauty Saloni & Kozmetičari",
      metadata: {
        tier: "b2b_beauty",
        discount_percentage: 15,
        description: "Kozmetički i frizerski saloni, vizažisti (Šminka Store)",
        target_channel: "Šminka Store",
      },
    },
  ]

  const missingGroups = resellerGroupsData.filter(
    (group) => !existingGroups.some((eg: any) => eg.name === group.name)
  )

  let createdGroups: any[] = []
  if (missingGroups.length > 0) {
    logger.info(`Kreiram ${missingGroups.length} novih prodajnih grupa...`)
    const { result } = await createCustomerGroupsWorkflow(container).run({
      input: {
        customersData: missingGroups,
      },
    })
    createdGroups = result
    logger.info(`✅ Kreirane prodajne grupe: ${missingGroups.map((g) => g.name).join(", ")}`)
  } else {
    logger.info(`ℹ️ Sve prodajne grupe već postoje.`)
  }

  // Fetch all current groups
  const { data: allCustomerGroups } = await query.graph({
    entity: "customer_group",
    fields: ["id", "name"],
  })

  // =========================================================================
  // 4. KREIRANJE DEMO PARTNERA / RESELERA (Customers)
  // =========================================================================
  logger.info("👤 Kreiram testne B2B kupce / resellere...")

  const demoResellers = [
    {
      first_name: "Emir",
      last_name: "Hadžić",
      email: "reseller.sarajevo@partner.ba",
      company_name: "Alat Servis d.o.o. Sarajevo",
      phone: "+387 33 111 222",
      group_name: "Preprodavači - Nivo 1 (B2B Standard)",
    },
    {
      first_name: "Mirza",
      last_name: "Kovačević",
      email: "veleprodaja@distribucija.ba",
      company_name: "Balkan Trade & Distribution d.o.o.",
      phone: "+387 35 222 333",
      group_name: "Veleprodaja & Distributeri",
    },
    {
      first_name: "Lejla",
      last_name: "Imamović",
      email: "salon.glamour@beauty.ba",
      company_name: "Beauty Studio Glamour Tuzla",
      phone: "+387 35 444 555",
      group_name: "Beauty Saloni & Kozmetičari",
    },
  ]

  for (const reseller of demoResellers) {
    const { data: existingCustomer } = await query.graph({
      entity: "customer",
      fields: ["id", "email"],
      filters: { email: reseller.email },
    })

    let customerId = existingCustomer?.[0]?.id

    if (!customerId) {
      logger.info(`Kreiram kupca / partnera: ${reseller.company_name} (${reseller.email})...`)
      const {
        result: [createdCustomer],
      } = await createCustomersWorkflow(container).run({
        input: {
          customersData: [
            {
              first_name: reseller.first_name,
              last_name: reseller.last_name,
              email: reseller.email,
              company_name: reseller.company_name,
              phone: reseller.phone,
              has_account: true,
            },
          ],
        },
      })
      customerId = createdCustomer.id
    }

    // Link customer to customer group
    const targetGroup = allCustomerGroups.find(
      (g: any) => g.name === reseller.group_name
    )
    if (targetGroup && customerId) {
      try {
        await linkCustomersToCustomerGroupWorkflow(container).run({
          input: {
            id: targetGroup.id,
            add: [customerId],
          },
        })
        logger.info(`  -> Dodijeljen kupac ${reseller.email} u grupu '${targetGroup.name}'`)
      } catch (e) {
        logger.warn(`  Napomena kod dodjele u grupu: ${e}`)
      }
    }
  }

  logger.info("🎉 USPJEŠNO ZAVRŠENO!")
  logger.info("----------------------------------------------------------------")
  logger.info(`🏢 Magacini: ${stockLocations.map((s: any) => s.name).join(", ")}`)
  logger.info(`👥 Prodajne grupe: ${allCustomerGroups.map((g: any) => g.name).join(", ")}`)
  logger.info("----------------------------------------------------------------")
}
