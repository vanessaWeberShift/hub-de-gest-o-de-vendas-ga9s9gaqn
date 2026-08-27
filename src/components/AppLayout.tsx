import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Store,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Search,
  RefreshCw,
  Bell,
  Menu,
  X,
  ChevronDown,
  Check,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { marketplaceService, ordersService, productsService } from '@/services/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OrderRecord, ProductRecord } from '@/types'

export const AppLayout: React.FC = () => {
  const { user, tenant, tenantsList, logout, switchTenant, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState<OrderRecord[]>([])
  const [searchOpen, setSearchOpen] = useState(false)

  const [notifications, setNotifications] = useState<
    { id: string; title: string; desc: string; link: string; type: 'warning' | 'info' }[]
  >([])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [location.pathname])

  // Load operational notification counters
  useEffect(() => {
    if (!tenant?.id) return

    let mounted = true
    const checkAlerts = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          ordersService.list(tenant.id, 'nfe_status = "pending"', '-created', 1, 10),
          productsService.list(tenant.id, '', 'active'),
        ])

        if (!mounted) return

        const alerts: {
          id: string
          title: string
          desc: string
          link: string
          type: 'warning' | 'info'
        }[] = []

        if (ordersRes.totalItems > 0) {
          alerts.push({
            id: 'pending-nfe',
            title: `${ordersRes.totalItems} NF-e pendente(s)`,
            desc: 'Existem pedidos pagos aguardando emissão de nota fiscal.',
            link: '/nfe',
            type: 'warning',
          })
        }

        const lowStock = productsRes.filter((p) => (p.stock || 0) <= 5)
        if (lowStock.length > 0) {
          alerts.push({
            id: 'low-stock',
            title: `${lowStock.length} produto(s) com estoque baixo`,
            desc: `Produtos como "${lowStock[0].name}" atingiram o limite mínimo.`,
            link: '/products',
            type: 'warning',
          })
        }

        setNotifications(alerts)
      } catch {
        /* intentionally ignored */
      }
    }

    checkAlerts()
    const interval = setInterval(checkAlerts, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [tenant?.id])

  // Handle global search
  useEffect(() => {
    if (!globalSearch.trim() || !tenant?.id) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await ordersService.list(
          tenant.id,
          `marketplace_order_id ~ "${globalSearch}" || customer_name ~ "${globalSearch}" || customer_doc ~ "${globalSearch}"`,
          '-created',
          1,
          5,
        )
        setSearchResults(res.items)
        setSearchOpen(true)
      } catch (_) {
        setSearchResults([])
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [globalSearch, tenant?.id])

  const handleSyncMarketplaces = async () => {
    setIsSyncing(true)
    try {
      const res = await marketplaceService.syncOrders()
      toast({
        title: 'Sincronização concluída',
        description: res.message || 'Pedidos e canais de venda sincronizados com sucesso.',
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Falha na sincronização',
        description: err?.message || 'Não foi possível contatar todos os marketplaces.',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Pedidos', path: '/orders', icon: ShoppingCart },
    { label: 'Produtos', path: '/products', icon: Package },
    { label: 'NF-e', path: '/nfe', icon: FileText },
    { label: 'Marketplaces', path: '/marketplaces', icon: Store },
    { label: 'Relatórios', path: '/reports', icon: BarChart3 },
    { label: 'Configurações', path: '/settings', icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600">Carregando Hub Vendas...</p>
        </div>
      </div>
    )
  }

  const getInitials = (name?: string) => {
    if (!name) return 'HV'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between text-slate-300">
      <div>
        {/* Brand / Logo */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-800/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white tracking-tight text-base leading-tight">
              Hub Vendas
            </span>
            <span className="text-[11px] font-medium text-emerald-400">Gestão & NF-e</span>
          </div>
        </div>

        {/* Tenant Selector */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-left hover:bg-slate-800 transition-colors group">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-700 text-slate-200">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">
                      {tenant?.name || 'Empresa Ativa'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      CNPJ: {tenant?.cnpj || 'Não informado'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-slate-900 border-slate-800 text-slate-200 z-50">
              <DropdownMenuLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Alternar Empresa
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              {tenantsList.length > 0 ? (
                tenantsList.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => switchTenant(t.id)}
                    className="flex items-center justify-between cursor-pointer focus:bg-slate-800 focus:text-white py-2"
                  >
                    <div className="truncate">
                      <p className="text-sm font-medium text-white truncate">{t.name}</p>
                      <p className="text-[11px] text-slate-400">{t.cnpj || 'Sem CNPJ'}</p>
                    </div>
                    {t.id === tenant?.id && (
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-400">
                  Nenhuma outra empresa cadastrada.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation links */}
        <nav className="mt-2 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1E293B] text-white font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-md bg-emerald-500" />
                )}
                <Icon
                  className={`h-4 w-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}
                />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* User Footer block */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/40">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold text-xs">
              {getInitials(user?.name || user?.email)}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || 'Operador'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            title="Sair do sistema"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      {/* Desktop Sidebar 256px */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#0F172A] fixed inset-y-0 left-0 z-30 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Tablet Rail 72px */}
      <aside className="hidden md:flex lg:hidden w-[72px] shrink-0 bg-[#0F172A] fixed inset-y-0 left-0 z-30 flex-col justify-between py-4 items-center shadow-xl">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-bold">
            <Receipt className="h-5 w-5" />
          </div>
          <nav className="flex flex-col items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#1E293B] text-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-emerald-500" />
                  )}
                  <Icon className="h-5 w-5" />
                </NavLink>
              )
            })}
          </nav>
        </div>
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          title="Sair"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#0F172A] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:pl-[72px] lg:pl-64 min-w-0">
        {/* Sticky Topbar 64px */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-[#E7EAEF] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="text-slate-400">Hub Vendas</span>
              <span>/</span>
              <span className="font-semibold text-slate-800 capitalize">
                {location.pathname.replace('/', '') || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-72 md:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Buscar pedido, cliente, doc..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E7EAEF] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {globalSearch && (
                  <button
                    onClick={() => {
                      setGlobalSearch('')
                      setSearchOpen(false)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 overflow-hidden">
                  <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Resultados de Pedidos
                  </p>
                  {searchResults.map((ord) => (
                    <button
                      key={ord.id}
                      onClick={() => {
                        setSearchOpen(false)
                        setGlobalSearch('')
                        navigate(`/orders?search=${ord.marketplace_order_id || ord.id}`)
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-2 border-t border-slate-100 first:border-0"
                    >
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {ord.marketplace_order_id || `#${ord.id.slice(0, 8)}`} •{' '}
                          {ord.customer_name || 'Cliente'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Total: R$ {ord.total?.toFixed(2)} • {ord.marketplace}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sync Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncMarketplaces}
              disabled={isSyncing}
              className="hidden sm:flex items-center gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium h-9"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`}
              />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar pedidos'}</span>
            </Button>

            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Notificações"
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-2 z-50 bg-white shadow-xl border-slate-200"
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <p className="text-xs font-semibold text-slate-900">Alertas Operacionais</p>
                  <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    {notifications.length} pendente(s)
                  </span>
                </div>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => navigate(n.link)}
                      className="cursor-pointer p-2.5 rounded-lg focus:bg-slate-50 flex items-start gap-2.5 my-1"
                    >
                      <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.desc}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    <ShieldCheck className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                    Tudo em dia! Sem pendências fiscais ou operacionais.
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>

        {/* Slim Footer */}
        <footer className="h-12 border-t border-[#E7EAEF] bg-white/70 px-4 sm:px-6 flex items-center justify-between text-xs text-slate-500">
          <div>
            © WShift • <span className="font-medium text-slate-700">Hub de Gestão de Vendas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Ambiente de Homologação / Produção Ativo
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
