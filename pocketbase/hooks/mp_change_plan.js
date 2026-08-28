routerAdd(
  'POST',
  '/backend/v1/mercadopago/change-plan',
  (e) => {
    const body = e.requestInfo().body || {}
    const tenantId = (body.tenantId || '').trim()
    const newPlan = (body.newPlan || '').toLowerCase()
    const newBillingCycle = body.billingCycle === 'annual' ? 'annual' : 'monthly'
    const cardToken = (body.cardToken || '').trim()

    if (!tenantId || !newPlan) {
      return e.json(400, { message: 'tenantId e newPlan são obrigatórios.' })
    }

    const validPlans = ['gratis', 'essencial', 'profissional', 'enterprise']
    if (validPlans.indexOf(newPlan) === -1) {
      return e.json(400, { message: 'Plano inválido.' })
    }

    let tenantRecord = null
    try {
      tenantRecord = $app.findFirstRecordByData('tenants', 'id', tenantId)
    } catch (_) {
      return e.json(404, { message: 'Empresa não encontrada.' })
    }

    const pricesMonthly = { essencial: 97, profissional: 197, enterprise: 397 }
    const pricesAnnual = { essencial: 77, profissional: 157, enterprise: 317 }
    const planTitles = {
      essencial: 'Hub Vendas - Plano Essencial',
      profissional: 'Hub Vendas - Plano Profissional',
      enterprise: 'Hub Vendas - Plano Enterprise',
    }

    const oldPreapprovalId = tenantRecord.getString('mp_preapproval_id')
    const accessToken = $os.getenv('MERCADOPAGO_ACCESS_TOKEN') || ''
    const isRealMp = !!accessToken && !!cardToken && !cardToken.startsWith('tok_demo_')

    if (newPlan === 'gratis') {
      // Cancel any previous MP subscription
      if (oldPreapprovalId && accessToken && !oldPreapprovalId.startsWith('preapp_sim_')) {
        try {
          $http.send({
            url: 'https://api.mercadopago.com/preapproval/' + oldPreapprovalId,
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + accessToken,
            },
            body: JSON.stringify({ status: 'cancelled' }),
            timeout: 10,
          })
        } catch (_) {}
      }

      tenantRecord.set('plan', 'gratis')
      tenantRecord.set('subscription_status', 'free')
      tenantRecord.set('billing_cycle', 'monthly')
      $app.save(tenantRecord)

      return e.json(200, {
        success: true,
        message: 'Plano alterado para Grátis com sucesso.',
        plan: 'gratis',
        status: 'free',
      })
    }

    const transactionAmount =
      newBillingCycle === 'annual'
        ? (pricesAnnual[newPlan] || 97) * 12
        : pricesMonthly[newPlan] || 97

    let newPreapprovalId = 'preapp_sim_' + $security.randomString(16)
    const now = new Date()
    const nextMonth = new Date(
      now.getTime() + (newBillingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000,
    )
    const nextBillingIso = nextMonth.toISOString().replace('T', ' ').slice(0, 19)

    if (isRealMp) {
      try {
        // 1. Cancel old preapproval if exists
        if (oldPreapprovalId && !oldPreapprovalId.startsWith('preapp_sim_')) {
          try {
            $http.send({
              url: 'https://api.mercadopago.com/preapproval/' + oldPreapprovalId,
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + accessToken,
              },
              body: JSON.stringify({ status: 'cancelled' }),
              timeout: 10,
            })
          } catch (_) {}
        }

        // 2. Create new preapproval
        const mpPayload = {
          payer_email: tenantRecord.getString('email') || 'financeiro@empresa.com.br',
          back_url: ($os.getenv('SITE_URL') || 'https://hubvendas.com.br') + '/settings',
          reason:
            (planTitles[newPlan] || 'Hub Vendas') +
            (newBillingCycle === 'annual' ? ' (Anual)' : ' (Mensal)'),
          auto_recurring: {
            frequency: newBillingCycle === 'annual' ? 12 : 1,
            frequency_type: 'months',
            transaction_amount: transactionAmount,
            currency_id: 'BRL',
          },
          card_token_id: cardToken,
          status: 'authorized',
        }

        const res = $http.send({
          url: 'https://api.mercadopago.com/preapproval',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + accessToken,
          },
          body: JSON.stringify(mpPayload),
          timeout: 15,
        })

        if (res.statusCode >= 200 && res.statusCode < 300 && res.json && res.json.id) {
          newPreapprovalId = res.json.id
        } else {
          return e.json(400, {
            message:
              (res.json && (res.json.message || res.json.error)) ||
              'Não foi possível atualizar o plano no Mercado Pago. Verifique os dados do cartão.',
            mpError: res.json,
          })
        }
      } catch (err) {
        return e.json(500, {
          message: 'Erro ao comunicar com Mercado Pago: ' + (err ? err.toString() : 'Erro'),
        })
      }
    }

    tenantRecord.set('plan', newPlan)
    tenantRecord.set('billing_cycle', newBillingCycle)
    tenantRecord.set('subscription_status', 'active')
    tenantRecord.set('next_billing_date', nextBillingIso)
    tenantRecord.set('mp_preapproval_id', newPreapprovalId)
    if (body.cardLast4) tenantRecord.set('card_last4', body.cardLast4)
    if (body.cardBrand) tenantRecord.set('card_brand', body.cardBrand)
    if (body.cardHolderName) tenantRecord.set('card_holder_name', body.cardHolderName)
    $app.save(tenantRecord)

    // Record payment in history
    try {
      const subPaymentsCol = $app.findCollectionByNameOrId('subscription_payments')
      const pRecord = new Record(subPaymentsCol)
      pRecord.set('tenant', tenantId)
      pRecord.set('mp_preapproval_id', newPreapprovalId)
      pRecord.set('amount', transactionAmount)
      pRecord.set('plan', newPlan)
      pRecord.set('billing_cycle', newBillingCycle)
      pRecord.set('status', 'approved')
      pRecord.set(
        'description',
        'Assinatura Plano ' +
          (newPlan.charAt(0).toUpperCase() + newPlan.slice(1)) +
          ' (' +
          (newBillingCycle === 'annual' ? 'Anual' : 'Mensal') +
          ')',
      )
      pRecord.set('payment_date', now.toISOString().replace('T', ' ').slice(0, 19))
      pRecord.set('card_last4', body.cardLast4 || tenantRecord.getString('card_last4') || '4242')
      pRecord.set('card_brand', body.cardBrand || tenantRecord.getString('card_brand') || 'visa')
      $app.save(pRecord)
    } catch (_) {}

    return e.json(200, {
      success: true,
      message: 'Plano atualizado para ' + newPlan.toUpperCase() + ' com sucesso!',
      plan: newPlan,
      billingCycle: newBillingCycle,
      status: 'active',
      nextBillingDate: nextBillingIso,
    })
  },
  $apis.requireAuth(),
)
