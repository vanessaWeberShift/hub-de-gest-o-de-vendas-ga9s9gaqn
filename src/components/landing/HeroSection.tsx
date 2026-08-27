import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileCheck2,
  CheckCircle2,
  Receipt,
  ShoppingCart,
  Building,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroSectionProps {
  onContactClick: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onContactClick }) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 via-[#F7F8FA] to-white">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-400/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 flex flex-col text-left">
            {/* Top Pill / Badge */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-xs mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Tenant & Emissão Direta SEFAZ</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-medium">Novo</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              Controle total das suas vendas online —{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500">
                com NF-e emitida em segundos
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl">
              Conecte todos os seus marketplaces, emita notas fiscais com certificado digital A1 e
              acompanhe sua receita em tempo real. Tudo em um único lugar, sem planilhas ou
              retrabalho.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
              <Link to="/register" className="flex">
                <Button className="w-full sm:w-auto h-13 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 transition-all rounded-xl flex items-center justify-center gap-2.5">
                  <span>Começar teste grátis — 5 dias sem compromisso</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              <Button
                type="button"
                variant="outline"
                onClick={onContactClick}
                className="w-full sm:w-auto h-13 px-6 border-slate-300 hover:bg-slate-100/80 text-slate-700 font-semibold text-sm rounded-xl"
              >
                Falar com especialista
              </Button>
            </div>

            {/* Social Proof / Key Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-slate-900">6+</span>
                <span className="text-xs text-slate-500 font-medium">Marketplaces líderes</span>
              </div>
              <div className="flex flex-col border-l border-slate-200 pl-4">
                <span className="text-xl sm:text-2xl font-black text-emerald-600">&lt; 3 seg</span>
                <span className="text-xs text-slate-500 font-medium">Para emitir cada NF-e</span>
              </div>
              <div className="flex flex-col border-l border-slate-200 pl-4">
                <span className="text-xl sm:text-2xl font-black text-slate-900">100% Web</span>
                <span className="text-xs text-slate-500 font-medium">Sem instalar nada</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Dashboard Mockup Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Outer Glow Card Container */}
              <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 sm:p-6 shadow-2xl shadow-slate-900/30 border border-slate-700/60">
                {/* Mockup Header bar */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-xs font-mono text-slate-400">
                      hub.vendas/dashboard
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Ao Vivo
                  </span>
                </div>

                {/* Simulated Stats Overview */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                      <span>Faturamento Hoje</span>
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold text-white">R$ 14.850,00</div>
                    <div className="text-[10px] text-emerald-400 font-medium mt-1">
                      +18.4% vs. ontem
                    </div>
                  </div>

                  <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                      <span>NF-e Emitidas</span>
                      <FileCheck2 className="h-3.5 w-3.5 text-teal-400" />
                    </div>
                    <div className="text-xl font-bold text-white">142 / 142</div>
                    <div className="text-[10px] text-emerald-400 font-medium mt-1">
                      100% autorizadas SEFAZ
                    </div>
                  </div>
                </div>

                {/* Live Order Feed Simulation */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Últimos Pedidos Sincronizados</span>
                    <span className="text-[10px] text-slate-400">Sincronização contínua</span>
                  </div>

                  {/* Order Item 1 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-xs">
                        ML
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-100">
                          #MLB-98214 - Fone Bluetooth Pro
                        </span>
                        <span className="text-[10px] text-slate-400">Carlos Eduardo M.</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-emerald-400">R$ 289,90</span>
                      <span className="text-[10px] text-emerald-300 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> NF-e Emitida
                      </span>
                    </div>
                  </div>

                  {/* Order Item 2 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                        SHP
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-100">
                          #SHP-77123 - Kit Cabos USB-C
                        </span>
                        <span className="text-[10px] text-slate-400">Juliana Ribeiro</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-emerald-400">R$ 119,00</span>
                      <span className="text-[10px] text-emerald-300 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> NF-e Emitida
                      </span>
                    </div>
                  </div>

                  {/* Order Item 3 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                        AMZ
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-100">
                          #AMZ-33419 - Suporte Articulado
                        </span>
                        <span className="text-[10px] text-slate-400">Rafael Torres</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-emerald-400">R$ 349,50</span>
                      <span className="text-[10px] text-emerald-300 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> NF-e Emitida
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Certificate / SEFAZ Badge Overlay */}
                <div className="absolute -bottom-5 -left-5 sm:-bottom-6 sm:-left-6 bg-white rounded-xl p-3 shadow-xl border border-slate-200/80 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">Certificado Digital A1</span>
                    <span className="text-[11px] text-slate-500">Homologado SEFAZ Nacional</span>
                  </div>
                </div>

                {/* Floating Speed Badge */}
                <div className="absolute -top-4 -right-4 sm:-top-5 sm:-right-5 bg-emerald-600 text-white rounded-xl p-2.5 sm:p-3 shadow-lg flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                  <span className="text-xs font-bold">1 Clique = DANFE + XML</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
