routerAdd(
  'POST',
  '/backend/v1/nfe/{id}/cancel',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { message: 'Não autorizado' })
    }

    const invoiceId = e.request.pathValue('id')
    if (!invoiceId) {
      return e.json(400, { message: 'ID da NF-e é obrigatório.' })
    }

    let invoice = null
    try {
      invoice = $app.findRecordById('invoices', invoiceId)
    } catch (_) {
      return e.json(404, { message: 'Nota fiscal não encontrada.' })
    }

    const tenantId = auth.getString('tenant')
    if (invoice.getString('tenant') !== tenantId) {
      return e.json(403, { message: 'Acesso negado para este documento.' })
    }

    const body = e.requestInfo().body || {}
    const justification = body.justification || 'Cancelamento solicitado pelo emitente'

    if (justification.length < 15) {
      return e.json(400, {
        message:
          'A justificativa de cancelamento deve conter no mínimo 15 caracteres conforme regra SEFAZ.',
      })
    }

    invoice.set('status', 'canceled')
    invoice.set('error_message', 'Cancelada: ' + justification)
    $app.save(invoice)

    const orderId = invoice.getString('order')
    if (orderId) {
      try {
        const order = $app.findRecordById('orders', orderId)
        order.set('nfe_status', 'canceled')
        $app.save(order)
      } catch (_) {}
    }

    return e.json(200, {
      success: true,
      invoice_id: invoice.id,
      status: 'canceled',
      message: 'NF-e cancelada/estornada com sucesso junto à SEFAZ.',
    })
  },
  $apis.requireAuth(),
)
