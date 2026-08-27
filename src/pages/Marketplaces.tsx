import React, { useState, useEffect } from 'react'
import {
  Store,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  KeyRound,
  AlertTriangle,
  ShieldCheck,
  Settings2,
  X,
  Lock,
  ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { marketplaceService, ordersService } from '@/services/api'
import { formatDate, MARKETPLACE_LABELS } from '@/lib/formatters'
import { MarketplaceConnectionRecord, MarketplaceType } from '@/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

interface MarketplaceInfo {
  id: MarketplaceType
  name: string
  desc: string
  logoColor: string
  docsUrl: string
}

const AVAILABLE_MARKETPLACES: MarketplaceInfo[] = [
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    desc: 'Sincronização de vendas Full, Flex e envios padrão via Mercado Pago/Mercado Envios.',
    logoColor: 'bg-yellow-400 text-slate-900',
    docsUrl: 'https://developers.mercadolibre.com.br',
  },
  {
    id: 'shopee',
    name: 'Shopee',
    desc: 'Integração de pedidos e etiquetas Shopee Xpress através da Shopee Open Platform.',
    logoColor: 'bg-orange-500 text-white',
    docsUrl: 'https://open.shopee.com',
  },
  {
    id: 'amazon',
    name: 'Amazon Brasil',
    desc: 'Conexão via Selling Partner API (SP-API) para pedidos FBM e FBA Onsite.',
    logoColor: 'bg-amber-600 text-white',
    docsUrl: 'https://developer-docs.amazon.com',
  },
  {
    id: 'magalu',
    name: 'Magalu Marketplace',
    desc: 'Integração direta com o portal Magalu Marketplace e logística LuizaLog.',
    logoColor: 'bg-blue-600 text-white',
    docsUrl: 'https://developers.magazineluiza.com.br',
  },
  {
    id: 'netshoes',
    name: 'Netshoes',
    desc: 'Vendas esportivas e moda integradas com o ecossistema Magazine Luiza.',
    logoColor: 'bg-purple-700 text-white',
    docsUrl: 'https://developers.netshoes.com.br',
  },
  {
    id: 'shein',
    name: 'Shein Marketplace',
    desc: 'Gestão de catálogo e pedidos de moda rápida nacional no marketplace Shein.',
    logoColor: 'bg-slate-900 text-white',
    docsUrl: 'https://open.shein.com',
  },
]

