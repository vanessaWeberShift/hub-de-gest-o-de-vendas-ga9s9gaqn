routerAdd('POST', '/backend/v1/leads', (e) => {
  const body = e.requestInfo().body || {}
  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const phone = (body.phone || '').trim()
  const company = (body.company || '').trim()
  const cnpj = (body.cnpj || '').trim()
  const volume = (body.volume || '').trim()
  const message = (body.message || '').trim()

  if (!name) {
    return e.json(400, { message: 'O campo Nome Completo é obrigatório.' })
  }
  if (!email || !email.includes('@')) {
    return e.json(400, { message: 'O campo E-mail é inválido ou obrigatório.' })
  }
  if (!phone) {
    return e.json(400, { message: 'O campo Telefone/WhatsApp é obrigatório.' })
  }

  // Validate volume if provided
  const validVolumes = ['ate_50', '50_200', '200_500', '500_mais']
  let safeVolume = ''
  if (volume && validVolumes.indexOf(volume) !== -1) {
    safeVolume = volume
  }

  // 1. Create Lead in database
  let leadRecord = null
  try {
    const leadsCol = $app.findCollectionByNameOrId('leads')
    leadRecord = new Record(leadsCol)
    leadRecord.set('name', name)
    leadRecord.set('email', email)
    leadRecord.set('phone', phone)
    if (company) leadRecord.set('company', company)
    if (cnpj) leadRecord.set('cnpj', cnpj)
    if (safeVolume) leadRecord.set('volume', safeVolume)
    if (message) leadRecord.set('message', message)
    leadRecord.set('status', 'novo')

    $app.save(leadRecord)
  } catch (err) {
    return e.json(500, {
      message: 'Erro ao salvar o contato no sistema. Tente novamente.',
      error: err ? err.toString() : 'Unknown error',
    })
  }

  // 2. Notification email to admin
  const adminEmail =
    $os.getenv('ADMIN_NOTIFICATION_EMAIL') || $os.getenv('ADMIN_EMAIL') || 'vanessa@wshift.com.br'

  try {
    const mailClient = $app.newMailClient()
    const htmlBody =
      '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">' +
      '<h2 style="color: #059669; margin-top: 0;">Novo Lead Recebido - Hub Vendas</h2>' +
      '<p>Um novo contato comercial acabou de se cadastrar na landing page:</p>' +
      '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">' +
      '<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 140px;">Nome:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' +
      name +
      '</td></tr>' +
      '<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">E-mail:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:' +
      email +
      '">' +
      email +
      '</a></td></tr>' +
      '<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Telefone/WhatsApp:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' +
      phone +
      '</td></tr>' +
      '<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Empresa:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' +
      (company || 'Não informada') +
      '</td></tr>' +
      '<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">CNPJ:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' +
      (cnpj || 'Não informado') +
      '</td></tr>' +
      '<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Volume Mensal:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' +
      (safeVolume ? safeVolume.replace('_', ' ').replace('mais', '+') : 'Não selecionado') +
      '</td></tr>' +
      '<tr><td style="padding: 8px; font-weight: bold;">Mensagem:</td><td style="padding: 8px;">' +
      (message || 'Nenhuma mensagem adicional') +
      '</td></tr>' +
      '</table>' +
      '<p style="margin-top: 20px; font-size: 12px; color: #64748b;">Lead cadastrado automaticamente via Hub de Gestão de Vendas.</p>' +
      '</div>'

    mailClient.send({
      from: {
        address: $app.settings().meta.senderAddress || 'no-reply@goskip.dev',
        name: 'Hub Vendas',
      },
      to: [{ address: adminEmail, name: 'Admin Hub Vendas' }],
      subject: 'Novo lead: ' + name,
      html: htmlBody,
    })
  } catch (mailErr) {
    // We do not fail the lead creation if email sending fails (e.g. mock or local environment)
    console.log('Lead notification email warning: ' + (mailErr ? mailErr.toString() : 'failed'))
  }

  return e.json(201, {
    success: true,
    message: 'Recebemos seu contato! Entraremos em contato em até 24 horas.',
    lead_id: leadRecord.id,
  })
})
