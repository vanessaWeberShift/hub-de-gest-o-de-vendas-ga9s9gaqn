import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  AlertTriangle,
  Package,
  X,
  Check,
  ShieldCheck,
  TrendingUp,
  Percent,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { productsService } from '@/services/api'
import { formatCurrency } from '@/lib/formatters'
import { ProductRecord } from '@/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export const Products: React.FC = () => {
  const { tenant } = useAuth()
  const { toast } = useToast()

  const [products, setProducts] = useState<ProductRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form Fields
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | string>('')
  const [cost, setCost] = useState<number | string>('')
  const [stock, setStock] = useState<number | string>(0)
  const [ncm, setNcm] = useState('')
  const [cest, setCest] = useState('')
  const [cfop, setCfop] = useState('5102')
  const [ean, setEan] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')

  useRealtime('products', () => loadProducts())

  const loadProducts = async () => {
    if (!tenant?.id) return
    try {
      const data = await productsService.list(tenant.id, search, statusFilter)
      setProducts(data)
    } catch (err) {
      console.error('Erro ao carregar produtos', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [tenant?.id, search, statusFilter])

  const handleOpenCreate = () => {
    setEditingProduct(null)
    setSku('')
    setName('')
    setDescription('')
    setPrice('')
    setCost('')
    setStock(0)
    setNcm('')
    setCest('')
    setCfop('5102')
    setEan('')
    setStatus('active')
    setModalOpen(true)
  }

  const handleOpenEdit = (prod: ProductRecord) => {
    setEditingProduct(prod)
    setSku(prod.sku)
    setName(prod.name)
    setDescription(prod.description || '')
    setPrice(prod.price)
    setCost(prod.cost || '')
    setStock(prod.stock || 0)
    setNcm(prod.ncm || '')
    setCest(prod.cest || '')
    setCfop(prod.cfop || '5102')
    setEan(prod.ean || '')
    setStatus(prod.status)
    setModalOpen(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id) return

    if (!sku.trim() || !name.trim() || Number(price) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'SKU, Nome e Preço de Venda são obrigatórios.',
      })
      return
    }

    try {
      const payload: Partial<ProductRecord> = {
        tenant: tenant.id,
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        cost: cost ? Number(cost) : undefined,
        stock: Number(stock) || 0,
        ncm: ncm.replace(/\D/g, ''),
        cest: cest.replace(/\D/g, ''),
        cfop: cfop.trim() || '5102',
        ean: ean.trim(),
        status,
      }

      if (editingProduct) {
        await productsService.update(editingProduct.id, payload)
        toast({
          title: 'Produto atualizado!',
          description: `As alterações no SKU ${sku} foram salvas.`,
        })
      } else {
        await productsService.create(payload)
        toast({
          title: 'Produto cadastrado!',
          description: `O produto ${name} foi adicionado ao catálogo.`,
        })
      }

      setModalOpen(false)
      await loadProducts()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: err?.message || 'SKU duplicado ou dados fiscais inválidos.',
      })
    }
  }

  const handleToggleStatus = async (prod: ProductRecord) => {
    const newStatus = prod.status === 'active' ? 'inactive' : 'active'
    try {
      await productsService.update(prod.id, { status: newStatus })
      setProducts(products.map((p) => (p.id === prod.id ? { ...p, status: newStatus } : p)))
      toast({
        title: newStatus === 'active' ? 'Produto ativado' : 'Produto desativado',
      })
    } catch {
      /* intentionally ignored */
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await productsService.delete(id)
      toast({ title: 'Produto excluído com sucesso.' })
      setDeleteConfirmId(null)
      await loadProducts()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: err?.message || 'Este produto pode estar vinculado a pedidos existentes.',
      })
    }
  }

  // Profit Margin calculation
  const calculateMargin = (sellPrice: number, productCost?: number) => {
    if (!sellPrice || !productCost || productCost <= 0) return null
    const margin = ((sellPrice - productCost) / sellPrice) * 100
    return margin
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catálogo de Produtos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de itens, precificação, dados fiscais (NCM, CFOP) para emissão de NF-e
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Produto</span>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7EAEF] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU, nome ou descrição..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E7EAEF] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar produtos por status"
            className="py-1.5 px-3 text-xs bg-[#F7F8FA] border border-[#E7EAEF] rounded-lg text-slate-700 font-medium"
          >
            <option value="all">Todos os Produtos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#E7EAEF] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">SKU / Produto</th>
                <th className="py-3.5 px-4">Preço Venda</th>
                <th className="py-3.5 px-4">Custo</th>
                <th className="py-3.5 px-4">Margem</th>
                <th className="py-3.5 px-4">Estoque</th>
                <th className="py-3.5 px-4">Fiscal (NCM/CFOP)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {products.length > 0 ? (
                products.map((prod) => {
                  const margin = calculateMargin(prod.price, prod.cost)
                  const isLowStock = (prod.stock || 0) <= 5

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{prod.sku}</div>
                        <p className="font-medium text-slate-800 line-clamp-1">{prod.name}</p>
                        {prod.ean && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            EAN: {prod.ean}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-sm">
                        {formatCurrency(prod.price)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {prod.cost ? formatCurrency(prod.cost) : '–'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold">
                        {margin !== null ? (
                          <span
                            className={`inline-flex items-center gap-0.5 ${
                              margin >= 30
                                ? 'text-emerald-600'
                                : margin >= 15
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                            }`}
                          >
                            <Percent className="h-3 w-3" />
                            {margin.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Sem custo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-xs ${
                            isLowStock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="h-3 w-3 text-rose-600" />}
                          {prod.stock || 0} un.
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        <div>
                          NCM:{' '}
                          <span className="font-semibold text-slate-800">{prod.ncm || '–'}</span>
                        </div>
                        <div>
                          CFOP:{' '}
                          <span className="font-semibold text-slate-800">
                            {prod.cfop || '5102'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(prod)}
                          title="Clique para alternar status"
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                            prod.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {prod.status === 'active' ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(prod)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(prod.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    Nenhum produto cadastrado no catálogo. Clique em "Novo Produto" para iniciar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Produto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingProduct
                      ? `Editar SKU: ${editingProduct.sku}`
                      : 'Cadastrar Novo Produto'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dados comerciais e tributários para faturamento
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

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    SKU do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="Ex: FNB-001"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Nome / Descrição Resumida *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Fone Bluetooth Sem Fio ANC Pro"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Descrição Completa
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes técnicos, dimensões e garantia..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              {/* Pricing & Stock */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Estoque Físico
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Fiscal Data */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Parâmetros Fiscais (SEFAZ / NF-e)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                      NCM (8 dígitos)
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={ncm}
                      onChange={(e) => setNcm(e.target.value)}
                      placeholder="85183000"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                      CFOP Padrão
                    </label>
                    <select
                      value={cfop}
                      onChange={(e) => setCfop(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    >
                      <option value="5102">5102 (Venda mercadoria)</option>
                      <option value="5101">5101 (Produção própria)</option>
                      <option value="5405">5405 (Subst. Tributária)</option>
                      <option value="6102">6102 (Interestadual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                      CEST
                    </label>
                    <input
                      type="text"
                      maxLength={7}
                      value={cest}
                      onChange={(e) => setCest(e.target.value)}
                      placeholder="2105700"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                      Código de Barras (EAN)
                    </label>
                    <input
                      type="text"
                      value={ean}
                      onChange={(e) => setEan(e.target.value)}
                      placeholder="789..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Status no Catálogo
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="active">Ativo (Disponível para venda e sync)</option>
                  <option value="inactive">Inativo (Pausado)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Excluir Produto</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tem certeza que deseja remover este produto do catálogo? Esta ação não pode ser
              desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
