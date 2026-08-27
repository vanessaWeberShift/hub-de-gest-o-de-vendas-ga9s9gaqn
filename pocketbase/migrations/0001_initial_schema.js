migrate(
  (app) => {
    // 1. Create tenants collection
    const tenants = new Collection({
      name: 'tenants',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.tenant = id || @request.auth.tenant = '')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.tenant = id || @request.auth.tenant = '')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (@request.auth.tenant = id || @request.auth.tenant = '')",
      deleteRule: "@request.auth.id != '' && @request.auth.tenant = id",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'cnpj', type: 'text' },
        { name: 'ie', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'address', type: 'text' },
        {
          name: 'logo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_tenants_created ON tenants (created DESC)'],
    })
    app.save(tenants)

    // 2. Update users collection to add tenant relation and role
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const tenantsId = tenants.id

    if (!usersCol.fields.getByName('tenant')) {
      usersCol.fields.add(
        new RelationField({
          name: 'tenant',
          collectionId: tenantsId,
          maxSelect: 1,
          required: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('role')) {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'member'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    app.save(usersCol)

    // 3. marketplace_connections
    const marketplaceConnections = new Collection({
      name: 'marketplace_connections',
      type: 'base',
      listRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      viewRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      deleteRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      fields: [
        { name: 'tenant', type: 'relation', required: true, collectionId: tenantsId, maxSelect: 1 },
        {
          name: 'marketplace',
          type: 'select',
          required: true,
          values: ['mercadolivre', 'shopee', 'amazon', 'magalu', 'netshoes', 'shein', 'outros'],
          maxSelect: 1,
        },
        { name: 'account_name', type: 'text' },
        { name: 'access_token', type: 'text' },
        { name: 'refresh_token', type: 'text' },
        { name: 'token_expires_at', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['connected', 'error', 'disconnected'],
          maxSelect: 1,
        },
        { name: 'last_sync', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mc_tenant_marketplace ON marketplace_connections (tenant, marketplace)',
        'CREATE INDEX idx_mc_status ON marketplace_connections (status)',
      ],
    })
    app.save(marketplaceConnections)

    // 4. products
    const products = new Collection({
      name: 'products',
      type: 'base',
      listRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      viewRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      deleteRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      fields: [
        { name: 'tenant', type: 'relation', required: true, collectionId: tenantsId, maxSelect: 1 },
        { name: 'sku', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'price', type: 'number', required: true },
        { name: 'cost', type: 'number' },
        { name: 'stock', type: 'number' },
        { name: 'ncm', type: 'text' },
        { name: 'cest', type: 'text' },
        { name: 'cfop', type: 'text' },
        { name: 'ean', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['active', 'inactive'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_products_tenant_sku ON products (tenant, sku)',
        'CREATE INDEX idx_products_status ON products (status)',
        'CREATE INDEX idx_products_created ON products (created DESC)',
      ],
    })
    app.save(products)

    // 5. orders
    const orders = new Collection({
      name: 'orders',
      type: 'base',
      listRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      viewRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      deleteRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      fields: [
        { name: 'tenant', type: 'relation', required: true, collectionId: tenantsId, maxSelect: 1 },
        {
          name: 'marketplace',
          type: 'select',
          required: true,
          values: ['mercadolivre', 'shopee', 'amazon', 'magalu', 'netshoes', 'shein', 'manual'],
          maxSelect: 1,
        },
        { name: 'marketplace_order_id', type: 'text' },
        { name: 'customer_name', type: 'text' },
        { name: 'customer_doc', type: 'text' },
        { name: 'customer_email', type: 'text' },
        { name: 'customer_phone', type: 'text' },
        { name: 'items', type: 'json' },
        { name: 'subtotal', type: 'number' },
        { name: 'shipping', type: 'number' },
        { name: 'discount', type: 'number' },
        { name: 'total', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['new', 'paid', 'preparing', 'shipped', 'delivered', 'canceled', 'refunded'],
          maxSelect: 1,
        },
        {
          name: 'nfe_status',
          type: 'select',
          required: true,
          values: ['none', 'pending', 'issued', 'canceled', 'error'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_orders_tenant_status ON orders (tenant, status)',
        'CREATE INDEX idx_orders_marketplace ON orders (marketplace)',
        'CREATE INDEX idx_orders_created ON orders (created DESC)',
      ],
    })
    app.save(orders)

    // 6. invoices
    const ordersId = orders.id
    const invoices = new Collection({
      name: 'invoices',
      type: 'base',
      listRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      viewRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      deleteRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      fields: [
        { name: 'tenant', type: 'relation', required: true, collectionId: tenantsId, maxSelect: 1 },
        { name: 'order', type: 'relation', collectionId: ordersId, maxSelect: 1 },
        { name: 'number', type: 'text' },
        { name: 'series', type: 'text' },
        { name: 'key', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'pending', 'issued', 'canceled', 'error', 'homologation'],
          maxSelect: 1,
        },
        {
          name: 'environment',
          type: 'select',
          required: true,
          values: ['homologacao', 'producao'],
          maxSelect: 1,
        },
        { name: 'amount', type: 'number' },
        {
          name: 'xml',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/xml', 'text/xml'],
        },
        {
          name: 'pdf',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf'],
        },
        { name: 'protocol', type: 'text' },
        { name: 'error_message', type: 'text' },
        { name: 'issued_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_invoices_tenant_status ON invoices (tenant, status)',
        'CREATE INDEX idx_invoices_created ON invoices (created DESC)',
      ],
    })
    app.save(invoices)

    // 7. certificates
    const certificates = new Collection({
      name: 'certificates',
      type: 'base',
      listRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      viewRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      deleteRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      fields: [
        { name: 'tenant', type: 'relation', required: true, collectionId: tenantsId, maxSelect: 1 },
        { name: 'label', type: 'text' },
        {
          name: 'file',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/x-pkcs12', 'application/octet-stream'],
        },
        { name: 'password', type: 'text' },
        { name: 'valid_from', type: 'date' },
        { name: 'valid_until', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['valid', 'expiring', 'expired'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_cert_tenant_status ON certificates (tenant, status)'],
    })
    app.save(certificates)

    // 8. nfe_settings
    const nfeSettings = new Collection({
      name: 'nfe_settings',
      type: 'base',
      listRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      viewRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      deleteRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      fields: [
        { name: 'tenant', type: 'relation', required: true, collectionId: tenantsId, maxSelect: 1 },
        {
          name: 'provider',
          type: 'select',
          required: true,
          values: ['nuvem_fiscal', 'focus_nfe', 'nota_facil', 'e_notas'],
          maxSelect: 1,
        },
        {
          name: 'environment',
          type: 'select',
          required: true,
          values: ['homologacao', 'producao'],
          maxSelect: 1,
        },
        { name: 'series', type: 'text' },
        { name: 'csc', type: 'text' },
        { name: 'csc_id', type: 'text' },
        { name: 'webhook_url', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_nfe_settings_tenant ON nfe_settings (tenant)'],
    })
    app.save(nfeSettings)
  },
  (app) => {
    const toDelete = [
      'nfe_settings',
      'certificates',
      'invoices',
      'orders',
      'products',
      'marketplace_connections',
      'tenants',
    ]
    for (let i = 0; i < toDelete.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(toDelete[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
