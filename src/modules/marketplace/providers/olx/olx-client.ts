export interface OlxAuthResponse {
  token: string
  user: {
    id: number
    type: string
    email: string
    username: string
    first_name?: string
    last_name?: string
    [key: string]: any
  }
}

export class OlxApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl?.replace(/\/$/, "") || "https://api.olx.ba"
  }

  private getHeaders(token?: string, extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...extraHeaders,
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    return headers
  }

  /**
   * Prijava na OLX.ba i dobijanje Bearer tokena
   */
  async login(username: string, password: string, deviceName = "medusa_integration"): Promise<OlxAuthResponse> {
    const url = `${this.baseUrl}/auth/login`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        username,
        password,
        device_name: deviceName,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`OLX Login neuspješan (${res.status}): ${errBody}`)
    }

    return await res.json()
  }

  /**
   * Provjera validnosti tokena i profila korisnika (/me)
   */
  async getMe(token: string, legacyHeaders?: { clientId?: string; clientToken?: string }) {
    const url = `${this.baseUrl}/me`
    const headers = this.getHeaders(token)

    if (legacyHeaders?.clientId && legacyHeaders?.clientToken) {
      headers["OLX-CLIENT-ID"] = legacyHeaders.clientId
      headers["OLX-CLIENT-TOKEN"] = legacyHeaders.clientToken
    }

    const res = await fetch(url, { method: "GET", headers })
    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`OLX /me poziv neuspješan (${res.status}): ${errBody}`)
    }

    return await res.json()
  }

  /**
   * Preuzimanje glavnih ili podkategorija
   */
  async getCategories(token: string, parentId?: string | number) {
    const url = parentId ? `${this.baseUrl}/categories/${parentId}` : `${this.baseUrl}/categories`
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(token),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Greška pri dohvatanju kategorija (${res.status}): ${errBody}`)
    }

    const json = await res.json()
    return json.data || json
  }

  /**
   * Preuzimanje dinamičkih atributa za kategoriju
   */
  async getCategoryAttributes(token: string, categoryId: string | number) {
    const url = `${this.baseUrl}/categories/${categoryId}/attributes`
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(token),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Greška pri dohvatanju atributa kategorije ${categoryId}: ${errBody}`)
    }

    const json = await res.json()
    return json.data || json
  }

  /**
   * Preuzimanje brendova za kategoriju
   */
  async getCategoryBrands(token: string, categoryId: string | number) {
    const url = `${this.baseUrl}/categories/${categoryId}/brands`
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(token),
    })

    if (!res.ok) {
      return []
    }

    const json = await res.json()
    return json.data || json
  }

  /**
   * Kreiranje novog oglasa (kreira se u DRAFT statusu)
   */
  async createListing(token: string, payload: Record<string, any>) {
    const url = `${this.baseUrl}/listings`
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errBody = await res.text()
      let friendlyMsg = `Greška pri kreiranju oglasa na OLX (${res.status})`
      try {
        const parsed = JSON.parse(errBody)
        if (parsed.error?.message) {
          friendlyMsg = parsed.error.message
          if (parsed.error.errors && typeof parsed.error.errors === "object") {
            const details = Object.values(parsed.error.errors).flat().join(" ")
            friendlyMsg += ` (${details})`
          }
        }
      } catch {
        friendlyMsg += `: ${errBody}`
      }
      throw new Error(friendlyMsg)
    }

    return await res.json()
  }

  /**
   * Upload slike za oglas (podržava URL slike)
   */
  async uploadImage(token: string, listingId: string | number, imageUrl: string) {
    const url = `${this.baseUrl}/listings/${listingId}/image-upload`
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify({ image_url: imageUrl }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Greška pri uploadu slike za oglas ${listingId}: ${errBody}`)
    }

    return await res.json()
  }

  /**
   * Objavljivanje oglasa (prebacivanje iz DRAFT u ACTIVE)
   */
  async publishListing(token: string, listingId: string | number) {
    const url = `${this.baseUrl}/listings/${listingId}/publish`
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Greška pri objavi oglasa ${listingId} na OLX: ${errBody}`)
    }

    return await res.json()
  }

  /**
   * Ažuriranje postojećeg oglasa (cijena, opis, naslov, dostupnost)
   */
  async updateListing(token: string, listingId: string | number, payload: Record<string, any>) {
    const url = `${this.baseUrl}/listings/${listingId}`
    const res = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(token),
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Greška pri ažuriranju oglasa ${listingId}: ${errBody}`)
    }

    return await res.json()
  }

  /**
   * Obnavljanje oglasa (Refresh - podizanje pozicije)
   */
  async refreshListing(token: string, listingId: string | number) {
    const url = `${this.baseUrl}/listings/${listingId}/refresh`
    const res = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(token),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Greška pri obnovi oglasa ${listingId}: ${errBody}`)
    }

    return await res.json()
  }

  /**
   * Provjera limita obnova (refresh limits)
   */
  async getRefreshLimits(token: string) {
    const url = `${this.baseUrl}/listing/refresh/limits`
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(token),
    })

    if (!res.ok) {
      return null
    }

    return await res.json()
  }

  /**
   * Sakrivanje oglasa (kada nema zalihe)
   */
  async hideListing(token: string, listingId: string | number) {
    const url = `${this.baseUrl}/listings/${listingId}/hide`
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token),
    })
    return res.ok
  }

  /**
   * Ponovno prikazivanje oglasa (kada roba stigne na stanje)
   */
  async unhideListing(token: string, listingId: string | number) {
    const url = `${this.baseUrl}/listings/${listingId}/unhide`
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token),
    })
    return res.ok
  }

  /**
   * Završavanje oglasa
   */
  async finishListing(token: string, listingId: string | number) {
    const url = `${this.baseUrl}/listings/${listingId}/finish`
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token),
    })
    return res.ok
  }

  /**
   * Brisanje oglasa
   */
  async deleteListing(token: string, listingId: string | number) {
    const url = `${this.baseUrl}/listings/${listingId}`
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(token),
    })
    return res.ok
  }

  /**
   * Dohvatanje liste gradova
   */
  async getCities(token?: string) {
    const url = `${this.baseUrl}/cities`
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(token),
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || json
  }
}
