import {
  AuthFieldSchema,
  ExternalAttribute,
  ExternalCategory,
  IMarketplaceProvider,
  PublishListingPayload,
  PublishResult,
  TestConnectionResult,
} from "../../types"
import { OlxApiClient } from "./olx-client"
import { OLX_CITIES, OLX_COUNTRIES } from "./olx-cities"

export class OlxMarketplaceProvider implements IMarketplaceProvider {
  readonly providerId = "olx"
  readonly displayName = "OLX.ba"
  readonly iconName = "shopping-bag"

  private getClient(baseUrl?: string): OlxApiClient {
    return new OlxApiClient(baseUrl)
  }

  getAuthSchema(): AuthFieldSchema[] {
    return [
      {
        key: "auth_mode",
        label: "Način Autentifikacije",
        type: "select",
        required: true,
        defaultValue: "credentials",
        options: [
          { label: "Korisničko ime i Lozinka (Preporučeno)", value: "credentials" },
          { label: "Statički Bearer API Token", value: "bearer_token" },
          { label: "Legacy Partner Ključevi (Client ID / Token)", value: "client_tokens" },
        ],
      },
      {
        key: "username",
        label: "OLX Korisničko Ime ili Email",
        type: "text",
        required: false,
        description: "Potrebno za prijavu putem korisničkog računa radnje.",
      },
      {
        key: "password",
        label: "OLX Lozinka",
        type: "password",
        required: false,
        description: "Lozinka vašeg OLX.ba računa.",
      },
      {
        key: "device_name",
        label: "Naziv Uređaja / Integracije",
        type: "text",
        required: false,
        defaultValue: "medusa_erp",
        description: "Identifikator integracije prijavljen na OLX.",
      },
      {
        key: "token",
        label: "Bearer API Token",
        type: "password",
        required: false,
        description: "Unesite ako koristite unaprijed generisani Bearer token.",
      },
      {
        key: "client_id",
        label: "OLX Client ID",
        type: "text",
        required: false,
        description: "Za legacy partnerski pristup.",
      },
      {
        key: "client_token",
        label: "OLX Client Token",
        type: "password",
        required: false,
        description: "Za legacy partnerski pristup.",
      },
      {
        key: "country_id",
        label: "Država",
        type: "select",
        required: true,
        defaultValue: "49",
        options: OLX_COUNTRIES,
        description: "Država u kojoj se nalazi radnja / artikli.",
      },
      {
        key: "city_id",
        label: "Grad",
        type: "select",
        required: true,
        defaultValue: "133",
        options: OLX_CITIES,
        description: "Odaberite grad u kojem se nalazi radnja ili iz kojeg šaljete artikle.",
      },
    ]
  }

  async authenticate(credentials: Record<string, any>, baseUrl?: string): Promise<Record<string, any>> {
    const client = this.getClient(baseUrl)
    const mode = credentials.auth_mode || "credentials"

    if (mode === "bearer_token" && credentials.token) {
      return { token: credentials.token }
    }

    if (mode === "client_tokens" && credentials.client_id && credentials.client_token) {
      return {
        clientId: credentials.client_id,
        clientToken: credentials.client_token,
      }
    }

    if (credentials.username && credentials.password) {
      const auth = await client.login(credentials.username, credentials.password, credentials.device_name || "medusa_erp")
      return {
        token: auth.token,
        user: auth.user,
      }
    }

    if (credentials.token) {
      return { token: credentials.token }
    }

    throw new Error("Nedostaju pristupni podaci za OLX.ba autentifikaciju.")
  }

