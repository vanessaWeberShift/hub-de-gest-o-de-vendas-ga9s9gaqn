export type MarketplaceType =
  | 'mercadolivre'
  | 'shopee'
  | 'amazon'
  | 'magalu'
  | 'netshoes'
  | 'shein'
  | 'manual'
  | 'outros'

export type OrderStatus =
  | 'new'
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'canceled'
  | 'refunded'

export type NfeStatus = 'none' | 'pending' | 'issued' | 'canceled' | 'error'

export type InvoiceStatus = 'draft' | 'pending' | 'issued' | 'canceled' | 'error' | 'homologation'

export type NfeEnvironment = 'homologacao' | 'producao'

export type NfeProvider = 'nuvem_fiscal' | 'focus_nfe' | 'nota_facil' | 'e_notas'

export type UserRole = 'admin' | 'member'

export type PlanType = 'gratis' | 'essencial' | 'profissional' | 'enterprise'

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'free'

export type BillingCycle = 'monthly' | 'annual'

export interface TenantRecord {
  id: string
  name: string
  cnpj?: string
  ie?: string
  email?: string
  phone?: string
  address?: string
  logo?: string
  plan?: PlanType
  billing_cycle?: BillingCycle
  subscription_status?: SubscriptionStatus
  trial_ends_at?: string
  next_billing_date?: string
  mp_preapproval_id?: string
  mp_customer_id?: string
  card_last4?: string
  card_brand?: string
  card_holder_name?: string
  canceled_at?: string
  created: string
  updated: string
}

export interface SubscriptionPaymentRecord {
  id: string
  tenant: string
  mp_payment_id?: string
  mp_preapproval_id?: string
  amount: number
  plan: PlanType
  billing_cycle?: BillingCycle
  status: 'approved' | 'pending' | 'rejected' | 'refunded' | 'trial'
  description?: string
  payment_date?: string
  card_last4?: string
  card_brand?: string
  invoice_url?: string
  created: string
  updated: string
}

export type LeadVolume = 'ate_50' | '50_200' | '200_500' | '500_mais'
export type LeadStatus = 'novo' | 'em_contato' | 'convertido' | 'descartado'

export interface LeadRecord {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  cnpj?: string
  volume?: LeadVolume
  message?: string
  status: LeadStatus
  created: string
  updated: string
}

export interface LeadPayload {
  name: string
  email: string
  phone: string
  company?: string
  cnpj?: string
  volume?: LeadVolume
  message?: string
}

export interface UserRecord {
  id: string
  email: string
  name?: string
  avatar?: string
  tenant?: string
  role?: UserRole
  created: string
  updated: string
}

export interface OrderItem {
  sku: string
  name: string
  qty: number
  price: number
}

export interface OrderRecord {
  id: string
  tenant: string
  marketplace: MarketplaceType
  marketplace_order_id?: string
  customer_name?: string
  customer_doc?: string
  customer_email?: string
  customer_phone?: string
  items: OrderItem[]
  subtotal?: number
  shipping?: number
  discount?: number
  total: number
  status: OrderStatus
  nfe_status: NfeStatus
  created: string
  updated: string
}

export interface ProductRecord {
  id: string
  tenant: string
  sku: string
  name: string
  description?: string
  price: number
  cost?: number
  stock: number
  ncm?: string
  cest?: string
  cfop?: string
  ean?: string
  status: 'active' | 'inactive'
  created: string
  updated: string
}

export interface InvoiceRecord {
  id: string
  tenant: string
  order?: string
  number?: string
  series?: string
  key?: string
  status: InvoiceStatus
  environment: NfeEnvironment
  amount?: number
  xml?: string
  pdf?: string
  protocol?: string
  error_message?: string
  issued_at?: string
  created: string
  updated: string
}

export interface CertificateRecord {
  id: string
  tenant: string
  label?: string
  file?: string
  password?: string
  valid_from?: string
  valid_until?: string
  status: 'valid' | 'expiring' | 'expired'
  created: string
  updated: string
}

export interface NfeSettingsRecord {
  id: string
  tenant: string
  provider: NfeProvider
  environment: NfeEnvironment
  series: string
  csc?: string
  csc_id?: string
  webhook_url?: string
  created: string
  updated: string
}

export interface MarketplaceConnectionRecord {
  id: string
  tenant: string
  marketplace: MarketplaceType
  account_name?: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  status: 'connected' | 'error' | 'disconnected'
  last_sync?: string
  created: string
  updated: string
}
