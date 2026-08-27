import React from 'react'
import { Link } from 'react-router-dom'
import { Link2, FileCheck2, Send, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STEPS = [
  {
    step: '1',
    title: 'Conecte seus marketplaces',
    description:
      'Vincule suas contas do Mercado Livre, Shopee, Amazon e outros com OAuth em 2 minutos. Sem configurações complexas.',
    icon: Link2,
    badge: 'OAuth 2.0 Seguro',
    time: '2 minutos',
  },
  {
    step: '2',
    title: 'Configure seu certificado',
    description:
      'Faça upload do seu certificado digital A1 (.pfx) e escolha o provedor fiscal homologado pela SEFAZ.',
    icon: FileCheck2,
    badge: 'Certificado A1',
    time: '1 minuto',
  },
  {
    step: '3',
    title: 'Venda e emita NF-e',
    description:
      'Seus pedidos sincronizam automaticamente. Emita notas fiscais com 1 clique e imprima o DANFE instantaneamente.',
    icon: Send,
    badge: '100% Automático',
    time: 'Instantâneo',
  },
]

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-200/60">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Simples e Direto</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Como funciona em apenas 3 passos
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Você não precisa ser um expert em tecnologia ou contabilidade. Em menos de 5 minutos sua
            operação de vendas online estará conectada e pronta para faturar.
          </p>
        </div>

        {/* 3 Horizontal Steps with Connector Line */}
        <div className="relative mb-16">
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] -translate-y-6 h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {STEPS.map((s, idx) => {
              const Icon = s.icon
              return (
                <div
                  key={s.step}
                  className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between text-center items-center group"
                >
                  <div className="flex flex-col items-center">
                    {/* Number Badge with Pulse */}
                    <div className="relative mb-6">
                      <div className="h-16 w-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                        {s.step}
                      </div>
                      <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center text-xs font-bold border-2 border-white">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full mb-3 border border-emerald-100">
                      {s.badge} • {s.time}
                    </span>

                    <h3 className="text-lg font-bold text-slate-900 mb-2.5">{s.title}</h3>

                    <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                      {s.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-center text-xs font-semibold text-slate-500">
                    <span>Passo {s.step} de 3</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Strip */}
        <div className="text-center">
          <Link to="/register">
            <Button className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg rounded-xl inline-flex items-center gap-2">
              <span>Iniciar configuração grátis agora</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-slate-500 mt-2.5">
            Sem necessidade de cartão de crédito. Comece em segundos.
          </p>
        </div>
      </div>
    </section>
  )
}
