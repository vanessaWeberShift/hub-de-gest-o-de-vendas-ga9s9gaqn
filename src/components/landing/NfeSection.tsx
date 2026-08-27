import React from 'react'
import { Link } from 'react-router-dom'
import {
  KeyRound,
  Zap,
  FileCode2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Server,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const NfeSection: React.FC = () => {
  return (
    <section id="funcionalidades" className="py-20 md:py-28 bg-[#F7F8FA] relative overflow-hidden">
      {/* Decorative background shape */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold mb-4 border border-emerald-300/60">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Módulo Fiscal Homologado SEFAZ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Emita NF-e sem complicação e sem dor de cabeça
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Importe seu certificado digital A1, conecte seu provedor fiscal homologado pela SEFAZ e
            emita notas fiscais de produto em segundos — direto do hub.
          </p>
        </div>

        {/* 3-Step Visual Card Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between relative group">
            <div className="absolute top-6 right-6 font-black text-3xl text-slate-100 group-hover:text-emerald-100 transition-colors">
              01
            </div>
            <div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Upload do Certificado A1</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Carregue seu arquivo{' '}
                <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-semibold">
                  .pfx
                </code>{' '}
                ou{' '}
                <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-semibold">
                  .p12
                </code>{' '}
                protegido por senha. Seus dados ficam criptografados com padrão bancário.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <Lock className="h-3.5 w-3.5" />
              <span>Criptografia AES-256 Multi-Tenant</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between relative group">
            <div className="absolute top-6 right-6 font-black text-3xl text-slate-100 group-hover:text-emerald-100 transition-colors">
              02
            </div>
            <div>
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Emissão em 1 Clique</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Abra qualquer pedido vindo do Mercado Livre, Shopee ou Amazon e clique em
                &quot;Emitir NF-e&quot;. O sistema preenche CFOP, NCM e tributação em tempo recorde.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-teal-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Validação prévia de tributos</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between relative group">
            <div className="absolute top-6 right-6 font-black text-3xl text-slate-100 group-hover:text-emerald-100 transition-colors">
              03
            </div>
            <div>
              <div className="h-12 w-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileCode2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. XML e DANFE Prontos</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Baixe o PDF do DANFE para impressão de etiquetas ou faça download do XML autorizado
                pela SEFAZ. O status é atualizado no marketplace automaticamente.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-cyan-700">
              <FileText className="h-3.5 w-3.5" />
              <span>Download instantâneo em lote ou avulso</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights & SEFAZ Badge Showcase */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Homologado pela SEFAZ
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Compatível com Simples Nacional, Lucro Presumido e Real
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Conecte seu provedor fiscal favorito ou use nosso gateway integrado
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Suporte nativo a provedores fiscais de ponta como Nuvem Fiscal, Focus NFe, Nota
                Fácil e e-Notas. Você escolhe se quer emitir em ambiente de homologação para testes
                ou produção imediata.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>NF-e Modelo 55 (Produto)</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Cancelamento de Nota</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Envio automático XML</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Carta de Correção (CC-e)</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Ambiente de Testes</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Armazenamento por 5 anos</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup of NF-e Status */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-mono text-emerald-400 font-bold">
                  SEFAZ - Protocolo de Autorização
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                  AUTORIZADA
                </span>
              </div>
              <div className="space-y-3 pt-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Chave de Acesso (44 dígitos)
                  </span>
                  <p className="font-mono text-slate-200 break-all text-[11px] bg-slate-800/80 p-2 rounded mt-1 border border-slate-700">
                    3525 0412 3456 7800 0190 5500 1000 0001 4212 9849 2019
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Número / Série</span>
                    <span className="text-white font-semibold">NF-e 000.142 - Série 1</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Protocolo</span>
                    <span className="text-white font-semibold font-mono">135250001428901</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-emerald-400 font-semibold text-xs">
                    Tempo de Resposta: 1.2s
                  </span>
                  <span className="text-slate-400 text-[10px]">Digest Value verificado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
