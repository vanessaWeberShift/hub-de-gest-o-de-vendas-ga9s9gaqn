import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  Store,
  KeyRound,
  FileText,
  Package,
  Building2,
  ArrowRight,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  PartyPopper,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: any
  actionLabel: string
  actionRoute: string
  isAutoDetect?: (context: any) => boolean
}

export const ONBOARDING_STEPS_CONFIG: OnboardingStep[] = [
  {
    id: 'connect_marketplace',
    title: 'Conectar um marketplace',
    description:
      'Integre sua loja no Mercado Livre, Shopee, Amazon ou Magalu para sincronizar pedidos.',
    icon: Store,
    actionLabel: 'Conectar Canais',
    actionRoute: '/marketplaces',
  },
  {
    id: 'upload_certificate',
    title: 'Subir certificado digital A1',
    description:
      'Importe seu arquivo .pfx para habilitar a assinatura e transmissão de NF-e na SEFAZ.',
    icon: KeyRound,
    actionLabel: 'Configurar Certificado',
    actionRoute: '/nfe',
  },
  {
    id: 'register_product',
    title: 'Cadastrar o primeiro produto',
    description:
      'Adicione itens no seu catálogo com SKU, preço, estoque e classificação tributária (NCM/CFOP).',
    icon: Package,
    actionLabel: 'Cadastrar Produto',
    actionRoute: '/products',
  },
  {
    id: 'issue_first_nfe',
    title: 'Emitir a primeira NF-e',
    description:
      'Realize o faturamento e transmissão oficial de uma venda autorizada com geração de XML e DANFE.',
    icon: FileText,
    actionLabel: 'Ir para Emissor NF-e',
    actionRoute: '/nfe',
  },
  {
    id: 'review_company_settings',
    title: 'Revisar dados fiscais e da empresa',
    description:
      'Confira CNPJ, Inscrição Estadual, endereço fiscal e credenciais de provedor em Configurações.',
    icon: Building2,
    actionLabel: 'Ver Configurações',
    actionRoute: '/settings',
  },
]

interface OnboardingChecklistProps {
  variant?: 'banner' | 'modal' | 'card'
  onClose?: () => void
  onOpen?: () => void
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  variant = 'card',
  onClose,
}) => {
  const { tenant } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const storageKey = `hub_onboarding_${tenant?.id || 'default'}`
  const dismissedKey = `hub_onboarding_dismissed_${tenant?.id || 'default'}`

  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})
  const [isDismissed, setIsDismissed] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load state from localStorage on mount / tenant change
  useEffect(() => {
    if (!tenant?.id) return

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setCompletedSteps(JSON.parse(saved))
      } else {
        // Initial defaults - step 5 (company data) can be pre-completed if tenant has cnpj
        const initial: Record<string, boolean> = {}
        if (tenant.cnpj) {
          initial['review_company_settings'] = true
        }
        setCompletedSteps(initial)
        localStorage.setItem(storageKey, JSON.stringify(initial))
      }

      const dismissed = localStorage.getItem(dismissedKey)
      setIsDismissed(dismissed === 'true')
    } catch {
      /* ignore */
    }
  }, [tenant?.id, storageKey, dismissedKey])

  const toggleStep = (stepId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    setCompletedSteps((prev) => {
      const next = { ...prev, [stepId]: !prev[stepId] }
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        /* ignore */
      }

      // If all completed, notify
      const allDone = ONBOARDING_STEPS_CONFIG.every((s) => next[s.id])
      if (allDone) {
        toast({
          title: '🎉 Parabéns! Onboarding concluído!',
          description: 'Sua operação está totalmente configurada e pronta para faturar.',
        })
      }

      return next
    })
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      localStorage.setItem(dismissedKey, 'true')
    } catch {
      /* ignore */
    }
    if (onClose) onClose()
    toast({
      title: 'Guia de Onboarding minimizado',
      description:
        'Você pode reabri-lo a qualquer momento pelo menu de suporte ou topo do Dashboard.',
    })
  }

  const handleReset = () => {
    const empty = {}
    setCompletedSteps(empty)
    setIsDismissed(false)
    try {
      localStorage.setItem(storageKey, JSON.stringify(empty))
      localStorage.removeItem(dismissedKey)
    } catch {
      /* ignore */
    }
    toast({
      title: 'Progresso do onboarding reiniciado.',
    })
  }

  const completedCount = ONBOARDING_STEPS_CONFIG.filter((s) => completedSteps[s.id]).length
  const totalSteps = ONBOARDING_STEPS_CONFIG.length
  const percent = Math.round((completedCount / totalSteps) * 100)
  const isFullyCompleted = completedCount === totalSteps

  if (isDismissed && variant !== 'modal') {
    return null
  }

  return (
    <div
      className={`bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden transition-all duration-200 ${
        variant === 'modal' ? 'max-w-2xl w-full p-6' : 'p-5 sm:p-6 mb-6'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Primeiros Passos no Hub Vendas
              </h2>
              {isFullyCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <PartyPopper className="h-3 w-3" />
                  100% Concluído
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Guia rápido para configurar sua empresa, conectar marketplaces e emitir NF-e.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expandir' : 'Recolher'}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Fechar guia de primeiros passos"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="py-3">
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className="text-slate-300">
            Progresso: <b className="text-emerald-400 font-mono">{completedCount}</b> de{' '}
            {totalSteps} etapas ({percent}%)
          </span>
          <span className="text-emerald-400 font-mono">{percent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      {!isCollapsed && (
        <div className="mt-2 space-y-2.5">
          {ONBOARDING_STEPS_CONFIG.map((step, idx) => {
            const isDone = !!completedSteps[step.id]
            const Icon = step.icon

            return (
              <div
                key={step.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-slate-800/40 border-slate-800 text-slate-300 opacity-90'
                    : 'bg-slate-800/80 border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={(e) => toggleStep(step.id, e)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                    title={isDone ? 'Marcar como não concluído' : 'Marcar como concluído'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500 hover:text-slate-400" />
                    )}
                  </button>

                  <div className="flex items-start gap-2.5">
                    <div
                      className={`hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">{idx + 1}.</span>
                        <h3
                          className={`text-xs sm:text-sm font-semibold tracking-tight ${
                            isDone ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant={isDone ? 'outline' : 'default'}
                    onClick={() => {
                      if (onClose) onClose()
                      navigate(step.actionRoute)
                    }}
                    className={`h-8 text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isDone
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    }`}
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}

          {/* Bottom helper actions */}
          <div className="pt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Ambiente seguro e isolado por tenant</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 underline"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reiniciar checklist</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Reopen Button / Pill component to show when onboarding is dismissed or in layout header
 */
export const OnboardingTriggerButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { tenant } = useAuth()
  const storageKey = `hub_onboarding_${tenant?.id || 'default'}`

  const [completedCount, setCompletedCount] = useState(0)
  const totalSteps = ONBOARDING_STEPS_CONFIG.length

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        const count = ONBOARDING_STEPS_CONFIG.filter((s) => parsed[s.id]).length
        setCompletedCount(count)
      }
    } catch {
      /* ignore */
    }
  }, [tenant?.id, storageKey])

  const percent = Math.round((completedCount / totalSteps) * 100)
  const isAll = completedCount === totalSteps

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1.5 shadow-sm"
    >
      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
      <span>{isAll ? 'Checklist Inicial (100%)' : `Guia de Início (${percent}%)`}</span>
    </Button>
  )
}
