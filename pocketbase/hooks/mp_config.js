routerAdd('GET', '/backend/v1/mercadopago/config', (e) => {
  const publicKey = $os.getenv('MERCADOPAGO_PUBLIC_KEY') || ''
  const hasAccessToken = !!($os.getenv('MERCADOPAGO_ACCESS_TOKEN') || '')

  return e.json(200, {
    publicKey: publicKey,
    isConfigured: !!(publicKey && hasAccessToken),
    mode: publicKey && hasAccessToken ? 'production' : 'simulated',
    trialDays: 5,
    plans: [
      {
        id: 'gratis',
        name: 'Plano Grátis',
        monthlyPrice: 0,
        annualPriceMonthly: 0,
        trialDays: 5,
        requiresCard: false,
      },
      {
        id: 'essencial',
        name: 'Plano Essencial',
        monthlyPrice: 97,
        annualPriceMonthly: 77,
        annualTotal: 924,
        trialDays: 5,
        requiresCard: true,
      },
      {
        id: 'profissional',
        name: 'Plano Profissional',
        monthlyPrice: 197,
        annualPriceMonthly: 157,
        annualTotal: 1884,
        trialDays: 5,
        requiresCard: true,
      },
      {
        id: 'enterprise',
        name: 'Plano Enterprise',
        monthlyPrice: 397,
        annualPriceMonthly: 317,
        annualTotal: 3804,
        trialDays: 5,
        requiresCard: true,
      },
    ],
  })
})
