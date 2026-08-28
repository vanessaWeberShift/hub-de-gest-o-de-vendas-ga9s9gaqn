import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Zap, Sparkles, ArrowRight, ShieldCheck, Building2, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PricingPlan {
  id: 'gratis' | 'essencial' | 'profissional' | 'enterprise'
  name: string
  badge?: string
  popular?: boolean
  description: string
  monthlyPrice: number
  annualPriceMonthly: number
  marketplaces: string
  nfeLimit: string
  support: string
  features: string[]
  buttonText: string
  buttonLink: string
  buttonVariant: 'default' | 'outline' | 'emerald'
}

const PLANS: PricingPlan[] = [
  {
    id: 'gratis',
    name: 'Plano Grátis',
    badge: '5 Dias de Trial',
    popular: false,
    description: 'Experimente todo o poder do hub sem compromisso financeiro inicial.',
    monthlyPrice: 0,
    annualPriceMonthly: 0,
    marketplaces: '1 marketplace conectado',
    nfeLimit: '10 NF-e / mês',
    support: 'Suporte pela central de ajuda',
    features: [
      'Acesso completo a todas as funcionalidades',
      '1 conexão de marketplace ativa',
      '10 notas fiscais de teste / mês',
      'Upload de certificado digital A1',
      'Painel de receita e pedidos',
    ],
    buttonText: 'Começar grátis',
    buttonLink: '/register?plano=gratis',
    buttonVariant: 'outline',
  },
  {
    id: 'essencial',
    name: 'Plano Essencial',
    badge: '5 Dias Grátis',
    popular: false,
    description: 'Ideal para vendedores individuais e pequenas operações em crescimento.',
    monthlyPrice: 97,
    annualPriceMonthly: 77, // ~20% discount
    marketplaces: 'Até 3 marketplaces',
    nfeLimit: '100 NF-e / mês',
    support: 'Suporte por e-mail em até 24h',
    features: [
      '5 dias grátis com cartão cadastrado',
      'Conexão de até 3 marketplaces',
      'Até 100 notas fiscais / mês',
      'Suporte ágil por e-mail',
      'Importação de pedidos automática',
      'Armazenamento de XML/DANFE por 5 anos',
      'Ambiente Homologação & Produção',
    ],
    buttonText: 'Testar 5 Dias Grátis',
    buttonLink: '/register?plano=essencial',
    buttonVariant: 'outline',
  },
  {
    id: 'profissional',
    name: 'Plano Profissional',
    badge: '5 Dias Grátis • Mais popular',
    popular: true,
    description: 'Para lojistas e e-commerces que precisam de escala, velocidade e suporte vip.',
    monthlyPrice: 197,
    annualPriceMonthly: 157, // ~20% discount
    marketplaces: 'Todos os marketplaces',
    nfeLimit: '500 NF-e / mês',
    support: 'Suporte prioritário WhatsApp + Email',
    features: [
      '5 dias grátis com cartão cadastrado',
      'Todos os marketplaces liberados',
      'Até 500 notas fiscais / mês',
      'Suporte prioritário via WhatsApp',
      'Relatórios financeiros e DRE avançados',
      'Multi-usuários com controle de acesso',
      'Emissão de notas fiscais em lote',
      'Atualização de estoque instantânea',
    ],
    buttonText: 'Testar 5 Dias Grátis',
    buttonLink: '/register?plano=profissional',
    buttonVariant: 'emerald',
  },
  {
    id: 'enterprise',
    name: 'Plano Enterprise',
    badge: '5 Dias Grátis',
    popular: false,
    description: 'Para grandes distribuidores e marcas com alto volume de vendas diárias.',
    monthlyPrice: 397,
    annualPriceMonthly: 317, // ~20% discount
    marketplaces: 'Marketplaces ilimitados',
    nfeLimit: 'NF-e ilimitadas',
    support: 'Gerente de contas dedicado',
    features: [
      '5 dias grátis com cartão cadastrado',
      'Marketplaces ilimitados',
      'NF-e ilimitadas (sem custo extra por nota)',
      'Suporte dedicado com SLA garantido',
      'Opção White-Label e customizações',
      'API REST completa para ERPs e WMS',
      'Treinamento de equipe e onboarding VIP',
    ],
    buttonText: 'Testar 5 Dias Grátis',
    buttonLink: '/register?plano=enterprise',
    buttonVariant: 'outline',
  },
]

interface PricingSectionProps {
  onContactClick: () => void
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onContactClick }) => {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="planos" className="py-20 md:py-28 bg-[#F7F8FA] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-4 border border-emerald-300">
            <Zap className="h-3.5 w-3.5 text-emerald-600" />
            <span>Preços Transparentes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Escolha o plano ideal para a escala do seu negócio
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Comece no teste grátis por 5 dias e faça upgrade quando suas vendas decolarem. Sem
            fidelidade e com cancelamento a qualquer momento.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-white p-1.5 rounded-full border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                !isAnnual
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faturamento Mensal
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAnnual
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Faturamento Anual</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-emerald-400/30">
                Economize 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 items-stretch">
          {PLANS.map((plan) => {
            const isFree = plan.monthlyPrice === 0
            const price = isAnnual ? plan.annualPriceMonthly : plan.monthlyPrice

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl bg-white p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/10 -translate-y-1'
                    : 'border border-slate-200 shadow-xs hover:shadow-lg'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>{plan.badge}</span>
                  </div>
                )}

                {/* Plan header */}
                <div>
                  {!plan.popular && plan.badge && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold mb-2">
                      {plan.badge}
                    </span>
                  )}

                  <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      {isFree ? (
                        <span className="text-3xl font-black text-slate-900">Grátis</span>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-slate-500">R$</span>
                          <span className="text-3xl sm:text-4xl font-black text-slate-900">
                            {price}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">/mês</span>
                        </>
                      )}
                    </div>
                    {isAnnual && !isFree && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                        Cobrado anualmente (R$ {price * 12}/ano) • 5 dias grátis
                      </p>
                    )}
                    {!isAnnual && !isFree && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                        5 dias de teste grátis com cartão
                      </p>
                    )}
                    {isFree && (
                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        5 dias sem cartão de crédito
                      </p>
                    )}
                  </div>

                  {/* Highlights */}
                  <div className="space-y-2.5 mb-6 text-xs">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{plan.marketplaces}</span>
                    </div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{plan.nfeLimit}</span>
                    </div>
                    <div className="font-semibold text-slate-600 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      <span>{plan.support}</span>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="space-y-2 pb-6 border-t border-slate-100 pt-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      O que está incluso:
                    </span>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Button */}
                <div className="pt-2">
                  <Link
                    to={`${plan.buttonLink}${isAnnual ? '&ciclo=annual' : '&ciclo=monthly'}`}
                    className="block w-full"
                  >
                    <Button
                      className={`w-full h-11 font-bold text-xs rounded-xl transition-all ${
                        plan.popular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
                          : 'border border-slate-200 bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{plan.buttonText}</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Note below cards */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 text-center max-w-4xl mx-auto shadow-xs">
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Todos os planos incluem certificado digital A1, painel de receita em tempo real e
            atualizações gratuitas. Cancele quando quiser, sem burocracia ou taxas de fidelidade.
          </p>
        </div>
      </div>
    </section>
  )
}
