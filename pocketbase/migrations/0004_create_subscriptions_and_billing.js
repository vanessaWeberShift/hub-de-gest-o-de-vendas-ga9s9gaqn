migrate(
  (app) => {
    const tenantsCol = app.findCollectionByNameOrId('tenants')
    const tenantsId = tenantsCol.id

    // 1. Add subscription fields to tenants if not present
    if (!tenantsCol.fields.getByName('billing_cycle')) {
      tenantsCol.fields.add(
        new SelectField({
          name: 'billing_cycle',
          values: ['monthly', 'annual'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    if (!tenantsCol.fields.getByName('subscription_status')) {
      tenantsCol.fields.add(
        new SelectField({
          name: 'subscription_status',
          values: ['trial', 'active', 'past_due', 'canceled', 'unpaid', 'free'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    if (!tenantsCol.fields.getByName('trial_ends_at')) {
      tenantsCol.fields.add(new DateField({ name: 'trial_ends_at' }))
    }

    if (!tenantsCol.fields.getByName('next_billing_date')) {
      tenantsCol.fields.add(new DateField({ name: 'next_billing_date' }))
    }

    if (!tenantsCol.fields.getByName('mp_preapproval_id')) {
      tenantsCol.fields.add(new TextField({ name: 'mp_preapproval_id' }))
    }

    if (!tenantsCol.fields.getByName('mp_customer_id')) {
      tenantsCol.fields.add(new TextField({ name: 'mp_customer_id' }))
    }

    if (!tenantsCol.fields.getByName('card_last4')) {
      tenantsCol.fields.add(new TextField({ name: 'card_last4' }))
    }

    if (!tenantsCol.fields.getByName('card_brand')) {
      tenantsCol.fields.add(new TextField({ name: 'card_brand' }))
    }

    if (!tenantsCol.fields.getByName('card_holder_name')) {
      tenantsCol.fields.add(new TextField({ name: 'card_holder_name' }))
    }

    if (!tenantsCol.fields.getByName('canceled_at')) {
      tenantsCol.fields.add(new DateField({ name: 'canceled_at' }))
    }

    app.save(tenantsCol)

    // 2. Create subscription_payments collection for invoice/payment history
    const subscriptionPayments = new Collection({
      name: 'subscription_payments',
      type: 'base',
      listRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      viewRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      deleteRule: "@request.auth.id != '' && tenant = @request.auth.tenant",
      fields: [
        { name: 'tenant', type: 'relation', required: true, collectionId: tenantsId, maxSelect: 1 },
        { name: 'mp_payment_id', type: 'text' },
        { name: 'mp_preapproval_id', type: 'text' },
        { name: 'amount', type: 'number', required: true },
        {
          name: 'plan',
          type: 'select',
          values: ['gratis', 'essencial', 'profissional', 'enterprise'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'billing_cycle',
          type: 'select',
          values: ['monthly', 'annual'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['approved', 'pending', 'rejected', 'refunded', 'trial'],
          maxSelect: 1,
          required: true,
        },
        { name: 'description', type: 'text' },
        { name: 'payment_date', type: 'date' },
        { name: 'card_last4', type: 'text' },
        { name: 'card_brand', type: 'text' },
        { name: 'invoice_url', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_sub_pay_tenant ON subscription_payments (tenant, created DESC)',
        'CREATE INDEX idx_sub_pay_mp_id ON subscription_payments (mp_payment_id)',
      ],
    })
    app.save(subscriptionPayments)

    // 3. Populate existing tenants with default subscription data if empty
    try {
      const allTenants = app.findRecordsByFilter('tenants', '', 'created', 100, 0)
      const now = new Date()
      for (let i = 0; i < allTenants.length; i++) {
        const t = allTenants[i]
        const plan = t.getString('plan') || 'gratis'
        if (!t.getString('subscription_status')) {
          if (plan === 'gratis') {
            t.set('subscription_status', 'free')
          } else {
            t.set('subscription_status', 'active')
            t.set('billing_cycle', 'monthly')
            const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            t.set('next_billing_date', nextMonth.toISOString().replace('T', ' ').slice(0, 19))
            t.set('card_last4', '4242')
            t.set('card_brand', 'visa')
            t.set('card_holder_name', t.getString('name') || 'Titular')
          }
          app.save(t)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const subPayments = app.findCollectionByNameOrId('subscription_payments')
      app.delete(subPayments)
    } catch (_) {}

    try {
      const tenantsCol = app.findCollectionByNameOrId('tenants')
      const fieldsToRemove = [
        'billing_cycle',
        'subscription_status',
        'trial_ends_at',
        'next_billing_date',
        'mp_preapproval_id',
        'mp_customer_id',
        'card_last4',
        'card_brand',
        'card_holder_name',
        'canceled_at',
      ]
      for (let i = 0; i < fieldsToRemove.length; i++) {
        const f = tenantsCol.fields.getByName(fieldsToRemove[i])
        if (f) {
          tenantsCol.fields.removeByName(fieldsToRemove[i])
        }
      }
      app.save(tenantsCol)
    } catch (_) {}
  },
)