export const Marketplaces: React.FC = () => {
  const { tenant } = useAuth()
  const { toast } = useToast()

  const [connections, setConnections] = useState<MarketplaceConnectionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingAll, setSyncingAll] = useState(false)
  const [syncingSingle, setSyncingSingle] = useState<string | null>(null)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMp, setSelectedMp] = useState<MarketplaceInfo | null>(null)
  const [accountName, setAccountName] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [tokenExpiresAt, setTokenExpiresAt] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useRealtime('marketplace_connections', () => loadConnections())

  const loadConnections = async () => {
    if (!tenant?.id) return
    try {
      const list = await marketplaceService.list(tenant.id)
      setConnections(list)
    } catch (err) {
      console.error('Erro ao carregar conexões', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConnections()
  }, [tenant?.id])

  const handleOpenConnect = (mp: MarketplaceInfo) => {
    const existing = connections.find((c) => c.marketplace === mp.id)
    setSelectedMp(mp)
    setAccountName(existing?.account_name || `${tenant?.name || 'Loja'} - ${mp.name}`)
    setAccessToken(existing?.access_token || '')
    setRefreshToken(existing?.refresh_token || '')
    setTokenExpiresAt(existing?.token_expires_at ? existing.token_expires_at.split('T')[0] : '')
    setModalOpen(true)
  }

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id || !selectedMp) return

    setIsSaving(true)
    try {
      const existing = connections.find((c) => c.marketplace === selectedMp.id)
      await marketplaceService.saveConnection(tenant.id, {
        id: existing?.id,
        tenant: tenant.id,
        marketplace: selectedMp.id,
        account_name: accountName,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : undefined,
        status: accessToken ? 'connected' : 'disconnected',
        last_sync: new Date().toISOString(),
      })

      toast({
        title: 'Canal Conectado!',
        description: `A integração com ${selectedMp.name} foi configurada com sucesso.`,
      })

      setModalOpen(false)
      await loadConnections()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar conexão',
        description: err?.message || 'Verifique as credenciais de API informadas.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnect = async (mpId: MarketplaceType) => {
    const conn = connections.find((c) => c.marketplace === mpId)
    if (!conn) return

    try {
      await marketplaceService.disconnect(conn.id)
      toast({
        title: 'Canal Desconectado',
        description: `A sincronização com este portal foi pausada.`,
      })
      await loadConnections()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao desconectar',
        description: err?.message,
      })
    }
  }

  const handleSyncMarketplace = async (mpId: string) => {
    setSyncingSingle(mpId)
    try {
      const res = await marketplaceService.syncOrders(mpId)
      toast({
        title: 'Sincronização concluída',
        description: res.message || 'Pedidos e catálogo atualizados.',
      })
      await loadConnections()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Falha na sincronização',
        description: err?.message,
      })
    } finally {
      setSyncingSingle(null)
    }
  }

  const handleSyncAll = async () => {
    setSyncingAll(true)
    try {
      const res = await marketplaceService.syncOrders()
      toast({
        title: 'Todos os canais sincronizados',
        description: res.message,
      })
      await loadConnections()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao sincronizar',
        description: err?.message,
      })
    } finally {
      setSyncingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Integração de Marketplaces
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Conecte suas contas nos maiores portais de vendas do Brasil para sincronização
            automática a cada 10 minutos
          </p>
        </div>

        <Button
          onClick={handleSyncAll}
          disabled={syncingAll}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${syncingAll ? 'animate-spin' : ''}`} />
          <span>{syncingAll ? 'Sincronizando Todos...' : 'Sincronizar Todos os Canais'}</span>
        </Button>
      </div>

      {/* Marketplaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {AVAILABLE_MARKETPLACES.map((mp) => {
          const conn = connections.find((c) => c.marketplace === mp.id)
          const isConnected = conn?.status === 'connected'
          const isSyncingThis = syncingSingle === mp.id

          return (
            <div
              key={mp.id}
              className="bg-white rounded-2xl border border-[#E7EAEF] shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold text-sm shadow-sm ${mp.logoColor}`}
                    >
                      {mp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{mp.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold uppercase mt-0.5 ${
                          isConnected
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        />
                        {isConnected ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mt-2">{mp.desc}</p>

                {conn?.account_name && (
                  <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                    <span className="text-slate-400">Conta:</span>{' '}
                    <b className="text-slate-800">{conn.account_name}</b>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  {conn?.last_sync
                    ? `Último sync: ${formatDate(conn.last_sync, true)}`
                    : 'Nunca sincronizado'}
                </div>

                <div className="flex items-center gap-1.5">
                  {isConnected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncMarketplace(mp.id)}
                        disabled={isSyncingThis}
                        title="Sincronizar pedidos agora"
                        className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 p-2"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 text-emerald-600 ${isSyncingThis ? 'animate-spin' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenConnect(mp)}
                        className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        Configurar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleOpenConnect(mp)}
                      className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Conectar</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Integration Guide Box */}
      <div className="bg-white rounded-2xl border border-[#E7EAEF] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Como funciona a integração e sincronização com Marketplaces?</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          O <b>Hub de Gestão de Vendas WShift</b> consulta as APIs oficiais de cada portal através
          de conexões OAuth seguras. Um job agendado no backend (cron a cada 10 minutos) importa
          automaticamente os novos pedidos pagos, atualiza o inventário dos produtos e prepara os
          pedidos para emissão de NF-e e envio.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <div>
            <p className="font-semibold text-slate-800">1. Credenciais de API</p>
            <p className="text-[11px] text-slate-500">
              Gere as chaves de aplicativo no portal de desenvolvedores do marketplace.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-800">2. Mapeamento de SKU</p>
            <p className="text-[11px] text-slate-500">
              Mantenha os SKUs cadastrados no catálogo iguais aos anúncios publicados.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-800">3. Faturamento Ágil</p>
            <p className="text-[11px] text-slate-500">
              Emita a NF-e em 1 clique e envie a chave de acesso direto para o marketplace.
            </p>
          </div>
        </div>
      </div>

      {/* Connection Modal */}
      {modalOpen && selectedMp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${selectedMp.logoColor}`}
                >
                  {selectedMp.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Conectar com {selectedMp.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Credenciais OAuth / API para importação de pedidos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nome da Conta / Identificação
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Ex: Minha Loja Oficial no Mercado Livre"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Access Token / API Key *
                  </label>
                  <a
                    href={selectedMp.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Onde obter token?</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="APP_USR-xxxxxxxxx ou Bearer Token"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Refresh Token (Opcional)
                  </label>
                  <input
                    type="text"
                    value={refreshToken}
                    onChange={(e) => setRefreshToken(e.target.value)}
                    placeholder="TG-xxxxxxxxx"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Validade do Token
                  </label>
                  <input
                    type="date"
                    value={tokenExpiresAt}
                    onChange={(e) => setTokenExpiresAt(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                🛡️ Suas credenciais são criptografadas e protegidas pelas regras de isolamento do
                tenant.
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {connections.some(
                  (c) => c.marketplace === selectedMp.id && c.status === 'connected',
                ) ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleDisconnect(selectedMp.id)
                      setModalOpen(false)
                    }}
                    className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    Desconectar Canal
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Conexão'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
