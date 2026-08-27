cronAdd('marketplace_sync', '*/10 * * * *', () => {
  const now = new Date()
  try {
    const activeConns = $app.findRecordsByFilter(
      'marketplace_connections',
      "status = 'connected'",
      '-created',
      100,
      0,
    )
    for (let i = 0; i < activeConns.length; i++) {
      const conn = activeConns[i]
      conn.set('last_sync', now.toISOString())
      $app.save(conn)
    }
  } catch (_) {}
})
