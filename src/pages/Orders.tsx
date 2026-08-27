import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Eye,
  FileText,
  Truck,
  CheckCircle2,
  X,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Receipt,
  User,
  ShoppingBag,
  DollarSign,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ordersService, productsService, invoicesService } from '@/services/api'
import {
  formatCurrency,
  formatDate,
  formatDoc,
  ORDER_STATUS_MAP,
  NFE_STATUS_MAP,
  MARKETPLACE_LABELS,
} from '@/lib/formatters'
import { OrderRecord, OrderItem, ProductRecord, MarketplaceType, OrderStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export const Orders: React.FC = () => {
  const { tenant } = useAuth()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false)
  const [importCsvModalOpen, setImportCsvModalOpen] = useState(false)
  const [isIssuingNfe, setIsIssuingNfe] = useState(false)

  // New Order Form state
  const [formMarketplace, setFormMarketplace] = useState<MarketplaceType>('manual')
  const [formOrderId, setFormOrderId] = useState('')
  const [formCustomerName, setFormCustomerName] = useState('')
  const [formCustomerDoc, setFormCustomerDoc] = useState('')
  const [formCustomerEmail, setFormCustomerEmail] = useState('')
  const [formCustomerPhone, setFormCustomerPhone] = useState('')
  const [formItems, setFormItems] = useState<OrderItem[]>([{ sku: '', name: '', qty: 1, price: 0 }])
  const [formShipping, setFormShipping] = useState<number>(0)
  const [formDiscount, setFormDiscount] = useState<number>(0)
  const [formStatus, setFormStatus] = useState<OrderStatus>('paid')

  useRealtime('orders', () => loadOrders())

  const loadOrders = async () => {
    if (!tenant?.id) return
    try {
      const res = await ordersService.list(tenant.id, '', '-created', 1, 200)
      setOrders(res.items)
      const prods = await productsService.list(tenant.id)
      setProducts(prods)

      const detailId = searchParams.get('detail')
      if (detailId) {
        const found = res.items.find((o) => o.id === detailId)
        if (found) setSelectedOrder(found)
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [tenant?.id])

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = o.customer_name?.toLowerCase().includes(q)
        const matchDoc = o.customer_doc?.toLowerCase().includes(q)
        const matchId =
          o.marketplace_order_id?.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
        if (!matchName && !matchDoc && !matchId) return false
      }

      // Marketplace multi-select
      if (selectedMarketplaces.length > 0 && !selectedMarketplaces.includes(o.marketplace)) {
        return false
      }

      // Status
      if (selectedStatus !== 'all' && o.status !== selectedStatus) {
        return false
      }

      // Date Range
      if (startDate) {
        const d = o.created ? o.created.split('T')[0] : ''
        if (d < startDate) return false
      }
      if (endDate) {
        const d = o.created ? o.created.split('T')[0] : ''
        if (d > endDate) return false
      }

      return true
    })
  }, [orders, search, selectedMarketplaces, selectedStatus, startDate, endDate])

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(start, start + itemsPerPage)
  }, [filteredOrders, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage))

  const toggleMarketplaceFilter = (mp: string) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(mp) ? prev.filter((p) => p !== mp) : [...prev, mp],
    )
    setCurrentPage(1)
  }

  // Add Item in New Order form
  const handleAddItem = () => {
    setFormItems([...formItems, { sku: '', name: '', qty: 1, price: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return
    setFormItems(formItems.filter((_, idx) => idx !== index))
  }

  const handleItemProductSelect = (index: number, sku: string) => {
    const prod = products.find((p) => p.sku === sku)
    if (!prod) return
    const updated = [...formItems]
    updated[index] = {
      sku: prod.sku,
      name: prod.name,
      qty: updated[index].qty || 1,
      price: prod.price,
    }
    setFormItems(updated)
  }

  const formSubtotal = formItems.reduce((acc, it) => acc + it.qty * it.price, 0)
  const formTotal = Math.max(
    0,
    formSubtotal + (Number(formShipping) || 0) - (Number(formDiscount) || 0),
  )

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id) return

    try {
      const orderData: Partial<OrderRecord> = {
        tenant: tenant.id,
        marketplace: formMarketplace,
        marketplace_order_id: formOrderId || `DIR-${Date.now().toString().slice(-6)}`,
        customer_name: formCustomerName,
        customer_doc: formCustomerDoc,
        customer_email: formCustomerEmail,
        customer_phone: formCustomerPhone,
        items: formItems,
        subtotal: formSubtotal,
        shipping: formShipping,
        discount: formDiscount,
        total: formTotal,
        status: formStatus,
        nfe_status: 'none',
      }

      await ordersService.create(orderData)
      toast({
        title: 'Pedido registrado com sucesso!',
        description: 'Venda lançada e disponível para faturamento.',
      })

      setNewOrderModalOpen(false)
      // Reset form
      setFormOrderId('')
      setFormCustomerName('')
      setFormCustomerDoc('')
      setFormCustomerEmail('')
      setFormCustomerPhone('')
      setFormItems([{ sku: '', name: '', qty: 1, price: 0 }])
      setFormShipping(0)
      setFormDiscount(0)
      await loadOrders()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar pedido',
        description: err?.message || 'Falha ao salvar os dados do pedido.',
      })
    }
  }

  // Update Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersService.update(orderId, { status: newStatus })
      toast({
        title: 'Status atualizado',
        description: `Pedido alterado para ${ORDER_STATUS_MAP[newStatus]?.label || newStatus}.`,
      })
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
      await loadOrders()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: err?.message,
      })
    }
  }

  // Emit NF-e action
  const handleEmitNfe = async (order: OrderRecord) => {
    setIsIssuingNfe(true)
    try {
      const res = await invoicesService.issueNfe(order.id)
      toast({
        title: 'Nota Fiscal Emitida!',
        description: res.message || `NF-e nº ${res.number} autorizada pela SEFAZ.`,
      })
      await loadOrders()
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, nfe_status: 'issued' })
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Falha na emissão da NF-e',
        description: err?.message || 'Ocorreu um erro ao comunicar com a SEFAZ.',
      })
    } finally {
      setIsIssuingNfe(false)
    }
  }

  // CSV Import Parser
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenant?.id) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      if (!text) return

      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      if (lines.length < 2) {
        toast({ variant: 'destructive', title: 'Arquivo vazio ou formato inválido.' })
        return
      }

      let imported = 0
      let failed = 0

      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        // Expected columns: plataforma, id_externo, cliente, documento, email, itens(SKU;qtd;preço|...), subtotal, frete, desconto, total, status
        if (cols.length >= 6) {
          try {
            const rawItems = cols[5] || ''
            const itemsParsed: OrderItem[] = rawItems.split('|').map((it) => {
              const [sku, qty, price] = it.split(';')
              return {
                sku: sku || 'SKU-CSV',
                name: `Item ${sku || ''}`,
                qty: parseInt(qty, 10) || 1,
                price: parseFloat(price) || 0,
              }
            })

            await ordersService.create({
              tenant: tenant.id,
              marketplace: (cols[0] as MarketplaceType) || 'manual',
              marketplace_order_id: cols[1] || `CSV-${Date.now()}-${i}`,
              customer_name: cols[2] || 'Cliente CSV',
              customer_doc: cols[3] || '',
              customer_email: cols[4] || '',
              items:
                itemsParsed.length > 0
                  ? itemsParsed
                  : [
                      {
                        sku: 'CSV-01',
                        name: 'Produto Importado',
                        qty: 1,
                        price: parseFloat(cols[9]) || 100,
                      },
                    ],
              subtotal: parseFloat(cols[6]) || parseFloat(cols[9]) || 0,
              shipping: parseFloat(cols[7]) || 0,
              discount: parseFloat(cols[8]) || 0,
              total: parseFloat(cols[9]) || 100,
              status: (cols[10] as OrderStatus) || 'paid',
              nfe_status: 'none',
            })
            imported++
          } catch (err) {
            failed++
          }
        }
      }

      toast({
        title: 'Importação CSV Finalizada',
        description: `${imported} pedido(s) importado(s) com sucesso. ${failed > 0 ? `${failed} erros.` : ''}`,
      })
      setImportCsvModalOpen(false)
      await loadOrders()
    }

    reader.readAsText(file)
  }

  // Download CSV template
  const downloadCsvTemplate = () => {
    const header =
      'plataforma,id_externo,cliente,documento,email,itens,subtotal,frete,desconto,total,status\n'
    const sample =
      'mercadolivre,MLB-99481234,João da Silva,123.456.789-00,joao@email.com,FNB-001;1;189.90,189.90,15.00,0.00,204.90,paid\nshopee,SHP-774812,Maria Souza,222.333.444-55,maria@email.com,TEC-007;1;349.90|MOU-003;1;119.90,469.80,0.00,20.00,449.80,paid'
    const blob = new Blob([header + sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_importacao_pedidos.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Central de Pedidos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie vendas de marketplaces e balcão, acompanhe status e emita NF-e
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCsvTemplate}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Template CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportCsvModalOpen(true)}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5 text-sky-600" />
            <span>Importar CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setNewOrderModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Pedido</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7EAEF] shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar por ID, cliente, CPF..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E7EAEF] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              aria-label="Filtrar por Status do Pedido"
              className="w-full py-2 px-3 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E7EAEF] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-medium"
            >
              <option value="all">Todos os Status</option>
              <option value="new">Novo</option>
              <option value="paid">Pago</option>
              <option value="preparing">Em Separação</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="canceled">Cancelado</option>
            </select>
          </div>

          {/* Date range */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setCurrentPage(1)
              }}
              aria-label="Data inicial"
              className="w-full py-1.5 px-3 text-xs bg-[#F7F8FA] border border-[#E7EAEF] rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setCurrentPage(1)
              }}
              aria-label="Data final"
              className="w-full py-1.5 px-3 text-xs bg-[#F7F8FA] border border-[#E7EAEF] rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Marketplace Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1">Canais:</span>
          {['mercadolivre', 'shopee', 'amazon', 'magalu', 'netshoes', 'shein', 'manual'].map(
            (mp) => {
              const isSel = selectedMarketplaces.includes(mp)
              const meta = MARKETPLACE_LABELS[mp]
              return (
                <button
                  key={mp}
                  onClick={() => toggleMarketplaceFilter(mp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSel
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {meta?.name || mp}
                </button>
              )
            },
          )}
          {selectedMarketplaces.length > 0 && (
            <button
              onClick={() => setSelectedMarketplaces([])}
              className="text-xs text-rose-600 hover:underline ml-2 font-medium"
            >
              Limpar canais
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#E7EAEF] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Pedido / Canal</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Itens</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">NF-e</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((ord) => {
                  const statusMeta = ORDER_STATUS_MAP[ord.status] || ORDER_STATUS_MAP.new
                  const nfeMeta = NFE_STATUS_MAP[ord.nfe_status] || NFE_STATUS_MAP.none
                  const mpMeta = MARKETPLACE_LABELS[ord.marketplace] || MARKETPLACE_LABELS.manual

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {ord.marketplace_order_id || `#${ord.id.slice(0, 8)}`}
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold ${mpMeta.badgeBg}`}
                        >
                          {mpMeta.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">
                          {ord.customer_name || 'Consumidor Final'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {formatDoc(ord.customer_doc)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {ord.items?.length || 0} produto(s)
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-sm">
                        {formatCurrency(ord.total)}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                          }
                          aria-label="Alterar status do pedido"
                          className={`text-[11px] font-semibold px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          <option value="new">Novo</option>
                          <option value="paid">Pago</option>
                          <option value="preparing">Em Separação</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregue</option>
                          <option value="canceled">Cancelado</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${nfeMeta.bg} ${nfeMeta.text} ${nfeMeta.border}`}
                        >
                          {nfeMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(ord.created, true)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ord.nfe_status !== 'issued' && ord.status === 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEmitNfe(ord)}
                              disabled={isIssuingNfe}
                              className="h-7 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 px-2 flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              <span>Emitir NF-e</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedOrder(ord)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    Nenhum pedido encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Mostrando <b>{Math.min(filteredOrders.length, (currentPage - 1) * itemsPerPage + 1)}</b>{' '}
            a <b>{Math.min(filteredOrders.length, currentPage * itemsPerPage)}</b> de{' '}
            <b>{filteredOrders.length}</b> pedidos
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800 font-bold">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Detalhes do Pedido{' '}
                    {selectedOrder.marketplace_order_id || `#${selectedOrder.id}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registrado em {formatDate(selectedOrder.created, true)} via{' '}
                    {MARKETPLACE_LABELS[selectedOrder.marketplace]?.name ||
                      selectedOrder.marketplace}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <User className="h-3.5 w-3.5 text-emerald-600" />
                <span>Dados do Cliente / Destinatário</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <p className="text-slate-400 text-[11px]">Nome Completo:</p>
                  <p className="font-semibold text-slate-900">
                    {selectedOrder.customer_name || 'Consumidor Final'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">CPF / CNPJ:</p>
                  <p className="font-semibold text-slate-900 font-mono">
                    {formatDoc(selectedOrder.customer_doc)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">E-mail:</p>
                  <p className="text-slate-800">
                    {selectedOrder.customer_email || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Telefone:</p>
                  <p className="text-slate-800">
                    {selectedOrder.customer_phone || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="my-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                <span>Itens do Pedido</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Descrição do Produto</th>
                      <th className="py-2.5 px-3 text-center">Qtd</th>
                      <th className="py-2.5 px-3 text-right">Unitário</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {it.sku || '–'}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">{it.name}</td>
                          <td className="py-2 px-3 text-center">{it.qty}</td>
                          <td className="py-2 px-3 text-right font-mono">
                            {formatCurrency(it.price)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            {formatCurrency(it.qty * it.price)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-3 text-center text-slate-400">
                          Sem itens detalhados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-end text-xs space-y-1">
              <div className="flex justify-between w-48 text-slate-600">
                <span>Subtotal Itens:</span>
                <span className="font-mono">
                  {formatCurrency(selectedOrder.subtotal || selectedOrder.total)}
                </span>
              </div>
              <div className="flex justify-between w-48 text-slate-600">
                <span>Frete:</span>
                <span className="font-mono">{formatCurrency(selectedOrder.shipping || 0)}</span>
              </div>
              <div className="flex justify-between w-48 text-slate-600">
                <span>Desconto:</span>
                <span className="font-mono text-emerald-600">
                  - {formatCurrency(selectedOrder.discount || 0)}
                </span>
              </div>
              <div className="flex justify-between w-48 pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Total Pedido:</span>
                <span className="font-mono text-emerald-700">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Alterar Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleUpdateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)
                  }
                  aria-label="Alterar Status do Pedido no Modal"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="new">Novo</option>
                  <option value="paid">Pago</option>
                  <option value="preparing">Em Separação</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="canceled">Cancelado</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {selectedOrder.status === 'paid' && selectedOrder.nfe_status !== 'issued' && (
                  <Button
                    onClick={() => handleEmitNfe(selectedOrder)}
                    disabled={isIssuingNfe}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{isIssuingNfe ? 'Transmitindo SEFAZ...' : 'Emitir NF-e Agora'}</span>
                  </Button>
                )}
                {selectedOrder.status === 'paid' && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'shipped')}
                    className="text-xs font-medium border-slate-300 text-slate-700 flex items-center gap-1.5"
                  >
                    <Truck className="h-4 w-4 text-sky-600" />
                    <span>Marcar como Enviado</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {newOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Novo Pedido / Venda Manual</h3>
                <p className="text-xs text-slate-500">
                  Lançamento de venda direta de balcão ou canal externo
                </p>
              </div>
              <button
                onClick={() => setNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Canal de Venda
                  </label>
                  <select
                    value={formMarketplace}
                    onChange={(e) => setFormMarketplace(e.target.value as MarketplaceType)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="manual">Venda Direta / Balcão</option>
                    <option value="mercadolivre">Mercado Livre</option>
                    <option value="shopee">Shopee</option>
                    <option value="amazon">Amazon</option>
                    <option value="magalu">Magalu</option>
                    <option value="netshoes">Netshoes</option>
                    <option value="shein">Shein</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    ID Externo / Código
                  </label>
                  <input
                    type="text"
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    placeholder="Ex: DIR-00102"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="paid">Pago</option>
                    <option value="new">Novo</option>
                    <option value="preparing">Em Separação</option>
                    <option value="shipped">Enviado</option>
                  </select>
                </div>
              </div>

              {/* Customer */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-700">Dados do Cliente</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      CPF / CNPJ *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCustomerDoc}
                      onChange={(e) => setFormCustomerDoc(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={formCustomerEmail}
                      onChange={(e) => setFormCustomerEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={formCustomerPhone}
                      onChange={(e) => setFormCustomerPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">Itens do Pedido</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="h-7 text-[11px] font-semibold border-slate-200"
                  >
                    + Adicionar Item
                  </Button>
                </div>

                {formItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div className="w-1/4">
                      <select
                        value={item.sku}
                        onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="">Selecione SKU...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.sku}>
                            {p.sku} - {p.name.slice(0, 20)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...formItems]
                          updated[idx].name = e.target.value
                          setFormItems(updated)
                        }}
                        placeholder="Descrição do item"
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="w-16">
                      <input
                        type="number"
                        min={1}
                        required
                        value={item.qty}
                        onChange={(e) => {
                          const updated = [...formItems]
                          updated[idx].qty = parseInt(e.target.value, 10) || 1
                          setFormItems(updated)
                        }}
                        placeholder="Qtd"
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-center"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        required
                        value={item.price}
                        onChange={(e) => {
                          const updated = [...formItems]
                          updated[idx].price = parseFloat(e.target.value) || 0
                          setFormItems(updated)
                        }}
                        placeholder="Preço R$"
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-right font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={formItems.length === 1}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Frete (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formShipping}
                    onChange={(e) => setFormShipping(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Desconto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="flex flex-col justify-end text-right">
                  <span className="text-[11px] text-slate-500 font-medium">Total Calculado:</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {formatCurrency(formTotal)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewOrderModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Registrar Pedido
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {importCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Importar Pedidos via CSV</h3>
              <button
                onClick={() => setImportCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <p className="text-xs text-slate-600">
                Faça upload de uma planilha CSV no padrão do Hub de Vendas para importar múltiplos
                pedidos em lote.
              </p>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <label className="cursor-pointer text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  <span>Selecionar arquivo .CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Formato CSV UTF-8 separado por vírgula
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                💡 Dica: Você pode baixar o <b>Template CSV</b> no botão superior para preencher no
                formato correto.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setImportCsvModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
