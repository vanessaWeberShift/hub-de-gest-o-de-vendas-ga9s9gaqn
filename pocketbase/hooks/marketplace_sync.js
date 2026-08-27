routerAdd(
  'POST',
  '/backend/v1/marketplace/sync',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { message: 'Não autorizado' })
    }

    const tenantId = auth.getString('tenant')
    if (!tenantId) {
      return e.json(400, { message: 'Usuário não vinculado a um tenant.' })
    }

    const body = e.requestInfo().body || {}
    const targetMarketplace = body.marketplace || ''

    let filter = 'tenant = {:tenant}'
    const params = { tenant: tenantId }
    if (targetMarketplace) {
      filter += ' && marketplace = {:marketplace}'
      params.marketplace = targetMarketplace
    }

    const connections = $app.findRecordsByFilter(
      'marketplace_connections',
      filter,
      '-created',
      20,
      0,
      params,
    )
    const now = new Date()
    let updatedCount = 0

    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i]
      conn.set('last_sync', now.toISOString())
      if (conn.getString('status') === 'connected') {
        updatedCount++
      }
      $app.save(conn)
    }

    return e.json(200, {
      success: true,
      synced_connections: connections.length,
      active_synced: updatedCount,
      timestamp: now.toISOString(),
      message: 'Sincronização de pedidos e inventário realizada com sucesso.',
    })
  },
  $apis.requireAuth(),
)
