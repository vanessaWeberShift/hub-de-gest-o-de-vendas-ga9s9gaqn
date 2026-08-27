import pb from '@/lib/pocketbase/client'
import {
  OrderRecord,
  ProductRecord,
  InvoiceRecord,
  CertificateRecord,
  NfeSettingsRecord,
  MarketplaceConnectionRecord,
} from '@/types'

export const ordersService = {
  async list(tenantId: string, filterStr?: string, sort = '-created', page = 1, perPage = 50) {
    let filter = `tenant = "${tenantId}"`
    if (filterStr) {
      filter += ` && (${filterStr})`
    }
    return await pb.collection('orders').getList<OrderRecord>(page, perPage, {
      filter,
      sort,
    })
  },

  async getById(id: string) {
    return await pb.collection('orders').getOne<OrderRecord>(id)
  },

  async create(data: Partial<OrderRecord>) {
    return await pb.collection('orders').create<OrderRecord>(data)
  },

  async update(id: string, data: Partial<OrderRecord>) {
    return await pb.collection('orders').update<OrderRecord>(id, data)
  },

  async delete(id: string) {
    return await pb.collection('orders').delete(id)
  },
}

export const productsService = {
  async list(tenantId: string, search = '', status?: string) {
    let filter = `tenant = "${tenantId}"`
    if (search) {
      filter += ` && (name ~ "${search}" || sku ~ "${search}")`
    }
    if (status && status !== 'all') {
      filter += ` && status = "${status}"`
    }
    return await pb.collection('products').getFullList<ProductRecord>({
      filter,
      sort: 'name',
    })
  },

  async create(data: Partial<ProductRecord>) {
    return await pb.collection('products').create<ProductRecord>(data)
  },

  async update(id: string, data: Partial<ProductRecord>) {
    return await pb.collection('products').update<ProductRecord>(id, data)
  },

  async delete(id: string) {
    return await pb.collection('products').delete(id)
  },
}

export const invoicesService = {
  async list(tenantId: string, filterStr?: string, sort = '-created') {
    let filter = `tenant = "${tenantId}"`
    if (filterStr) {
      filter += ` && (${filterStr})`
    }
    return await pb.collection('invoices').getFullList<InvoiceRecord>({
      filter,
      sort,
    })
  },

  async getById(id: string) {
    return await pb.collection('invoices').getOne<InvoiceRecord>(id)
  },

  async issueNfe(orderId: string) {
    return await pb.send<{
      success: boolean
      message: string
      invoice_id: string
      number: string
      key: string
      protocol: string
    }>('/backend/v1/nfe/issue', {
      method: 'POST',
      body: { order_id: orderId },
    })
  },

  async cancelNfe(invoiceId: string, justification: string) {
    return await pb.send<{ success: boolean; message: string; invoice_id: string }>(
      '/backend/v1/nfe/' + invoiceId + '/cancel',
      {
        method: 'POST',
        body: { justification },
      },
    )
  },

  async checkProvider() {
    return await pb.send<{
      status: string
      provider: string
      environment: string
      secret_configured: boolean
      certificate_status: string
      sefaz_status: string
      message: string
    }>('/backend/v1/nfe/check', {
      method: 'GET',
    })
  },
}

export const certificatesService = {
  async list(tenantId: string) {
    return await pb.collection('certificates').getFullList<CertificateRecord>({
      filter: `tenant = "${tenantId}"`,
      sort: '-created',
    })
  },

  async create(data: FormData | Partial<CertificateRecord>) {
    return await pb.collection('certificates').create<CertificateRecord>(data)
  },

  async delete(id: string) {
    return await pb.collection('certificates').delete(id)
  },
}

export const settingsService = {
  async getNfeSettings(tenantId: string) {
    try {
      return await pb
        .collection('nfe_settings')
        .getFirstListItem<NfeSettingsRecord>(`tenant = "${tenantId}"`)
    } catch (_) {
      return null
    }
  },

  async saveNfeSettings(tenantId: string, data: Partial<NfeSettingsRecord>) {
    const existing = await this.getNfeSettings(tenantId)
    if (existing) {
      return await pb.collection('nfe_settings').update<NfeSettingsRecord>(existing.id, data)
    } else {
      return await pb.collection('nfe_settings').create<NfeSettingsRecord>({
        ...data,
        tenant: tenantId,
      })
    }
  },

  async updateTenant(tenantId: string, data: FormData | Record<string, any>) {
    return await pb.collection('tenants').update(tenantId, data)
  },

  async listMembers(tenantId: string) {
    return await pb.collection('users').getFullList({
      filter: `tenant = "${tenantId}"`,
      sort: 'name',
    })
  },

  async inviteMember(tenantId: string, email: string, name: string, role: string) {
    // Creates or associates user
    return await pb.collection('users').create({
      email,
      password: 'Skip@TempPassword123!',
      passwordConfirm: 'Skip@TempPassword123!',
      name,
      tenant: tenantId,
      role,
    })
  },

  async removeMember(userId: string) {
    return await pb.collection('users').update(userId, { tenant: null })
  },
}

export const marketplaceService = {
  async list(tenantId: string) {
    return await pb.collection('marketplace_connections').getFullList<MarketplaceConnectionRecord>({
      filter: `tenant = "${tenantId}"`,
      sort: 'marketplace',
    })
  },

  async saveConnection(tenantId: string, data: Partial<MarketplaceConnectionRecord>) {
    if (data.id) {
      return await pb
        .collection('marketplace_connections')
        .update<MarketplaceConnectionRecord>(data.id, data)
    }
    return await pb.collection('marketplace_connections').create<MarketplaceConnectionRecord>({
      ...data,
      tenant: tenantId,
    })
  },

  async disconnect(id: string) {
    return await pb.collection('marketplace_connections').update(id, {
      status: 'disconnected',
      access_token: '',
      refresh_token: '',
    })
  },

  async syncOrders(marketplace?: string) {
    return await pb.send<{
      success: boolean
      synced_connections: number
      active_synced: number
      message: string
    }>('/backend/v1/marketplace/sync', {
      method: 'POST',
      body: { marketplace },
    })
  },
}

export const leadsService = {
  async submitLead(data: {
    name: string
    email: string
    phone: string
    company?: string
    cnpj?: string
    volume?: string
    message?: string
  }) {
    return await pb.send<{
      success: boolean
      message: string
      lead_id?: string
    }>('/backend/v1/leads', {
      method: 'POST',
      body: data,
    })
  },
}
