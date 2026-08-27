routerAdd(
  'GET',
  '/backend/v1/nfe/{id}/status',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { message: 'Não autorizado' })
    }

    const invoiceId = e.request.pathValue('id')
    if (!invoiceId) {
      return e.json(400, { message: 'ID da fatura é obrigatório.' })
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

    return e.json(200, {
      invoice_id: invoice.id,
      number: invoice.getString('number'),
      series: invoice.getString('series'),
      key: invoice.getString('key'),
      status: invoice.getString('status'),
      environment: invoice.getString('environment'),
      protocol: invoice.getString('protocol'),
      amount: invoice.get('amount'),
      issued_at: invoice.getString('issued_at'),
      error_message: invoice.getString('error_message'),
    })
  },
  $apis.requireAuth(),
)
