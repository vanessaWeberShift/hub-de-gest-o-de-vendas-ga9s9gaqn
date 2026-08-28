routerAdd('POST', '/backend/v1/mercadopago/webhook', (e) => {
  const query = e.requestInfo().query || {}
  const body = e.requestInfo().body || {}
  const topic = query.topic || query.type || body.type || body.action || ''
  const resourceId =
    query.id ||
    (query['data.id'] ? query['data.id'] : body.data && body.data.id ? body.data.id : '')

  const accessToken = $os.getenv('MERCADOPAGO_ACCESS_TOKEN') || ''

  // If topic relates to preapproval / subscription
  if (
    topic === 'preapproval' ||
    topic === 'subscription_preapproval' ||
    topic === 'preapproval_plan'
  ) {
    if (resourceId && accessToken) {
      try {
        const res = $http.send({
          url: 'https://api.mercadopago.com/preapproval/' + resourceId,
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
          timeout: 10,
        })

        if (res.statusCode === 200 && res.json) {
          const mpData = res.json
          const preapprovalId = mpData.id
          const mpStatus = mpData.status // authorized, paused, cancelled, pending

          try {
            const tenantRecs = $app.findRecordsByFilter(
              'tenants',
              'mp_preapproval_id = "' + preapprovalId + '"',
              '',
              1,
              0,
            )
            if (tenantRecs.length > 0) {
              const t = tenantRecs[0]
              if (mpStatus === 'authorized') {
                t.set('subscription_status', 'active')
              } else if (mpStatus === 'cancelled') {
                t.set('subscription_status', 'canceled')
                t.set('canceled_at', new Date().toISOString().replace('T', ' ').slice(0, 19))
              } else if (mpStatus === 'paused') {
                t.set('subscription_status', 'past_due')
              }
              if (mpData.next_payment_date) {
                t.set('next_billing_date', mpData.next_payment_date.replace('T', ' ').slice(0, 19))
              }
              $app.save(t)
            }
          } catch (_) {}
        }
      } catch (_) {}
    }
  }

  // If topic relates to payment
  if (topic === 'payment' && resourceId && accessToken) {
    try {
      const res = $http.send({
        url: 'https://api.mercadopago.com/v1/payments/' + resourceId,
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
        timeout: 10,
      })

      if (res.statusCode === 200 && res.json) {
        const payment = res.json
        const status = payment.status // approved, pending, rejected, refunded
        const preapprovalId =
          payment.metadata && payment.metadata.preapproval_id ? payment.metadata.preapproval_id : ''

        if (preapprovalId) {
          try {
            const tenantRecs = $app.findRecordsByFilter(
              'tenants',
              'mp_preapproval_id = "' + preapprovalId + '"',
              '',
              1,
              0,
            )
            if (tenantRecs.length > 0) {
              const t = tenantRecs[0]
              if (status === 'approved') {
                t.set('subscription_status', 'active')
              } else if (status === 'rejected') {
                t.set('subscription_status', 'past_due')
              }
              $app.save(t)

              // Record payment in history
              const subPaymentsCol = $app.findCollectionByNameOrId('subscription_payments')
              const pRecord = new Record(subPaymentsCol)
              pRecord.set('tenant', t.id)
              pRecord.set('mp_payment_id', String(payment.id))
              pRecord.set('mp_preapproval_id', preapprovalId)
              pRecord.set('amount', payment.transaction_amount || 0)
              pRecord.set('plan', t.getString('plan') || 'essencial')
              pRecord.set('billing_cycle', t.getString('billing_cycle') || 'monthly')
              pRecord.set(
                'status',
                status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending',
              )
              pRecord.set(
                'description',
                payment.description || 'Cobrança de mensalidade Mercado Pago',
              )
              pRecord.set(
                'payment_date',
                (payment.date_approved || new Date().toISOString()).replace('T', ' ').slice(0, 19),
              )
              pRecord.set(
                'card_last4',
                payment.card ? payment.card.last_four_digits : t.getString('card_last4'),
              )
              pRecord.set('card_brand', payment.payment_method_id || t.getString('card_brand'))
              $app.save(pRecord)
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  return e.json(200, { received: true })
})