  async testConnection(credentials: Record<string, any>, baseUrl?: string): Promise<TestConnectionResult> {
    const client = this.getClient(baseUrl)
    try {
      const auth = await this.authenticate(credentials, baseUrl)
      const token = auth.token || ""
      const legacy = auth.clientId ? { clientId: auth.clientId, clientToken: auth.clientToken } : undefined

      const me = await client.getMe(token, legacy)
      const user = me.user || me

      return {
        success: true,
        accountIdentifier: user.email || user.username || String(user.id),
        accountName: `${user.username || user.first_name || "OLX Korisnik"} (${user.type || "trgovina"})`,
        details: user,
      }
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message || "Neuspješno povezivanje sa OLX.ba API-jem.",
      }
    }
  }

  async fetchCategories(connection: any, parentId?: string): Promise<ExternalCategory[]> {
    const client = this.getClient(connection.base_url)
    const auth = await this.authenticate(connection.credentials, connection.base_url)
    const rawCategories = await client.getCategories(auth.token, parentId)

    if (!Array.isArray(rawCategories)) {
      if (rawCategories && typeof rawCategories === "object" && rawCategories.id) {
        return [{
          id: String(rawCategories.id),
          name: rawCategories.name || rawCategories.name_singular,
          parentId: rawCategories.parent_id ? String(rawCategories.parent_id) : undefined,
          hasChildren: false,
        }]
      }
      return []
    }

    return rawCategories.map((c: any) => ({
      id: String(c.id),
      name: c.name || c.name_singular,
      parentId: c.parent_id ? String(c.parent_id) : undefined,
      hasChildren: !c.shipping_available,
    }))
  }

  async fetchCategoryAttributes(connection: any, externalCategoryId: string): Promise<ExternalAttribute[]> {
    const client = this.getClient(connection.base_url)
    const auth = await this.authenticate(connection.credentials, connection.base_url)
    const rawAttrs = await client.getCategoryAttributes(auth.token, externalCategoryId)

    if (!Array.isArray(rawAttrs)) {
      return []
    }

    return rawAttrs.map((a: any) => ({
      id: String(a.id),
      name: a.name,
      displayName: a.display_name || a.name,
      inputType: a.input_type === "select" ? "select" : a.input_type === "number" ? "number" : "string",
      required: Boolean(a.required),
      options: Array.isArray(a.options) ? a.options : undefined,
    }))
  }

  async publishListing(payload: PublishListingPayload): Promise<PublishResult> {
    const { product, variant, categoryMapping, fieldMappings, connectionSettings, currentStock, price } = payload
    const client = this.getClient(connectionSettings.base_url)
    const auth = await this.authenticate(connectionSettings.credentials, connectionSettings.base_url)

    // Određivanje ispravnog ID-a grada (ako je poslat ID 1 koji predstavlja FBiH kanton ili prazno)
    let cityId = Number(connectionSettings.credentials?.city_id)
    if (!cityId || cityId === 1) {
      try {
        const me = await client.getMe(auth.token)
        cityId = me.data?.location?.id || me.user?.location?.id || 15
      } catch {
        cityId = 15 // Standardni default ID grada (Gračanica / Sarajevo)
      }
    }

    // Gradimo OLX payload
    const listingPayload: Record<string, any> = {
      title: product.title,
      short_description: product.subtitle || product.title,
      description: product.description || product.title,
      price: price > 0 ? price : 0,
      listing_type: "sell",
      state: "new",
      available: currentStock > 0,
      quantity: currentStock > 0 ? currentStock : 1,
      category_id: Number(categoryMapping.external_category_id),
      country_id: Number(connectionSettings.credentials?.country_id) || 49,
      city_id: cityId,
      sku_number: variant?.sku || product.id,
      attributes: [],
    }

    // Primjenjujemo dinamička mapiranja polja
    if (Array.isArray(fieldMappings)) {
      for (const mapping of fieldMappings) {
        let value: any = mapping.default_value

        if (mapping.source_type === "product_field") {
          value = product[mapping.source_key] ?? value
        } else if (mapping.source_type === "variant_field" && variant) {
          if (mapping.source_key.startsWith("options.") || mapping.source_key.startsWith("option.")) {
            const optName = mapping.source_key.replace(/^options?\./, "").toLowerCase()
            let optVal: any

            if (Array.isArray(variant.options)) {
              const opt = variant.options.find(
                (o: any) =>
                  o.title?.toLowerCase() === optName ||
                  o.option?.title?.toLowerCase() === optName
              )
              optVal = opt?.value
            }

            if (!optVal && variant.title) {
              const parts = variant.title.split("/").map((p: string) => p.trim())
              if (optName.includes("size") || optName.includes("veličina") || optName.includes("velicina")) {
                optVal = parts[0]
              } else if (optName.includes("color") || optName.includes("boja")) {
                optVal = parts[1] || parts[0]
              }
            }

            value = optVal ?? value
          } else {
            value = variant[mapping.source_key] ?? value
          }
        } else if (mapping.source_type === "metadata") {
          const metaKey = mapping.source_key.replace(/^metadata\./, "")
          value = product.metadata?.[metaKey] ?? variant?.metadata?.[metaKey] ?? value
        } else if (mapping.source_type === "fixed_value") {
          value = mapping.source_key || mapping.default_value
        }

        // Automatsko mapiranje engleskih naziva boja na OLX opcije
        if (
          value &&
          (mapping.external_attribute_name?.toLowerCase().includes("boja") ||
            mapping.external_attribute_id === "1267") &&
          typeof value === "string"
        ) {
          const COLOR_MAP: Record<string, string> = {
            black: "Crna",
            white: "Bijela",
            gray: "Siva",
            grey: "Siva",
            silver: "Srebrna",
            gold: "Zlatna",
            beige: "Bež",
            brown: "Smeđa",
            red: "Crvena",
            blue: "Plava",
            green: "Zelena",
            yellow: "Žuta",
            orange: "Narandžasta",
            purple: "Ljubičasta",
            pink: "Roza",
            multicolor: "Višebojna",
            other: "Ostalo",
          }
          const lower = value.trim().toLowerCase()
          if (COLOR_MAP[lower]) {
            value = COLOR_MAP[lower]
          }
        }

        // Vrijednosna transformacija (dictionary)
        if (mapping.value_mappings && typeof mapping.value_mappings === "object") {
          const mappedVal = mapping.value_mappings[String(value)]
          if (mappedVal !== undefined) {
            value = mappedVal
          }
        }

        if (value !== undefined && value !== null) {
          // Ako je standardno polje zaglavlja (npr. state, brand_id, model_id)
          if (["state", "brand_id", "model_id", "listing_type"].includes(mapping.external_attribute_id)) {
            listingPayload[mapping.external_attribute_id] = value
          } else {
            // Ako je specifični atribut kategorije (id: 901)
            listingPayload.attributes.push({
              id: isNaN(Number(mapping.external_attribute_id))
                ? mapping.external_attribute_id
                : Number(mapping.external_attribute_id),
              value: String(value),
            })
          }
        }
      }
    }

    // 1. Kreiraj skicu (Draft)
    const draft = await client.createListing(auth.token, listingPayload)
    const listingId = draft.id || draft.data?.id

    if (!listingId) {
      throw new Error(`OLX nije vratio ID kreiranog oglasa. Odgovor: ${JSON.stringify(draft)}`)
    }

    // 2. Upload slika ako proizvod ima slike
    const images: string[] = []
    if (product.thumbnail) images.push(product.thumbnail)
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img.url && !images.includes(img.url)) {
          images.push(img.url)
        }
      }
    }

    for (const imgUrl of images.slice(0, 8)) {
      try {
        await client.uploadImage(auth.token, listingId, imgUrl)
      } catch (e) {
        // Ignorišemo greške pojedinačne slike kako ne bismo prekinuli objavu
      }
    }

    // 3. Objavljivanje (Aktivacija)
    await client.publishListing(auth.token, listingId)

    return {
      externalId: String(listingId),
      externalUrl: `https://olx.ba/artikal/${listingId}`,
      status: "active",
      rawResponse: draft,
    }
  }

  async updateListing(
    connection: any,
    externalId: string,
    updates: {
      title?: string
      description?: string
      price?: number
      available?: boolean
      attributes?: Array<{ id: string | number; value: any }>
    }
  ): Promise<boolean> {
    const client = this.getClient(connection.base_url)
    const auth = await this.authenticate(connection.credentials, connection.base_url)
    await client.updateListing(auth.token, externalId, updates)
    return true
  }

  async syncStock(connection: any, externalId: string, quantity: number, isAvailable: boolean): Promise<boolean> {
    const client = this.getClient(connection.base_url)
    const auth = await this.authenticate(connection.credentials, connection.base_url)

    if (quantity <= 0 || !isAvailable) {
      // Sakrivamo oglas ili označavamo dostupnost kao false
      await client.updateListing(auth.token, externalId, { available: false, quantity: 0 })
      await client.hideListing(auth.token, externalId)
    } else {
      // Vraćamo oglas u pretragu i postavljamo količinu
      await client.unhideListing(auth.token, externalId)
      await client.updateListing(auth.token, externalId, { available: true, quantity })
    }
    return true
  }

  async deleteOrFinishListing(connection: any, externalId: string): Promise<boolean> {
    const client = this.getClient(connection.base_url)
    const auth = await this.authenticate(connection.credentials, connection.base_url)
    try {
      await client.finishListing(auth.token, externalId)
      return true
    } catch {
      return await client.deleteListing(auth.token, externalId)
    }
  }

  async refreshListing(connection: any, externalId: string): Promise<{ success: boolean; message?: string }> {
    const client = this.getClient(connection.base_url)
    const auth = await this.authenticate(connection.credentials, connection.base_url)
    const res = await client.refreshListing(auth.token, externalId)
    return {
      success: true,
      message: res.message || "Artikal je uspješno obnovljen na OLX.ba",
    }
  }
}
