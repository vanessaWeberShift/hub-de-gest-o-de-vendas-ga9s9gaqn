migrate(
  (app) => {
    // 1. Add plan field to tenants if not present
    const tenantsCol = app.findCollectionByNameOrId('tenants')
    if (!tenantsCol.fields.getByName('plan')) {
      tenantsCol.fields.add(
        new SelectField({
          name: 'plan',
          values: ['gratis', 'essencial', 'profissional', 'enterprise'],
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(tenantsCol)
    }

    // 2. Create leads collection
    const leads = new Collection({
      name: 'leads',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: '', // Public can create leads
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text', required: true },
        { name: 'company', type: 'text' },
        { name: 'cnpj', type: 'text' },
        {
          name: 'volume',
          type: 'select',
          values: ['ate_50', '50_200', '200_500', '500_mais'],
          maxSelect: 1,
          required: false,
        },
        { name: 'message', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['novo', 'em_contato', 'convertido', 'descartado'],
          maxSelect: 1,
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_leads_created ON leads (created DESC)',
        'CREATE INDEX idx_leads_status ON leads (status)',
      ],
    })
    app.save(leads)
  },
  (app) => {
    try {
      const leads = app.findCollectionByNameOrId('leads')
      app.delete(leads)
    } catch (_) {}

    try {
      const tenantsCol = app.findCollectionByNameOrId('tenants')
      const planField = tenantsCol.fields.getByName('plan')
      if (planField) {
        tenantsCol.fields.removeByName('plan')
        app.save(tenantsCol)
      }
    } catch (_) {}
  },
)
