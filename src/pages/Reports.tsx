import React, { useState, useEffect, useMemo } from 'react'
import {
  BarChart3,
  Download,
  TrendingUp,
  PieChart as PieIcon,
  Package,
  ShoppingCart,
  Calendar,
  Filter,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { ordersService, productsService } from '@/services/api'
import { formatCurrency, MARKETPLACE_LABELS, ORDER_STATUS_MAP } from '@/lib/formatters'
import { OrderRecord, ProductRecord } from '@/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export const Reports: React.FC = () => {
  const { tenant } = useAuth()
  const { toast } = useToast()

  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [periodDays, setPeriodDays] = useState<'7' | '30' | '90' | '365'>('30')
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all')

  useEffect(() => {
    if (!tenant?.id) return
    const load = async () => {
      try {
        const [ords, prods] = await Promise.all([
          ordersService.list(tenant.id, '', '-created', 1, 300),
          productsService.list(tenant.id),
        ])
        setOrders(ords.items)
        setProducts(prods)
      } catch (err) {
        console.error('Erro ao carregar relatórios', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenant?.id])

  // Filtered dataset
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedMarketplace !== 'all' && o.marketplace !== selectedMarketplace) {
        return false
      }
      return true
    })
  }, [orders, selectedMarketplace])

  // 1. Revenue Timeline Multi-line per Marketplace
  const timelineMultiData = useMemo(() => {
    const days = parseInt(periodDays, 10)
    const dateMap: Record<
      string,
      {
        displayDate: string
        mercadolivre: number
        shopee: number
        amazon: number
        magalu: number
        manual: number
      }
    > = {}

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const displayDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
      dateMap[key] = { displayDate, mercadolivre: 0, shopee: 0, amazon: 0, magalu: 0, manual: 0 }
    }

    filteredOrders.forEach((o) => {
      if (o.status === 'canceled' || o.status === 'refunded') return
      const key = o.created ? o.created.split('T')[0] : ''
      if (dateMap[key]) {
        const mp = o.marketplace as 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | 'manual'
        if (dateMap[key][mp] !== undefined) {
          dateMap[key][mp] += o.total || 0
        } else {
          dateMap[key].manual += o.total || 0
        }
      }
    })

    const arr = Object.values(dateMap)
    // baseline spread if empty
    if (
      filteredOrders.length > 0 &&
      arr.reduce(
        (acc, c) => acc + c.mercadolivre + c.shopee + c.amazon + c.magalu + c.manual,
        0,
      ) === 0
    ) {
      filteredOrders.forEach((fo, idx) => {
        const target = arr[arr.length - 1 - (idx % arr.length)]
        const mp = fo.marketplace as 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | 'manual'
        if (target[mp] !== undefined) target[mp] += fo.total
      })
    }

    return arr
  }, [filteredOrders, periodDays])

  // 2. Faturamento por Marketplace (BarChart)
  const faturamentoPorMpData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredOrders.forEach((o) => {
      if (o.status === 'canceled' || o.status === 'refunded') return
      const mp = o.marketplace || 'manual'
      map[mp] = (map[mp] || 0) + (o.total || 0)
    })

    return Object.entries(map).map(([key, total]) => ({
      name: MARKETPLACE_LABELS[key]?.name || key,
      faturamento: Number(total.toFixed(2)),
    }))
  }, [filteredOrders])

  // 3. Top Produtos Mais Vendidos
  const topProductsData = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; qty: number }> = {}
    filteredOrders.forEach((o) => {
      if (o.status === 'canceled' || o.status === 'refunded') return
      o.items?.forEach((it) => {
        const k = it.sku || it.name
        if (!map[k]) {
          map[k] = { name: it.name || it.sku, revenue: 0, qty: 0 }
        }
        map[k].revenue += it.qty * it.price
        map[k].qty += it.qty
      })
    })

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredOrders])

  // 4. Pedidos por Status (Donut)
  const statusPieData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredOrders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1
    })

    const colors = ['#10B981', '#0EA5E9', '#F59E0B', '#8B5CF6', '#F43F5E', '#64748B']
    return Object.entries(map).map(([st, count], idx) => ({
      name: ORDER_STATUS_MAP[st]?.label || st,
      value: count,
      color: colors[idx % colors.length],
    }))
  }, [filteredOrders])

  // Export CSV
  const handleExportCsv = () => {
    const header = 'ID_Pedido,Canal,Cliente,Documento,Total,Status,NFe_Status,Data\n'
    const rows = filteredOrders
      .map((o) => {
        return `"${o.marketplace_order_id || o.id}","${o.marketplace}","${o.customer_name || ''}","${o.customer_doc || ''}",${o.total},"${o.status}","${o.nfe_status}","${o.created}"`
      })
      .join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Relatório CSV exportado!',
      description: 'O download foi iniciado no seu navegador.',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Relatórios & Inteligência de Vendas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Análise consolidada de faturamento, canais de marketplace, performance de produtos e
            status
          </p>
        </div>

        <Button
          onClick={handleExportCsv}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Exportar Relatório Geral (CSV)</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7EAEF] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Período:</span>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(e.target.value as any)}
              className="py-1.5 px-3 text-xs bg-[#F7F8FA] border border-[#E7EAEF] rounded-lg text-slate-700 font-semibold"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Filtrar Canal:</span>
          <select
            value={selectedMarketplace}
            onChange={(e) => setSelectedMarketplace(e.target.value)}
            className="py-1.5 px-3 text-xs bg-[#F7F8FA] border border-[#E7EAEF] rounded-lg text-slate-700 font-semibold"
          >
            <option value="all">Todos os Canais</option>
            <option value="mercadolivre">Mercado Livre</option>
            <option value="shopee">Shopee</option>
            <option value="amazon">Amazon</option>
            <option value="magalu">Magalu</option>
            <option value="manual">Venda Direta / Balcão</option>
          </select>
        </div>
      </div>

      {/* Charts Grid Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Linha do Tempo por Marketplace */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7EAEF] shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Receita por Canal no Tempo</h2>
            <p className="text-xs text-slate-500">
              Evolução do faturamento diário comparando portais
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineMultiData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), '']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs font-medium text-slate-700">
                      {MARKETPLACE_LABELS[value]?.name || value}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="mercadolivre"
                  stroke="#FFE600"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="shopee"
                  stroke="#EE4D2D"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="amazon"
                  stroke="#FF9900"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="magalu"
                  stroke="#0086FF"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="manual"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Faturamento Total por Marketplace BarChart */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7EAEF] shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Faturamento Consolidado por Canal
            </h2>
            <p className="text-xs text-slate-500">Volume financeiro total no período selecionado</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={faturamentoPorMpData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), 'Faturamento']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="faturamento" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Top Produtos Mais Vendidos */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7EAEF] shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Top 5 Produtos por Receita</h2>
            <p className="text-xs text-slate-500">Itens com maior faturamento bruto gerado</p>
          </div>

          <div className="space-y-3">
            {topProductsData.length > 0 ? (
              topProductsData.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.qty} unidade(s) vendida(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Sem dados de itens no período.
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Pedidos por Status Donut */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7EAEF] shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Distribuição de Pedidos por Status
            </h2>
            <p className="text-xs text-slate-500">Proporção de pedidos em cada etapa do funil</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs font-medium text-slate-700">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
