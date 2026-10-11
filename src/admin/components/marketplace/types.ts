export interface MarketplaceProviderInfo {
  providerId: string
  displayName: string
  iconName?: string
  authSchema: Array<{
    key: string
    label: string
    type: "text" | "password" | "select" | "checkbox"
    required: boolean
    description?: string
    defaultValue?: any
    options?: { label: string; value: string }[]
  }>
}

export interface MarketplaceConnectionData {
  id: string
  name: string
  provider_id: string
  auth_type: string
  sales_channel_id: string
  sales_channel_name?: string | null
  credentials: Record<string, any>
  base_url?: string | null
  is_active: boolean
  auto_sync_stock: boolean
  auto_sync_prices: boolean
  default_stock_location_id?: string | null
  default_settings?: Record<string, any> | null
  metadata?: Record<string, any> | null
  created_at: string
}

export interface MarketplaceCategoryMappingData {
  id: string
  connection_id: string
  medusa_category_id: string
  external_category_id: string
  external_category_name?: string | null
  auto_publish: boolean
  metadata?: Record<string, any> | null
}

export interface MarketplaceFieldMappingData {
  id: string
  connection_id: string
  external_category_id?: string | null
  external_attribute_id: string
  external_attribute_name?: string | null
  source_type: "product_field" | "variant_field" | "metadata" | "fixed_value" | "template"
  source_key: string
  default_value?: string | null
  value_mappings?: Record<string, string> | null
  transformation?: string | null
}

export interface MarketplaceListingData {
  id: string
  marketplace_connection_id: string
  product_id: string
  variant_id?: string | null
  external_id: string
  external_url?: string | null
  status: "draft" | "active" | "hidden" | "finished" | "failed"
  last_synced_price?: number | null
  last_synced_quantity: number
  sync_hash?: string | null
  last_synced_at?: string | null
  last_sync_error?: string | null
  external_data?: Record<string, any> | null
  created_at: string
  connection?: MarketplaceConnectionData
}

export interface ExternalCategoryItem {
  id: string
  name: string
  parentId?: string
  hasChildren: boolean
}

export interface ExternalAttributeItem {
  id: string
  name: string
  displayName: string
  inputType: "select" | "string" | "number" | "boolean"
  required: boolean
  options?: string[]
}
