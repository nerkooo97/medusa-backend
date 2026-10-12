export interface PosOperator {
  id: string
  user_id: string
  role: "cashier" | "supervisor" | "manager"
  pin_code?: string | null
  is_active: boolean
  user?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  } | null
}

export interface PosSession {
  id: string
  register_id: string
  opened_by_user_id: string
  closed_by_user_id?: string | null
  opened_at: string
  closed_at?: string | null
  status: "open" | "closed"
  opening_cash: number
  closing_cash?: number | null
  notes?: string | null
}

export interface PosRegister {
  id: string
  name: string
  code: string
  description?: string | null
  status: "active" | "inactive" | "maintenance"

  store_name: string
  store_address: string
  store_city: string
  store_postal_code?: string | null
  store_country_code?: string
  store_phone?: string | null
  store_email?: string | null
  tax_id?: string | null
  vat_id?: string | null

  sales_channel_id?: string | null
  sales_channel?: { id: string; name: string } | null
  stock_location_id?: string | null
  stock_location?: { id: string; name: string } | null

  supported_payment_methods: string[]
  default_payment_method: string

  fiscal_printer_type?: string | null
  fiscal_printer_ip?: string | null
  fiscal_printer_port?: number | null
  fiscal_device_serial?: string | null
  receipt_header?: string | null
  receipt_footer?: string | null

  device_key: string
  operators?: PosOperator[]
  operators_count?: number
  sessions?: PosSession[]
  active_session?: PosSession | null

  created_at?: string
  updated_at?: string
}

export interface PosOptions {
  sales_channels: { id: string; name: string }[]
  stock_locations: { id: string; name: string }[]
  users: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }[]
  payment_methods: {
    id: string
    name: string
    description?: string
  }[]
  fiscal_printer_types: {
    id: string
    name: string
  }[]
}
