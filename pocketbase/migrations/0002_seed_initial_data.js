migrate(
  (app) => {
    // 1. Seed Tenant
    let tenantId = ''
    try {
      const existingTenant = app.findFirstRecordByData('tenants', 'name', 'WShift Comércio')
      tenantId = existingTenant.id
    } catch (_) {
      const tenantsCol = app.findCollectionByNameOrId('tenants')
      const tenant = new Record(tenantsCol)
      tenant.set('name', 'WShift Comércio')
      tenant.set('cnpj', '12.345.678/0001-90')
      tenant.set('ie', '123456789012')
      tenant.set('email', 'contato@wshift.com.br')
      tenant.set('phone', '(11) 98765-4321')
      tenant.set('address', 'Av. Paulista, 1000, Bela Vista, São Paulo – SP, CEP 01310-100')
      app.save(tenant)
      tenantId = tenant.id
    }

    // 2. Seed Admin User
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      const existingUser = app.findAuthRecordByEmail('_pb_users_auth_', 'vanessa@wshift.com.br')
      existingUser.set('tenant', tenantId)
      existingUser.set('role', 'admin')
      existingUser.set('name', 'Vanessa WShift')
      app.save(existingUser)
    } catch (_) {
      const user = new Record(usersCol)
      user.setEmail('vanessa@wshift.com.br')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Vanessa WShift')
      user.set('tenant', tenantId)
      user.set('role', 'admin')
      app.save(user)
    }

    // 3. Seed NF-e Settings
    try {
      app.findFirstRecordByData('nfe_settings', 'tenant', tenantId)
    } catch (_) {
      const nfeCol = app.findCollectionByNameOrId('nfe_settings')
      const nfeSet = new Record(nfeCol)
      nfeSet.set('tenant', tenantId)
      nfeSet.set('provider', 'nuvem_fiscal')
      nfeSet.set('environment', 'homologacao')
      nfeSet.set('series', '1')
      nfeSet.set('csc', '123456')
      nfeSet.set('csc_id', '000001')
      app.save(nfeSet)
    }

    // 4. Seed Products
    const productsCol = app.findCollectionByNameOrId('products')
    const sampleProducts = [
      {
        sku: 'FNB-001',
        name: 'Fone de Ouvido Bluetooth A1 Pro',
        description: 'Fone intra-auricular com cancelamento ativo de ruído ANC e bateria de 24h',
        price: 189.9,
        cost: 78.5,
        stock: 45,
        ncm: '85183000',
        cest: '2105700',
        cfop: '5102',
        ean: '7898951234011',
        status: 'active',
      },
      {
        sku: 'SPX-010',
        name: 'Smartphone W-Tech X10 128GB',
        description: 'Smartphone com câmera tripla 64MP, 8GB RAM e tela AMOLED 120Hz',
        price: 1899.0,
        cost: 1250.0,
        stock: 12,
        ncm: '85171300',
        cest: '2105300',
        cfop: '5102',
        ean: '7898951234028',
        status: 'active',
      },
      {
        sku: 'TEC-007',
        name: 'Teclado Mecânico Gamer RGB Switch Brown',
        description: 'Teclado mecânico ABNT2 com iluminação RGB personalizável e anti-ghosting',
        price: 349.9,
        cost: 160.0,
        stock: 28,
        ncm: '84716053',
        cest: '2103100',
        cfop: '5102',
        ean: '7898951234035',
        status: 'active',
      },
      {
        sku: 'MOU-003',
        name: 'Mouse Óptico Sem Fio 4000 DPI',
        description: 'Mouse ergonômico recarregável via USB-C com clique silencioso',
        price: 119.9,
        cost: 45.0,
        stock: 4,
        ncm: '84716052',
        cest: '2103000',
        cfop: '5102',
        ean: '7898951234042',
        status: 'active',
      },
      {
        sku: 'MON-024',
        name: 'Monitor UltraWide 24" IPS 75Hz',
        description: 'Monitor com resolução Full HD, bordas ultrafinas e suporte VESA',
        price: 899.0,
        cost: 580.0,
        stock: 8,
        ncm: '85285220',
        cest: '2106200',
        cfop: '5102',
        ean: '7898951234059',
        status: 'active',
      },
      {
        sku: 'SUP-009',
        name: 'Suporte Articulado de Notebook Alumínio',
        description: 'Suporte dobrável ergonômico com regulagem de altura e base antiderrapante',
        price: 149.9,
        cost: 52.0,
        stock: 3,
        ncm: '83025000',
        cest: '1001200',
        cfop: '5102',
        ean: '7898951234066',
        status: 'active',
      },
    ]

    for (let i = 0; i < sampleProducts.length; i++) {
      const p = sampleProducts[i]
      try {
        app.findFirstRecordByData('products', 'sku', p.sku)
      } catch (_) {
        const prod = new Record(productsCol)
        prod.set('tenant', tenantId)
        prod.set('sku', p.sku)
        prod.set('name', p.name)
        prod.set('description', p.description)
        prod.set('price', p.price)
        prod.set('cost', p.cost)
        prod.set('stock', p.stock)
        prod.set('ncm', p.ncm)
        prod.set('cest', p.cest)
        prod.set('cfop', p.cfop)
        prod.set('ean', p.ean)
        prod.set('status', p.status)
        app.save(prod)
      }
    }

    // 5. Seed Orders & Invoices
    const ordersCol = app.findCollectionByNameOrId('orders')
    const invoicesCol = app.findCollectionByNameOrId('invoices')

    const sampleOrders = [
      {
        marketplace: 'mercadolivre',
        marketplace_order_id: 'MLB-20250301-9841',
        customer_name: 'Carlos Eduardo Silva',
        customer_doc: '284.918.302-14',
        customer_email: 'carlos.silva@email.com',
        customer_phone: '(11) 97123-8899',
        items: [{ sku: 'FNB-001', name: 'Fone de Ouvido Bluetooth A1 Pro', qty: 2, price: 189.9 }],
        subtotal: 379.8,
        shipping: 25.0,
        discount: 0.0,
        total: 404.8,
        status: 'paid',
        nfe_status: 'issued',
      },
      {
        marketplace: 'shopee',
        marketplace_order_id: 'SHP-884920194A',
        customer_name: 'Mariana Costa Santos',
        customer_doc: '194.829.401-88',
        customer_email: 'mariana.costa@email.com',
        customer_phone: '(21) 98844-3322',
        items: [
          { sku: 'TEC-007', name: 'Teclado Mecânico Gamer RGB', qty: 1, price: 349.9 },
          { sku: 'MOU-003', name: 'Mouse Óptico Sem Fio 4000 DPI', qty: 1, price: 119.9 },
        ],
        subtotal: 469.8,
        shipping: 0.0,
        discount: 20.0,
        total: 449.8,
        status: 'paid',
        nfe_status: 'pending',
      },
      {
        marketplace: 'amazon',
        marketplace_order_id: 'AMZ-702-9948123',
        customer_name: 'Rodrigo Almeida Ribeiro',
        customer_doc: '089.472.938-51',
        customer_email: 'rodrigo.almeida@email.com',
        customer_phone: '(31) 99341-2299',
        items: [{ sku: 'SPX-010', name: 'Smartphone W-Tech X10 128GB', qty: 1, price: 1899.0 }],
        subtotal: 1899.0,
        shipping: 42.5,
        discount: 50.0,
        total: 1891.5,
        status: 'shipped',
        nfe_status: 'issued',
      },
      {
        marketplace: 'magalu',
        marketplace_order_id: 'MGL-99482103',
        customer_name: 'Patrícia Helena Lima',
        customer_doc: '312.948.102-33',
        customer_email: 'patricia.lima@email.com',
        customer_phone: '(41) 98711-5544',
        items: [
          { sku: 'MON-024', name: 'Monitor UltraWide 24" IPS 75Hz', qty: 1, price: 899.0 },
          { sku: 'SUP-009', name: 'Suporte Articulado de Notebook', qty: 1, price: 149.9 },
        ],
        subtotal: 1048.9,
        shipping: 35.0,
        discount: 30.0,
        total: 1053.9,
        status: 'delivered',
        nfe_status: 'issued',
      },
      {
        marketplace: 'manual',
        marketplace_order_id: 'DIR-20250302-001',
        customer_name: 'Lucas Mendes Ferreira',
        customer_doc: '405.819.321-77',
        customer_email: 'lucas.mendes@email.com',
        customer_phone: '(19) 99128-4477',
        items: [
          { sku: 'SUP-009', name: 'Suporte Articulado de Notebook Alumínio', qty: 2, price: 149.9 },
        ],
        subtotal: 299.8,
        shipping: 18.0,
        discount: 10.0,
        total: 307.8,
        status: 'paid',
        nfe_status: 'none',
      },
      {
        marketplace: 'mercadolivre',
        marketplace_order_id: 'MLB-20250302-1102',
        customer_name: 'Beatriz Nogueira Duarte',
        customer_doc: '554.192.839-01',
        customer_email: 'beatriz.nogueira@email.com',
        customer_phone: '(81) 98234-9988',
        items: [{ sku: 'MOU-003', name: 'Mouse Óptico Sem Fio 4000 DPI', qty: 2, price: 119.9 }],
        subtotal: 239.8,
        shipping: 20.0,
        discount: 0.0,
        total: 259.8,
        status: 'new',
        nfe_status: 'none',
      },
    ]

    for (let j = 0; j < sampleOrders.length; j++) {
      const o = sampleOrders[j]
      let orderRecord = null
      try {
        orderRecord = app.findFirstRecordByData(
          'orders',
          'marketplace_order_id',
          o.marketplace_order_id,
        )
      } catch (_) {
        orderRecord = new Record(ordersCol)
        orderRecord.set('tenant', tenantId)
        orderRecord.set('marketplace', o.marketplace)
        orderRecord.set('marketplace_order_id', o.marketplace_order_id)
        orderRecord.set('customer_name', o.customer_name)
        orderRecord.set('customer_doc', o.customer_doc)
        orderRecord.set('customer_email', o.customer_email)
        orderRecord.set('customer_phone', o.customer_phone)
        orderRecord.set('items', o.items)
        orderRecord.set('subtotal', o.subtotal)
        orderRecord.set('shipping', o.shipping)
        orderRecord.set('discount', o.discount)
        orderRecord.set('total', o.total)
        orderRecord.set('status', o.status)
        orderRecord.set('nfe_status', o.nfe_status)
        app.save(orderRecord)
      }

      if (o.nfe_status === 'issued' && orderRecord) {
        try {
          app.findFirstRecordByData('invoices', 'order', orderRecord.id)
        } catch (_) {
          const inv = new Record(invoicesCol)
          inv.set('tenant', tenantId)
          inv.set('order', orderRecord.id)
          inv.set('number', '00010' + (j + 1))
          inv.set('series', '1')
          inv.set('key', '3525031234567800019055001000010' + (j + 1) + '1298492019')
          inv.set('status', 'issued')
          inv.set('environment', 'homologacao')
          inv.set('amount', o.total)
          inv.set('protocol', '13525000984123' + j)
          inv.set('issued_at', new Date().toISOString())
          app.save(inv)
        }
      }
    }

    // 6. Seed Marketplace Connections
    const mcCol = app.findCollectionByNameOrId('marketplace_connections')
    const sampleConnections = [
      { marketplace: 'mercadolivre', account_name: 'WShift Store ML', status: 'disconnected' },
      { marketplace: 'shopee', account_name: 'WShift Oficial Shopee', status: 'disconnected' },
    ]

    for (let k = 0; k < sampleConnections.length; k++) {
      const mc = sampleConnections[k]
      try {
        app.findFirstRecordByData('marketplace_connections', 'marketplace', mc.marketplace)
      } catch (_) {
        const mcRec = new Record(mcCol)
        mcRec.set('tenant', tenantId)
        mcRec.set('marketplace', mc.marketplace)
        mcRec.set('account_name', mc.account_name)
        mcRec.set('status', mc.status)
        app.save(mcRec)
      }
    }

    // 7. Seed Certificate (expired sample)
    const certCol = app.findCollectionByNameOrId('certificates')
    try {
      app.findFirstRecordByData('certificates', 'label', 'Certificado e-CNPJ A1 2024 (Expirado)')
    } catch (_) {
      const cert = new Record(certCol)
      cert.set('tenant', tenantId)
      cert.set('label', 'Certificado e-CNPJ A1 2024 (Expirado)')
      cert.set('valid_from', '2024-01-10 00:00:00.000Z')
      cert.set('valid_until', '2025-01-10 23:59:59.000Z')
      cert.set('status', 'expired')
      app.save(cert)
    }
  },
  (app) => {
    // down logic is optional for seed
  },
)
