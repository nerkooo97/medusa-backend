export interface AuthFieldSchema {
  key: string
  label: string
  type: "text" | "password" | "select" | "checkbox"
  required: boolean
  description?: string
  defaultValue?: any
  options?: { label: string; value: string }[]
}

export interface TestConnectionResult {
  success: boolean
  accountIdentifier?: string
  accountName?: string
  details?: Record<string, any>
  errorMessage?: string
}

export interface ExternalCategory {
  id: string
  name: string
  parentId?: string
  hasChildren: boolean
}

export interface ExternalAttribute {
  id: string
  name: string
  displayName: string
  inputType: "select" | "string" | "number" | "boolean"
  required: boolean
  options?: string[]
}

export interface PublishListingPayload {
  product: any
  variant?: any
  categoryMapping: any
  fieldMappings: any[]
  connectionSettings: any
  currentStock: number
  price: number
}

export interface PublishResult {
  externalId: string
  externalUrl?: string
  status: "draft" | "active"
  rawResponse?: any
}

export interface IMarketplaceProvider {
  /** Jedinstveni ID provajdera (npr. 'olx', 'allegro', 'amazon') */
  readonly providerId: string
  /** Prikazano ime u Adminu */
  readonly displayName: string
  /** Logo ili ikona */
  readonly iconName?: string

  /** Definicija polja za unos autentifikacije u UI formi */
  getAuthSchema(): AuthFieldSchema[]

  /** Provjera da li su unijeti kredencijali validni */
  testConnection(credentials: Record<string, any>, baseUrl?: string): Promise<TestConnectionResult>

  /** Osvježavanje ili preuzimanje tokena ako je potrebno */
  authenticate(credentials: Record<string, any>, baseUrl?: string): Promise<Record<string, any>>

  /** Preuzimanje stabla kategorija sa platforme */
  fetchCategories(connection: any, parentId?: string): Promise<ExternalCategory[]>

  /** Preuzimanje dinamičkih atributa za odabranu kategoriju */
  fetchCategoryAttributes(connection: any, externalCategoryId: string): Promise<ExternalAttribute[]>

  /** Objavljivanje novog proizvoda/oglasa */
  publishListing(payload: PublishListingPayload): Promise<PublishResult>

  /** Ažuriranje detalja i cijene postojećeg oglasa */
  updateListing(connection: any, externalId: string, updates: {
    title?: string
    description?: string
    price?: number
    available?: boolean
    attributes?: Array<{ id: string | number; value: any }>
  }): Promise<boolean>

  /** Brza sinhronizacija količine/stanja zaliha */
  syncStock(connection: any, externalId: string, quantity: number, isAvailable: boolean): Promise<boolean>

  /** Brisanje ili arhiviranje oglasa */
  deleteOrFinishListing(connection: any, externalId: string): Promise<boolean>

  /** Opcionalno: Obnavljanje oglasa (boost rank) */
  refreshListing?(connection: any, externalId: string): Promise<{ success: boolean; message?: string }>
}
