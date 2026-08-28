import React, { useState, useEffect } from 'react'
import {
  Building2,
  FileText,
  Users,
  Store,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Upload,
  Save,
  UserPlus,
  Trash2,
  ExternalLink,
  Lock,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { settingsService, invoicesService } from '@/services/api'
import { NfeSettingsRecord, NfeProvider, NfeEnvironment } from '@/types'
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

  const [activeTab, setActiveTab] = useState<'empresa' | 'nfe' | 'equipe' | 'integracoes'>(
    'empresa',
  )
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

  useEffect(() => {
    if (!tenant?.id) return

    setCompanyName(tenant.name || '')
    const formattedCnpj = tenant.cnpj ? formatCnpjMask(tenant.cnpj) : ''
    setCnpj(formattedCnpj)
    setIe(tenant.ie || '')
    setEmail(tenant.email || '')
    setPhone(tenant.phone ? formatPhoneMask(tenant.phone) : '')
    setAddress(tenant.address || '')

    // Tentar detectar UF inicial a partir do CNPJ ou endereço
    if (formattedCnpj) {
      const derived = deriveUfFromCnpj(formattedCnpj)
      if (derived) {
        setUf(derived)
      }
    }
    if (tenant.address) {
      // Checar se há indicação de UF como "- SP" ou "SP"
      const match = tenant.address.match(/(?:-\s*|\s+)([A-Z]{2})(?:,|$)/)
      if (match && BRAZILIAN_UFS.some((u) => u.uf === match[1])) {
        setUf(match[1] as BrazilianUF)
      }
    }

    const loadSettingsData = async () => {
      try {
        const [nfeSett, membersList] = await Promise.all([
          settingsService.getNfeSettings(tenant.id),
          settingsService.listMembers(tenant.id),
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
      } catch (err) {
        console.error('Erro ao carregar configurações', err)
      } finally {
        setLoading(false)
      }
    }

    loadSettingsData()
  }, [tenant?.id])

  // Validation field handler for Empresa
  const validateEmpresaField = (name: string, value: string, extra?: any) => {
    let newErrors = { ...errorsEmpresa }

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
    if (touchedEmpresa.cnpj) {
      validateEmpresaField('cnpj', formatted)
    }

    // Auto-detect UF from CNPJ
    const clean = formatted.replace(/[./\-\s]/g, '')
    if (clean.length >= 8) {
      const derived = deriveUfFromCnpj(formatted)
      if (derived) {
        setUf(derived)
        setIsUfAutoDetected(true)
        if (ie && touchedEmpresa.ie) {
          validateEmpresaField('ie', ie, { uf: derived })
        }
      }

      if (clean.length === 14 && validateCNPJ(formatted).isValid) {
        lookupCnpjData(formatted).then((data) => {
          if (data?.uf) {
            setUf(data.uf)
            setIsUfAutoDetected(true)
            if (ie && touchedEmpresa.ie) {
              validateEmpresaField('ie', ie, { uf: data.uf })
            }
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
    if (touchedEmpresa.phone) {
      validateEmpresaField('phone', formatted)
    }
  }

  const handleIeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setIe(val)
    if (touchedEmpresa.ie) {
      validateEmpresaField('ie', val, { uf })
    }
  }

  const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUf = e.target.value as BrazilianUF
    setUf(newUf)
    setIsUfAutoDetected(false)
    if (ie && touchedEmpresa.ie) {
      validateEmpresaField('ie', ie, { uf: newUf })
    }
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

  // Save Empresa with complete validation
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

    if (!companyName.trim()) {
      validationErrors.companyName = 'Razão Social ou Nome Fantasia é obrigatório.'
    } else if (companyName.trim().length < 3) {
      validationErrors.companyName = 'Informe pelo menos 3 caracteres.'
    }

    if (!cnpj.trim()) {
      validationErrors.cnpj = 'CNPJ da empresa é obrigatório.'
    } else {
      const cnpjRes = validateCNPJ(cnpj)
      if (!cnpjRes.isValid) {
        validationErrors.cnpj = cnpjRes.message || 'CNPJ inválido.'
      }
    }

    if (ie.trim()) {
      const ieRes = validateInscricaoEstadual(ie, uf)
      if (!ieRes.isValid) {
        validationErrors.ie = ieRes.message || 'Inscrição Estadual inválida para a UF selecionada.'
      }
    }

    if (email.trim()) {
      const emailRes = validateEmail(email)
      if (!emailRes.isValid) {
        validationErrors.email = emailRes.message || 'E-mail inválido.'
      }
    }

    if (phone.trim()) {
      const phoneRes = validatePhone(phone, false)
      if (!phoneRes.isValid) {
        validationErrors.phone = phoneRes.message || 'Telefone inválido.'
      }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configurações Gerais</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gestão do tenant, provedor fiscal SEFAZ, equipe de operadores e integrações
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('empresa')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
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
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
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
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
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
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'integracoes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Guia de Integrações</span>
        </button>
      </div>

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
          {/* Invite form */}
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

          {/* Members Table */}
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
