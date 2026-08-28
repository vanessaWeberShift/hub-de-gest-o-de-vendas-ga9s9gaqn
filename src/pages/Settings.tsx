import React, { useState, useEffect } from 'react'
import {
  Building2,
  FileText,
  Users,
  Store,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Save,
  UserPlus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Calendar,
  AlertCircle,
  Zap,
  Clock,
  ArrowUpRight,
  Receipt,
  XCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { settingsService, invoicesService, billingService } from '@/services/api'
import {
  NfeSettingsRecord,
  NfeProvider,
  NfeEnvironment,
  SubscriptionPaymentRecord,
  PlanType,
} from '@/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  validateCNPJ,
  validateInscricaoEstadual,
  validateEmail,
  validatePhone,
  formatCnpjMask,
  formatPhoneMask,
  deriveUfFromCnpj,
  lookupCnpjData,
  BRAZILIAN_UFS,
  BrazilianUF,
} from '@/lib/validators'

export const Settings: React.FC = () => {
  const { tenant, refreshAuth } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<
    'faturamento' | 'empresa' | 'nfe' | 'equipe' | 'integracoes'
  >('faturamento')
  const [loading, setLoading] = useState(true)

  // Tab Empresa state
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [uf, setUf] = useState<BrazilianUF | ''>('SP')
  const [isUfAutoDetected, setIsUfAutoDetected] = useState(false)
  const [ie, setIe] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [isSavingEmpresa, setIsSavingEmpresa] = useState(false)

  // Validation errors & touched map for Empresa
  const [errorsEmpresa, setErrorsEmpresa] = useState<{
    companyName?: string
    cnpj?: string
    ie?: string
    email?: string
    phone?: string
  }>({})

  const [touchedEmpresa, setTouchedEmpresa] = useState<{
    companyName?: boolean
    cnpj?: boolean
    ie?: boolean
    email?: boolean
    phone?: boolean
  }>({})

  // Tab NF-e Fiscal state
  const [nfeProvider, setNfeProvider] = useState<NfeProvider>('nuvem_fiscal')
  const [nfeEnvironment, setNfeEnvironment] = useState<NfeEnvironment>('homologacao')
  const [nfeSeries, setNfeSeries] = useState('1')
  const [nfeCsc, setNfeCsc] = useState('')
  const [nfeCscId, setNfeCscId] = useState('')
  const [nfeWebhookUrl, setNfeWebhookUrl] = useState('')
  const [isSavingNfe, setIsSavingNfe] = useState(false)
  const [isTestingProvider, setIsTestingProvider] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  // Tab Equipe state
  const [members, setMembers] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [isInviting, setIsInviting] = useState(false)

  // Tab Faturamento & Assinatura (Mercado Pago)
  const [paymentsList, setPaymentsList] = useState<SubscriptionPaymentRecord[]>([])
  const [isChangingPlan, setIsChangingPlan] = useState(false)
  const [selectedChangePlan, setSelectedChangePlan] = useState<PlanType>('profissional')
  const [changeBillingCycle, setChangeBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [mpConfig, setMpConfig] = useState<{
    publicKey: string
    isConfigured: boolean
    mode: 'production' | 'simulated'
  }>({
    publicKey: '',
    isConfigured: false,
    mode: 'simulated',
  })

  // New card inputs for change plan if updating card
  const [changeCardNumber, setChangeCardNumber] = useState('')
  const [changeCardHolder, setChangeCardHolder] = useState('')
  const [changeCardExpiry, setChangeCardExpiry] = useState('')
  const [changeCardCvv, setChangeCardCvv] = useState('')

  useEffect(() => {
    if (!tenant?.id) return

    setCompanyName(tenant.name || '')
    const formattedCnpj = tenant.cnpj ? formatCnpjMask(tenant.cnpj) : ''
    setCnpj(formattedCnpj)
    setIe(tenant.ie || '')
    setEmail(tenant.email || '')
    setPhone(tenant.phone ? formatPhoneMask(tenant.phone) : '')
    setAddress(tenant.address || '')
    if (tenant.plan) setSelectedChangePlan(tenant.plan)
    if (tenant.billing_cycle) setChangeBillingCycle(tenant.billing_cycle)

    if (formattedCnpj) {
      const derived = deriveUfFromCnpj(formattedCnpj)
      if (derived) setUf(derived)
    }

    const loadSettingsData = async () => {
      try {
        const [nfeSett, membersList, payments, mpConf] = await Promise.all([
          settingsService.getNfeSettings(tenant.id),
          settingsService.listMembers(tenant.id),
          billingService.listPayments(tenant.id),
          billingService.getConfig().catch(() => ({
            publicKey: '',
            isConfigured: false,
            mode: 'simulated' as const,
          })),
        ])

        if (nfeSett) {
          setNfeProvider(nfeSett.provider || 'nuvem_fiscal')
          setNfeEnvironment(nfeSett.environment || 'homologacao')
          setNfeSeries(nfeSett.series || '1')
          setNfeCsc(nfeSett.csc || '')
          setNfeCscId(nfeSett.csc_id || '')
          setNfeWebhookUrl(nfeSett.webhook_url || '')
        }
        setMembers(membersList)
        setPaymentsList(payments as any)
        setMpConfig({
          publicKey: mpConf.publicKey,
          isConfigured: mpConf.isConfigured,
          mode: mpConf.mode as any,
        })
      } catch (err) {
        console.error('Erro ao carregar configurações', err)
      } finally {
        setLoading(false)
      }
    }

    loadSettingsData()
  }, [tenant?.id, tenant?.plan, tenant?.billing_cycle])

  // Validation field handler for Empresa
  const validateEmpresaField = (name: string, value: string, extra?: any) => {
    const newErrors = { ...errorsEmpresa }

    switch (name) {
      case 'companyName':
        if (!value.trim()) {
          newErrors.companyName = 'Razão Social ou Nome Fantasia é obrigatório.'
        } else if (value.trim().length < 3) {
          newErrors.companyName = 'Informe pelo menos 3 caracteres.'
        } else {
          delete newErrors.companyName
        }
        break

      case 'cnpj':
        if (!value.trim()) {
          newErrors.cnpj = 'CNPJ da empresa é obrigatório.'
        } else {
          const res = validateCNPJ(value)
          if (!res.isValid) {
            newErrors.cnpj = res.message || 'CNPJ inválido.'
          } else {
            delete newErrors.cnpj
          }
        }
        break

      case 'ie':
        if (value.trim()) {
          const res = validateInscricaoEstadual(value, extra?.uf || uf)
          if (!res.isValid) {
            newErrors.ie = res.message || 'Inscrição Estadual inválida.'
          } else {
            delete newErrors.ie
          }
        } else {
          delete newErrors.ie
        }
        break

      case 'email':
        if (value.trim()) {
          const res = validateEmail(value)
          if (!res.isValid) {
            newErrors.email = res.message || 'E-mail inválido.'
          } else {
            delete newErrors.email
          }
        } else {
          delete newErrors.email
        }
        break

      case 'phone':
        if (value.trim()) {
          const res = validatePhone(value, false)
          if (!res.isValid) {
            newErrors.phone = res.message || 'Telefone inválido.'
          } else {
            delete newErrors.phone
          }
        } else {
          delete newErrors.phone
        }
        break

      default:
        break
    }

    setErrorsEmpresa(newErrors)
    return newErrors
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpjMask(e.target.value)
    setCnpj(formatted)
    if (touchedEmpresa.cnpj) validateEmpresaField('cnpj', formatted)

    const clean = formatted.replace(/[./\-\s]/g, '')
    if (clean.length >= 8) {
      const derived = deriveUfFromCnpj(formatted)
      if (derived) {
        setUf(derived)
        setIsUfAutoDetected(true)
        if (ie && touchedEmpresa.ie) validateEmpresaField('ie', ie, { uf: derived })
      }

      if (clean.length === 14 && validateCNPJ(formatted).isValid) {
        lookupCnpjData(formatted).then((data) => {
          if (data?.uf) {
            setUf(data.uf)
            setIsUfAutoDetected(true)
            if (ie && touchedEmpresa.ie) validateEmpresaField('ie', ie, { uf: data.uf })
          }
          if (data?.razaoSocial && !companyName) {
            setCompanyName(data.razaoSocial)
          }
        })
      }
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneMask(e.target.value)
    setPhone(formatted)
    if (touchedEmpresa.phone) validateEmpresaField('phone', formatted)
  }

  const handleIeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setIe(val)
    if (touchedEmpresa.ie) validateEmpresaField('ie', val, { uf })
  }

  const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUf = e.target.value as BrazilianUF
    setUf(newUf)
    setIsUfAutoDetected(false)
    if (ie && touchedEmpresa.ie) validateEmpresaField('ie', ie, { uf: newUf })
  }

  const handleBlurEmpresa = (field: keyof typeof touchedEmpresa) => {
    setTouchedEmpresa((prev) => ({ ...prev, [field]: true }))
    switch (field) {
      case 'companyName':
        validateEmpresaField('companyName', companyName)
        break
      case 'cnpj':
        validateEmpresaField('cnpj', cnpj)
        break
      case 'ie':
        validateEmpresaField('ie', ie, { uf })
        break
      case 'email':
        validateEmpresaField('email', email)
        break
      case 'phone':
        validateEmpresaField('phone', phone)
        break
    }
  }

  // Save Empresa
  const handleSaveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id) return

    setTouchedEmpresa({
      companyName: true,
      cnpj: true,
      ie: true,
      email: true,
      phone: true,
    })

    const validationErrors: typeof errorsEmpresa = {}
    if (!companyName.trim())
      validationErrors.companyName = 'Razão Social ou Nome Fantasia é obrigatório.'
    if (!cnpj.trim()) {
      validationErrors.cnpj = 'CNPJ da empresa é obrigatório.'
    } else {
      const cnpjRes = validateCNPJ(cnpj)
      if (!cnpjRes.isValid) validationErrors.cnpj = cnpjRes.message || 'CNPJ inválido.'
    }
    if (ie.trim()) {
      const ieRes = validateInscricaoEstadual(ie, uf)
      if (!ieRes.isValid)
        validationErrors.ie = ieRes.message || 'Inscrição Estadual inválida para a UF.'
    }
    if (email.trim()) {
      const emailRes = validateEmail(email)
      if (!emailRes.isValid) validationErrors.email = emailRes.message || 'E-mail inválido.'
    }
    if (phone.trim()) {
      const phoneRes = validatePhone(phone, false)
      if (!phoneRes.isValid) validationErrors.phone = phoneRes.message || 'Telefone inválido.'
    }

    setErrorsEmpresa(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      toast({
        variant: 'destructive',
        title: 'Erros no formulário',
        description: 'Por favor, corrija os campos destacados antes de salvar.',
      })
      return
    }

    setIsSavingEmpresa(true)
    try {
      await settingsService.updateTenant(tenant.id, {
        name: companyName.trim(),
        cnpj: cnpj.trim(),
        ie: ie.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
      })

      toast({
        title: 'Dados da empresa atualizados!',
        description: 'As alterações foram salvas com sucesso.',
      })
      await refreshAuth()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar dados',
        description: err?.message,
      })
    } finally {
      setIsSavingEmpresa(false)
    }
  }

  // Save NF-e Settings
  const handleSaveNfe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id) return

    setIsSavingNfe(true)
    try {
      await settingsService.saveNfeSettings(tenant.id, {
        provider: nfeProvider,
        environment: nfeEnvironment,
        series: nfeSeries,
        csc: nfeCsc,
        csc_id: nfeCscId,
        webhook_url: nfeWebhookUrl,
      })

      toast({
        title: 'Configurações fiscais salvas!',
        description: 'Parâmetros de emissão de NF-e e SEFAZ atualizados.',
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar configurações fiscais',
        description: err?.message,
      })
    } finally {
      setIsSavingNfe(false)
    }
  }

  // Test Provider Connection
  const handleTestProvider = async () => {
    setIsTestingProvider(true)
    setTestResult(null)
    try {
      const res = await invoicesService.checkProvider()
      setTestResult(res)
      toast({
        title: 'Conexão testada com sucesso',
        description: res.message,
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Falha no teste de conexão',
        description: err?.message || 'Provedor indisponível.',
      })
    } finally {
      setIsTestingProvider(false)
    }
  }

  // Change Plan Action
  const handleChangePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id) return

    setIsChangingPlan(true)
    try {
      let cardLast4 = tenant.card_last4
      let cardBrand = tenant.card_brand
      let cardHolder = tenant.card_holder_name

      if (changeCardNumber.trim()) {
        const cleanDigits = changeCardNumber.replace(/\D/g, '')
        cardLast4 = cleanDigits.slice(-4)
        cardBrand = 'visa'
        cardHolder = changeCardHolder.trim() || tenant.name
      }

      const res = await billingService.changePlan({
        tenantId: tenant.id,
        newPlan: selectedChangePlan,
        billingCycle: changeBillingCycle,
        cardToken: changeCardNumber ? `tok_mp_${Date.now()}` : undefined,
        cardHolderName: cardHolder,
        cardLast4: cardLast4,
        cardBrand: cardBrand,
      })

      toast({
        title: 'Plano atualizado com sucesso!',
        description: res.message,
      })

      setShowPlanModal(false)
      await refreshAuth()
      const updatedPayments = await billingService.listPayments(tenant.id)
      setPaymentsList(updatedPayments as any)
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar plano',
        description: err?.message || 'Não foi possível alterar o plano no gateway.',
      })
    } finally {
      setIsChangingPlan(false)
    }
  }

  // Cancel Subscription Action
  const handleCancelSubscription = async () => {
    if (!tenant?.id) return
    setIsCanceling(true)
    try {
      const res = await billingService.cancelSubscription(tenant.id)
      toast({
        title: 'Assinatura cancelada',
        description: res.message,
      })
      setShowCancelModal(false)
      await refreshAuth()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar',
        description: err?.message,
      })
    } finally {
      setIsCanceling(false)
    }
  }

  // Invite Member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id || !inviteEmail) return

    setIsInviting(true)
    try {
      await settingsService.inviteMember(tenant.id, inviteEmail, inviteName, inviteRole)
      toast({
        title: 'Membro adicionado à equipe!',
        description: `O acesso para ${inviteEmail} foi criado com sucesso.`,
      })
      setInviteEmail('')
      setInviteName('')
      const updated = await settingsService.listMembers(tenant.id)
      setMembers(updated)
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao convidar membro',
        description: err?.message || 'E-mail já cadastrado.',
      })
    } finally {
      setIsInviting(false)
    }
  }

  // Remove Member
  const handleRemoveMember = async (userId: string) => {
    try {
      await settingsService.removeMember(userId)
      toast({ title: 'Membro desvinculado da empresa.' })
      if (tenant?.id) {
        const updated = await settingsService.listMembers(tenant.id)
        setMembers(updated)
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao desvincular membro',
        description: err?.message,
      })
    }
  }

  // Status Badge Helper
  const renderSubscriptionStatusBadge = () => {
    const status = tenant?.subscription_status || (tenant?.plan === 'gratis' ? 'free' : 'active')
    switch (status) {
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            <span>Período de Teste Grátis (5 Dias)</span>
          </span>
        )
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Assinatura Ativa (Em dia)</span>
          </span>
        )
      case 'free':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Sparkles className="h-3.5 w-3.5 text-slate-500" />
            <span>Plano Grátis</span>
          </span>
        )
      case 'past_due':
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span>Pagamento Pendente / Atrasado</span>
          </span>
        )
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-rose-700 border border-slate-300">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            <span>Assinatura Cancelada</span>
          </span>
        )
      default:
        return null
    }
  }

  const currentPlanName = {
    gratis: 'Plano Grátis',
    essencial: 'Plano Essencial (R$ 97/mês)',
    profissional: 'Plano Profissional (R$ 197/mês)',
    enterprise: 'Plano Enterprise (R$ 397/mês)',
  }[tenant?.plan || 'gratis']

  const planPrices: Record<string, { monthly: number; annual: number }> = {
    gratis: { monthly: 0, annual: 0 },
    essencial: { monthly: 97, annual: 77 },
    profissional: { monthly: 197, annual: 157 },
    enterprise: { monthly: 397, annual: 317 },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configurações Gerais</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gestão de faturamento, gateway Mercado Pago, dados cadastrais e SEFAZ
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('faturamento')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'faturamento'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Faturamento & Assinatura</span>
        </button>

        <button
          onClick={() => setActiveTab('empresa')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'empresa'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Dados da Empresa</span>
        </button>

        <button
          onClick={() => setActiveTab('nfe')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'nfe'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>NF-e & Fiscal</span>
        </button>

        <button
          onClick={() => setActiveTab('equipe')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'equipe'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Equipe & Acessos</span>
        </button>

        <button
          onClick={() => setActiveTab('integracoes')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'integracoes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Guia de Canais</span>
        </button>
      </div>

      {/* TAB 0: Faturamento & Assinatura (Mercado Pago) */}
      {activeTab === 'faturamento' && (
        <div className="space-y-6 max-w-4xl">
          {/* Main Plan Overview Card */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E7EAEF] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {currentPlanName}
                  </h2>
                  {renderSubscriptionStatusBadge()}
                </div>
                <p className="text-xs text-slate-500">
                  Cobrança recorrente automatizada via gateway <b>Mercado Pago</b>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  onClick={() => setShowPlanModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-4 shadow-sm"
                >
                  <ArrowUpRight className="h-4 w-4 mr-1.5" />
                  <span>Alterar Plano</span>
                </Button>

                {tenant?.subscription_status !== 'canceled' && tenant?.plan !== 'gratis' && (
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(true)}
                    className="border-slate-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold rounded-xl h-10 px-4"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {/* Status & Billing Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              {/* Box 1: Próxima Cobrança */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Próxima Cobrança / Renovação
                </span>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    {tenant?.next_billing_date
                      ? new Date(tenant.next_billing_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Sem cobrança agendada'}
                  </span>
                </div>
                {tenant?.subscription_status === 'trial' && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    🎉 Teste grátis ativo até{' '}
                    {tenant?.trial_ends_at
                      ? new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR')
                      : '5 dias'}
                  </p>
                )}
              </div>

              {/* Box 2: Cartão Cadastrado */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Cartão para Cobrança Automática
                </span>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CreditCard className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    {tenant?.card_last4
                      ? `•••• •••• •••• ${tenant.card_last4} (${(tenant.card_brand || 'visa').toUpperCase()})`
                      : 'Nenhum cartão cadastrado'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Titular: {tenant?.card_holder_name || tenant?.name || 'Administrador'}
                </p>
              </div>

              {/* Box 3: Ciclo & Desconto */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Ciclo de Faturamento
                </span>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    {tenant?.billing_cycle === 'annual'
                      ? 'Faturamento Anual (20% OFF)'
                      : 'Faturamento Mensal'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {mpConfig.isConfigured
                    ? 'Gateway Mercado Pago Conectado (Produção)'
                    : 'Modo Simulado Ativo (Demonstração)'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment / Invoice History */}
          <div className="bg-white rounded-2xl border border-[#E7EAEF] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Histórico de Faturas & Pagamentos
                </h3>
                <p className="text-xs text-slate-500">
                  Comprovantes e registros de cobrança gerados pela sua assinatura
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {paymentsList.length} registro(s)
              </span>
            </div>

            {paymentsList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {paymentsList.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                          p.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : p.status === 'trial'
                              ? 'bg-sky-50 text-sky-600 border border-sky-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {p.description ||
                            `Assinatura Plano ${(p.plan || 'Essencial').toUpperCase()}`}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>
                            {p.payment_date
                              ? new Date(p.payment_date).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Data recente'}
                          </span>
                          <span>•</span>
                          <span>Cartão final {p.card_last4 || tenant?.card_last4 || '4242'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">
                          {p.status === 'trial' ? 'R$ 0,00' : `R$ ${(p.amount || 0).toFixed(2)}`}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            p.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'trial'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status === 'approved'
                            ? 'Pago'
                            : p.status === 'trial'
                              ? '5d Grátis'
                              : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <CreditCard className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Nenhuma fatura registrada ainda</p>
                <p className="text-slate-400 mt-1">
                  Seu período de teste de 5 dias está ativo e a primeira cobrança ocorrerá após o
                  término.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Alterar Plano (Upgrade / Downgrade) */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-7 max-w-xl w-full border border-slate-100 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Alterar Plano de Assinatura</h3>
            <p className="text-xs text-slate-500 mb-5">
              Escolha o novo plano para atualizar os limites de emissão de NF-e e canais do Mercado
              Pago.
            </p>

            <form onSubmit={handleChangePlanSubmit} className="space-y-4">
              {/* Billing Cycle Toggle */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setChangeBillingCycle('monthly')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    changeBillingCycle === 'monthly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cobrança Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setChangeBillingCycle('annual')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    changeBillingCycle === 'annual'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Cobrança Anual</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded font-black text-emerald-100">
                    -20%
                  </span>
                </button>
              </div>

              {/* Plans Radio Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'essencial', name: 'Essencial', m: 97, a: 77, nfe: '100 NF-e/mês' },
                  { id: 'profissional', name: 'Profissional', m: 197, a: 157, nfe: '500 NF-e/mês' },
                  { id: 'enterprise', name: 'Enterprise', m: 397, a: 317, nfe: 'NF-e Ilimitadas' },
                ].map((item) => {
                  const price = changeBillingCycle === 'annual' ? item.a : item.m
                  const isSelected = selectedChangePlan === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedChangePlan(item.id as PlanType)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{item.name}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      </div>
                      <p className="text-lg font-black text-slate-900">
                        R$ {price}
                        <span className="text-[10px] font-normal text-slate-500">/mês</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">{item.nfe}</p>
                    </div>
                  )
                })}
              </div>

              {/* Card to use */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Forma de Pagamento:</span>
                  <span className="text-slate-500">
                    Cartão cadastrado (final {tenant?.card_last4 || '4242'})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  A cobrança do novo plano será processada automaticamente via Mercado Pago na data
                  de renovação.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPlanModal(false)}
                  className="text-xs border-slate-300"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={isChangingPlan}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  {isChangingPlan ? 'Atualizando...' : 'Confirmar Alteração de Plano'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cancelar Assinatura */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-100">
            <div className="flex items-center gap-2.5 text-rose-600 mb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900">Deseja cancelar a assinatura?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Ao cancelar, nenhuma cobrança futura será realizada no seu cartão no Mercado Pago. O
              acesso às funcionalidades continuará ativo até o final do período vigente.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="text-xs"
              >
                Manter Assinatura
              </Button>
              <Button
                type="button"
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {isCanceling ? 'Cancelando...' : 'Sim, Cancelar Assinatura'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Empresa */}
      {activeTab === 'empresa' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E7EAEF] shadow-sm max-w-3xl">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">
              Identificação da Empresa (Tenant)
            </h2>
            <p className="text-xs text-slate-500">
              Dados cadastrais que constarão no cabeçalho das notas fiscais e relatórios
            </p>
          </div>

          <form onSubmit={handleSaveEmpresa} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Razão Social / Nome Fantasia *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value)
                  if (touchedEmpresa.companyName)
                    validateEmpresaField('companyName', e.target.value)
                }}
                onBlur={() => handleBlurEmpresa('companyName')}
                placeholder="Ex: WShift Comércio Eletrônico Ltda"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                  touchedEmpresa.companyName && errorsEmpresa.companyName
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {touchedEmpresa.companyName && errorsEmpresa.companyName && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorsEmpresa.companyName}</span>
                </p>
              )}
            </div>

            {/* CNPJ */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  CNPJ da Empresa *
                </label>
                <span className="text-[11px] text-emerald-600 font-medium">
                  Numérico & Alfanumérico (Receita Federal)
                </span>
              </div>
              <input
                type="text"
                required
                value={cnpj}
                onChange={handleCnpjChange}
                onBlur={() => handleBlurEmpresa('cnpj')}
                placeholder="00.000.000/0001-00 ou 12.ABC.345/0001-90"
                maxLength={18}
                className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg font-mono text-slate-900 uppercase transition-colors focus:outline-none focus:ring-2 ${
                  touchedEmpresa.cnpj && errorsEmpresa.cnpj
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {touchedEmpresa.cnpj && errorsEmpresa.cnpj ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorsEmpresa.cnpj}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  Validação completa dos dígitos verificadores (DVs) oficiais.
                </p>
              )}
            </div>

            {/* UF da IE & Inscrição Estadual (IE) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    UF da IE
                  </label>
                  {isUfAutoDetected && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Auto
                    </span>
                  )}
                </div>
                <select
                  value={uf}
                  onChange={handleUfChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {BRAZILIAN_UFS.map((item) => (
                    <option key={item.uf} value={item.uf}>
                      {item.uf} - {item.name}
                    </option>
                  ))}
                </select>
                {isUfAutoDetected && (
                  <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    UF derivada do CNPJ
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Inscrição Estadual (IE)
                  </label>
                  <span className="text-[11px] text-slate-400">Opcional / ISENTO</span>
                </div>
                <input
                  type="text"
                  value={ie}
                  onChange={handleIeChange}
                  onBlur={() => handleBlurEmpresa('ie')}
                  placeholder="Ex: 123456789012 ou ISENTO"
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg font-mono text-slate-900 uppercase transition-colors focus:outline-none focus:ring-2 ${
                    touchedEmpresa.ie && errorsEmpresa.ie
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {touchedEmpresa.ie && errorsEmpresa.ie ? (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorsEmpresa.ie}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Validada conforme regras da SEFAZ para o estado de {uf || 'origem'}.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  E-mail Comercial
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (touchedEmpresa.email) validateEmpresaField('email', e.target.value)
                  }}
                  onBlur={() => handleBlurEmpresa('email')}
                  placeholder="contato@empresa.com.br"
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    touchedEmpresa.email && errorsEmpresa.email
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {touchedEmpresa.email && errorsEmpresa.email && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorsEmpresa.email}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => handleBlurEmpresa('phone')}
                  placeholder="(11) 98765-4321"
                  maxLength={15}
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    touchedEmpresa.phone && errorsEmpresa.phone
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {touchedEmpresa.phone && errorsEmpresa.phone && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorsEmpresa.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Endereço Completo (Fiscal)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Paulista, 1000, Bela Vista, São Paulo - SP, CEP 01310-100"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                type="submit"
                disabled={isSavingEmpresa}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingEmpresa ? 'Salvando...' : 'Salvar Alterações'}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: NF-e Fiscal */}
      {activeTab === 'nfe' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E7EAEF] shadow-sm max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Configuração do Provedor de NF-e Nacional
            </h2>
            <p className="text-xs text-slate-500">
              Parâmetros de comunicação com a SEFAZ através de gateway fiscal
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 leading-relaxed">
            ℹ️ <b>Chave da API do Provedor:</b> Para emissões oficiais em produção com SEFAZ
            autorizadora, a chave de acesso é configurada nos segredos do projeto (variável{' '}
            <code>NFE_PROVIDER_KEY</code>). O sistema funciona perfeitamente em modo de homologação
            assistida com protocolo simulado.
          </div>

          <form onSubmit={handleSaveNfe} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Provedor Autorizador *
                </label>
                <select
                  value={nfeProvider}
                  onChange={(e) => setNfeProvider(e.target.value as NfeProvider)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
                >
                  <option value="nuvem_fiscal">Nuvem Fiscal (Recomendado)</option>
                  <option value="focus_nfe">Focus NFe</option>
                  <option value="nota_facil">NotaFácil</option>
                  <option value="e_notas">e-Notas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Ambiente SEFAZ *
                </label>
                <select
                  value={nfeEnvironment}
                  onChange={(e) => setNfeEnvironment(e.target.value as NfeEnvironment)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                >
                  <option value="homologacao">Homologação (Ambiente de Testes SEFAZ)</option>
                  <option value="producao">Produção (Notas Oficiais com Valor Fiscal)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Série da NF-e *
                </label>
                <input
                  type="text"
                  required
                  value={nfeSeries}
                  onChange={(e) => setNfeSeries(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  CSC (Código Segurança)
                </label>
                <input
                  type="text"
                  value={nfeCsc}
                  onChange={(e) => setNfeCsc(e.target.value)}
                  placeholder="Opcional para NFC-e"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  CSC ID
                </label>
                <input
                  type="text"
                  value={nfeCscId}
                  onChange={(e) => setNfeCscId(e.target.value)}
                  placeholder="000001"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                URL de Webhook (Retorno de Eventos)
              </label>
              <input
                type="url"
                value={nfeWebhookUrl}
                onChange={(e) => setNfeWebhookUrl(e.target.value)}
                placeholder="https://sua-empresa.com.br/api/nfe-webhook"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestProvider}
                disabled={isTestingProvider}
                className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 text-sky-600 ${isTestingProvider ? 'animate-spin' : ''}`}
                />
                <span>
                  {isTestingProvider ? 'Testando Conexão...' : 'Testar Conexão com SEFAZ'}
                </span>
              </Button>

              <Button
                type="submit"
                disabled={isSavingNfe}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingNfe ? 'Salvando...' : 'Salvar Configurações Fiscais'}</span>
              </Button>
            </div>
          </form>

          {testResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Status da Conexão SEFAZ:
              </p>
              <p className="text-slate-600">
                SEFAZ:{' '}
                <span className="font-semibold text-emerald-700">{testResult.sefaz_status}</span>
              </p>
              <p className="text-slate-600">
                Provedor:{' '}
                <span className="font-semibold text-slate-800">
                  {testResult.provider} ({testResult.environment})
                </span>
              </p>
              <p className="text-slate-600">
                Certificado Digital:{' '}
                <span className="font-semibold text-slate-800">
                  {testResult.certificate_status}
                </span>
              </p>
              <p className="text-slate-500 text-[11px] mt-1">{testResult.message}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Equipe */}
      {activeTab === 'equipe' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white p-6 rounded-2xl border border-[#E7EAEF] shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Convidar Membro / Operador</h2>
            <p className="text-xs text-slate-500 mb-4">
              Adicione operadores e fiscais para gerenciar este tenant
            </p>

            <form onSubmit={handleInviteMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nome do operador"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="operador@empresa.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Papel / Função
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="member">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isInviting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{isInviting ? 'Convidando...' : 'Adicionar Membro'}</span>
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7EAEF] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
              Membros Ativos ({members.length})
            </div>

            <div className="divide-y divide-slate-100">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {m.name ? m.name.slice(0, 2).toUpperCase() : 'OP'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{m.name || 'Operador'}</p>
                      <p className="text-[11px] text-slate-400">{m.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {m.role === 'admin' ? 'Administrador' : 'Operador'}
                    </span>
                    {m.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remover acesso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Integrações */}
      {activeTab === 'integracoes' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E7EAEF] shadow-sm max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Instruções de Integração por Canal
            </h2>
            <p className="text-xs text-slate-500">
              Onde localizar as chaves de API e autorizações nos marketplaces
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-1">
                Mercado Livre (Mercado Pago / Envios)
              </h3>
              <p className="text-xs text-slate-600 mb-2">
                Acesse o <b>Mercado Livre Developers</b> (developers.mercadolibre.com.br), crie uma
                aplicação e autorize o escopo <code>read, write, offline_access</code> para gerar
                seu Access Token.
              </p>
              <a
                href="https://developers.mercadolibre.com.br"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>Acessar Portal de Desenvolvedores Mercado Livre</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-1">Shopee Open Platform</h3>
              <p className="text-xs text-slate-600 mb-2">
                Cadastre sua conta no <b>Shopee Open Platform</b> (open.shopee.com), gere a{' '}
                <code>Partner ID</code> e a <code>Partner Key</code> para sincronizar pedidos da sua
                loja oficial.
              </p>
              <a
                href="https://open.shopee.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>Acessar Shopee Open Platform</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-1">
                Amazon SP-API (Selling Partner)
              </h3>
              <p className="text-xs text-slate-600 mb-2">
                Na sua conta Amazon Seller Central, acesse <b>Apps & Services &gt; Develop Apps</b>{' '}
                para obter as credenciais LWA (Login with Amazon) e o Refresh Token.
              </p>
              <a
                href="https://developer-docs.amazon.com/sp-api"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>Documentação SP-API Amazon</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
