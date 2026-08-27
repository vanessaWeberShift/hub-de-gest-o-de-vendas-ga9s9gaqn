import React from 'react'
import { CheckCircle2, ArrowRight, Layers, RefreshCw, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

interface MarketplaceItem {
  id: string
  name: string
  tagline: string
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  badgeText: string
  features: string[]
}

const MARKETPLACES: MarketplaceItem[] = [
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    tagline: 'Full, Flex e envios normais com sincronização em tempo real',
    color: '#FFE600',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200/80',
    badgeText: 'API Oficial Integrada',
    features: [
      'Sincroniza status Mercado Envios',
      'Importação automática de taxas',
      'Emissão em lote',
    ],
  },
  {
    id: 'shopee',
    name: 'Shopee',
    tagline: 'Vendas diárias conectadas via Open Platform com atualização contínua',
    color: '#EE4D2D',
    bgColor: 'bg-orange-500/10 hover:bg-orange-500/20',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200/80',
    badgeText: 'Sincronização 24/7',
    features: [
      'Atualização de estoque automática',
      'Gestão de múltiplos CNPJs',
      'Etiquetas e DANFE rápidos',
    ],
  },
  {
    id: 'amazon',
    name: 'Amazon Brasil',
    tagline: 'FBA e DBA sincronizados com alta precisão e conformidade fiscal',
    color: '#FF9900',
    bgColor: 'bg-amber-600/10 hover:bg-amber-600/20',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-300/80',
    badgeText: 'Seller Central Connect',
    features: [
      'Suporte a SKU pai e filho',
      'Cálculo de repasse e frete',
      'Homologação fiscal SEFAZ',
    ],
  },
  {
    id: 'magalu',
    name: 'Magalu Marketplace',
    tagline: 'Integração completa com Magalu Entregas e emissão fiscal imediata',
    color: '#0086FF',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200/80',
    badgeText: 'LuizaLabs API',
    features: [
      'Sincronismo de rastreio',
      'Controle unificado de estoque',
      'Emissão automática de DANFE',
    ],
  },
  {
    id: 'netshoes',
    name: 'Netshoes & Zattini',
    tagline: 'Controle ágil de vestuário, calçados e artigos esportivos em larga escala',
    color: '#581C87',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200/80',
    badgeText: 'Alta Escala',
    features: [
      'Mapeamento rápido de grade',
      'Exportação de relatórios DRE',
      'Controle de devoluções',
    ],
  },
  {
    id: 'shein',
    name: 'Shein Marketplace',
    tagline: 'Gestão de pedidos de moda e tendências com emissão fiscal descomplicada',
    color: '#111827',
    bgColor: 'bg-slate-900/10 hover:bg-slate-900/20',
    textColor: 'text-slate-900',
    borderColor: 'border-slate-300',
    badgeText: 'Shein Marketplace Direct',
    features: [
      'Suporte a alto volume',
      'Sincronismo ágil de pedidos',
      'Validação automática de CPF/CNPJ',
    ],
  },
]

export const MarketplacesSection: React.FC = () => {
  return (
    <section id="marketplaces" className="py-20 md:py-28 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-200/60">
            <Layers className="h-3.5 w-3.5 text-emerald-600" />
            <span>Multi-Canal Sem Complicação</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Conecte todos os seus marketplaces em um único painel
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Sincronize pedidos automaticamente de todos os portais. Chega de planilha e login em 6
            abas diferentes para conferir vendas ou emitir nota.
          </p>
        </div>

        {/* Grid of Marketplaces Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {MARKETPLACES.map((mp) => (
            <div
              key={mp.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`h-12 px-3.5 rounded-xl flex items-center justify-center font-black text-sm tracking-tight border ${mp.bgColor} ${mp.textColor} ${mp.borderColor}`}
                  >
                    {mp.name}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {mp.badgeText}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mb-5 leading-relaxed font-normal">
                  {mp.tagline}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {mp.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-700 font-medium"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                  Sincronização Ativa
                </span>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner Note */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="flex items-center gap-4 text-left">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Vende em outros canais ou possui loja própria?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Você também pode lançar pedidos manuais ou importar via API para emissão fiscal
                unificada.
              </p>
            </div>
          </div>

          <Link
            to="/register"
            className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-colors shadow-md"
          >
            <span>Conectar minha loja</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
