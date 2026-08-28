routerAdd(
  'POST',
  '/backend/v1/mercadopago/cancel',
  (e) => {
    const body = e.requestInfo().body || {}
    const tenantId = (body.tenantId || '').trim()

    if (!tenantId) {
      return e.json(400, { message: 'tenantId é obrigatório.' })
    }

    let tenantRecord = null
    try {
      tenantRecord = $app.findFirstRecordByData('tenants', 'id', tenantId)
    } catch (_) {
      return e.json(404, { message: 'Empresa não encontrada.' })
    }

    const preapprovalId = tenantRecord.getString('mp_preapproval_id')
    const accessToken = $os.getenv('MERCADOPAGO_ACCESS_TOKEN') || ''

    if (preapprovalId && accessToken && !preapprovalId.startsWith('preapp_sim_')) {
      try {
        $http.send({
          url: 'https://api.mercadopago.com/preapproval/' + preapprovalId,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + accessToken,
          },
          body: JSON.stringify({ status: 'cancelled' }),
          timeout: 15,
        })
      } catch (err) {
        // continue local cancel even if external call fails
      }
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    tenantRecord.set('subscription_status', 'canceled')
    tenantRecord.set('canceled_at', now)
    $app.save(tenantRecord)

    return e.json(200, {
      success: true,
      message:
        'Assinatura cancelada com sucesso. Você ainda pode usar o sistema até o final do ciclo atual ou regularizar quando desejar.',
    })
  },
  $apis.requireAuth(),
)
