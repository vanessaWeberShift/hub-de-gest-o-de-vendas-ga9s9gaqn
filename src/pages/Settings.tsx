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
  const [ie, setIe] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [isSavingEmpresa, setIsSavingEmpresa] = useState(false)

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
    setCnpj(tenant.cnpj || '')
    setIe(tenant.ie || '')
    setEmail(tenant.email || '')
    setPhone(tenant.phone || '')
    setAddress(tenant.address || '')

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

  // Save Empresa
  const handleSaveEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id) return

    setIsSavingEmpresa(true)
    try {
      await settingsService.updateTenant(tenant.id, {
        name: companyName,
        cnpj,
        ie,
        email,
        phone,
        address,
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

          <form onSubmit={handleSaveEmpresa} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Razão Social / Nome Fantasia *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: WShift Comércio Eletrônico Ltda"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Inscrição Estadual (IE)
                </label>
                <input
                  type="text"
                  value={ie}
                  onChange={(e) => setIe(e.target.value)}
                  placeholder="123456789012"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
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
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
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
