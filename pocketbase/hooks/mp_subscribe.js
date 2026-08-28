routerAdd('POST', '/backend/v1/mercadopago/subscribe', (e) => {
  const body = e.requestInfo().body || {}
  const plan = (body.plan || 'essencial').toLowerCase()
  const billingCycle = body.billingCycle === 'annual' ? 'annual' : 'monthly'
  const email = (body.email || '').trim()
  const cardToken = (body.cardToken || '').trim()
  const cardHolderName = (body.cardHolderName || '').trim()
  const cardLast4 = (body.cardLast4 || '4242').trim()
  const cardBrand = (body.cardBrand || 'visa').trim()
  const tenantId = (body.tenantId || '').trim()

  const pricesMonthly = { essencial: 97, profissional: 197, enterprise: 397 }
  const pricesAnnual = { essencial: 77, profissional: 157, enterprise: 317 }
  const planTitles = {
    essencial: 'Hub Vendas - Plano Essencial',
    profissional: 'Hub Vendas - Plano Profissional',
    enterprise: 'Hub Vendas - Plano Enterprise',
  }

  if (plan === 'gratis') {
    if (tenantId) {
      try {
        const tenantRec = $app.findCollectionByNameOrId('tenants')
        const t = $app.findFirstRecordByData('tenants', 'id', tenantId)
        t.set('plan', 'gratis')
        t.set('subscription_status', 'free')
        $app.save(t)
      } catch (_) {}
    }
    return e.json(200, {
      status: 'free',
      message: 'Plano Grátis ativado com sucesso.',
      plan: 'gratis',
    })
  }

  const transactionAmount =
    billingCycle === 'annual' ? (pricesAnnual[plan] || 97) * 12 : pricesMonthly[plan] || 97

  const accessToken = $os.getenv('MERCADOPAGO_ACCESS_TOKEN') || ''
  const isRealMp = !!accessToken && !!cardToken && !cardToken.startsWith('tok_demo_')

  const now = new Date()
  const trialEndDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
  const nextBillingIso = trialEndDate.toISOString().replace('T', ' ').slice(0, 19)

  let preapprovalId = 'preapp_sim_' + $security.randomString(16)
  let mpStatus = 'authorized'

  if (isRealMp) {
    try {
      const mpPayload = {
        payer_email: email,
        back_url: ($os.getenv('SITE_URL') || 'https://hubvendas.com.br') + '/settings',
        reason:
          (planTitles[plan] || 'Hub Vendas') +
          (billingCycle === 'annual' ? ' (Anual)' : ' (Mensal)'),
        auto_recurring: {
          frequency: billingCycle === 'annual' ? 12 : 1,
          frequency_type: 'months',
          transaction_amount: transactionAmount,
          currency_id: 'BRL',
          start_date: trialEndDate.toISOString(),
          free_trial: {
            frequency: 5,
            frequency_type: 'days',
          },
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
        preapprovalId = res.json.id
        mpStatus = res.json.status || 'authorized'
      } else {
        return e.json(400, {
          message:
            (res.json && (res.json.message || res.json.error)) ||
            'Não foi possível autorizar o cartão no Mercado Pago. Verifique os dados.',
          mpError: res.json,
        })
      }
    } catch (err) {
      return e.json(500, {
        message:
          'Erro de comunicação com o Mercado Pago: ' + (err ? err.toString() : 'Erro interno'),
      })
    }
  }

  // Update tenant record if tenantId is present
  if (tenantId) {
    try {
      const t = $app.findFirstRecordByData('tenants', 'id', tenantId)
      t.set('plan', plan)
      t.set('billing_cycle', billingCycle)
      t.set('subscription_status', 'trial')
      t.set('trial_ends_at', nextBillingIso)
      t.set('next_billing_date', nextBillingIso)
      t.set('mp_preapproval_id', preapprovalId)
      t.set('card_last4', cardLast4)
      t.set('card_brand', cardBrand)
      t.set('card_holder_name', cardHolderName)
      $app.save(t)

      // Create initial subscription trial invoice entry
      try {
        const subPaymentsCol = $app.findCollectionByNameOrId('subscription_payments')
        const pRecord = new Record(subPaymentsCol)
        pRecord.set('tenant', tenantId)
        pRecord.set('mp_preapproval_id', preapprovalId)
        pRecord.set('amount', 0)
        pRecord.set('plan', plan)
        pRecord.set('billing_cycle', billingCycle)
        pRecord.set('status', 'trial')
        pRecord.set('description', 'Início do período de teste gratuito (5 dias) - Cartão validado')
        pRecord.set('payment_date', now.toISOString().replace('T', ' ').slice(0, 19))
        pRecord.set('card_last4', cardLast4)
        pRecord.set('card_brand', cardBrand)
        $app.save(pRecord)
      } catch (_) {}
    } catch (_) {}
  }

  return e.json(200, {
    success: true,
    status: 'trial',
    preapprovalId: preapprovalId,
    trialEndsAt: nextBillingIso,
    nextBillingDate: nextBillingIso,
    mode: isRealMp ? 'production' : 'simulated',
    message: isRealMp
      ? 'Assinatura criada com sucesso! 5 dias grátis concedidos.'
      : 'Modo demonstração Mercado Pago: Assinatura e cartão validados com 5 dias grátis.',
  })
})
