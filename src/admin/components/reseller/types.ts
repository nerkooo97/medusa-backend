export interface ResellerStats {
  total_orders: number
  pending_orders?: number
  shipped_orders?: number
  delivered_orders: number
  returned_orders: number
  canceled_orders?: number
  total_retail: number
  total_commission: number
  eligible_unpaid: number
  paid_commission: number
}

export interface ResellerData {
  id: string
  name: string
  contact_person?: string | null
  email: string
  phone: string
  status: "active" | "inactive" | "blocked"
  commission_type: "percentage" | "fixed_amount"
  commission_rate: number | string
  sales_channel_id?: string | null
  sales_channel?: { id: string; name: string } | null
  api_key: string
  payout_info?: {
    bank_name?: string
    account_number?: string
    recipient_name?: string
    iban?: string
  } | null
  metadata?: Record<string, any> | null
  created_at: string
  stats?: ResellerStats
  orders?: ResellerOrderData[]
  payouts?: ResellerPayoutData[]
}

export interface SalesChannelOption {
  id: string
  name: string
  description?: string | null
}

export interface ResellerOrderData {
  id: string
  order_id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  customer_city: string
  customer_postal_code?: string | null
  retail_total: number | string
  reseller_cost: number | string
  commission_earned: number | string
  order_status: "pending" | "processing" | "shipped" | "delivered" | "returned" | "canceled"
  payout_status: "unearned" | "eligible" | "paid"
  reseller_id: string
  payout_id?: string | null
  created_at: string
  reseller?: ResellerData
}

export interface ResellerPayoutData {
  id: string
  amount: number | string
  payment_method: string
  reference_number?: string | null
  status: "pending" | "completed" | "canceled"
  notes?: string | null
  paid_at?: string | null
  reseller_id: string
  created_at: string
  reseller?: ResellerData
  orders?: ResellerOrderData[]
}
