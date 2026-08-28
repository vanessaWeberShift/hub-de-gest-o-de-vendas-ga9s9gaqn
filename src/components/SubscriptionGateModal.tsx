import React, { useState } from 'react'
import {
  AlertTriangle,
  CreditCard,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Calendar,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { billingService } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { PlanType } from '@/types'

export const SubscriptionGateModal: React.FC = () => {
  const { tenant, user, logout, refreshAuth } = useAuth()
  const { toast } = useToast()

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(tenant?.plan || 'essencial')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    tenant?.billing_cycle || 'monthly',
  )
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState(tenant?.card_holder_name || user?.name || '')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const status = tenant?.subscription_status

  // Determine if subscription needs regularization:
  // - past_due / unpaid
  // - trial expired (trial_ends_at < now)
  // - canceled
  const isTrialExpired =
    status === 'trial' &&
    tenant?.trial_ends_at &&
    new Date(tenant.trial_ends_at).getTime() < Date.now()

  const isBlocked =
    status === 'past_due' || status === 'unpaid' || status === 'canceled' || isTrialExpired

  if (!isBlocked) {
    return null
  }

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  const handleRegularize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id) return
    setErrorMsg('')

    if (selectedPlan !== 'gratis' && !tenant.card_last4 && !cardNumber) {
      setErrorMsg('Por favor, informe os dados do cartão de crédito para ativar o plano.')
      return
    }

    setLoading(true)
    try {
      const cleanDigits = cardNumber.replace(/\D/g, '')
      const last4 = cleanDigits.length >= 4 ? cleanDigits.slice(-4) : tenant.card_last4 || '4242'

      const res = await billingService.changePlan({
        tenantId: tenant.id,
        newPlan: selectedPlan,
        billingCycle: billingCycle,
        cardToken: cardNumber ? `tok_mp_${Date.now()}` : undefined,
        cardHolderName: cardHolder,
        cardLast4: last4,
        cardBrand: 'visa',
      })

      toast({
        title: 'Assinatura regularizada!',
        description: res.message || 'Seu acesso ao Hub Vendas foi restabelecido com sucesso.',
      })

      await refreshAuth()
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Não foi possível regularizar a assinatura no Mercado Pago. Verifique os dados.',
      )
    } finally {
      setLoading(false)
    }
  }

  const pricesMonthly: Record<string, number> = {
    gratis: 0,
    essencial: 97,
    profissional: 197,
    enterprise: 397,
  }
  const pricesAnnual: Record<string, number> = {
    gratis: 0,
    essencial: 77,
    profissional: 157,
    enterprise: 317,
  }
  const price =
    billingCycle === 'annual' ? pricesAnnual[selectedPlan] || 97 : pricesMonthly[selectedPlan] || 97

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 text-slate-900 relative">
        {/* Header Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold">
            <Lock className="h-6 w-6" />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair da conta</span>
          </button>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">
          {isTrialExpired
            ? 'Período de Teste Grátis de 5 Dias Encerrado'
            : status === 'canceled'
              ? 'Sua Assinatura Está Cancelada'
              : 'Pagamento Pendente / Atrasado'}
        </h2>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          {isTrialExpired
            ? 'Seus 5 dias de degustação gratuita expiraram. Selecione um plano e confirme o pagamento para continuar emitindo NF-e e sincronizando seus marketplaces.'
            : 'Para restabelecer o acesso total aos seus pedidos, notas fiscais e canais integrados, confirme ou atualize seu plano abaixo.'}
        </p>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegularize} className="space-y-4">
          {/* Plan Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
              Escolha seu Plano
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'essencial', name: 'Essencial', m: 97, a: 77 },
                { id: 'profissional', name: 'Profissional', m: 197, a: 157 },
                { id: 'enterprise', name: 'Enterprise', m: 397, a: 317 },
              ].map((item) => {
                const isSelected = selectedPlan === item.id
                const p = billingCycle === 'annual' ? item.a : item.m
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPlan(item.id as PlanType)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{item.name}</p>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">R$ {p}</p>
                    <p className="text-[10px] text-slate-500">/mês</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                billingCycle === 'annual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Anual</span>
              <span className="text-[10px] bg-emerald-500/20 px-1 py-0.2 rounded font-black text-emerald-100">
                -20%
              </span>
            </button>
          </div>

          {/* Card Info */}
          {tenant?.card_last4 ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">
                  Cobrar no Cartão final {tenant.card_last4} (
                  {(tenant.card_brand || 'visa').toUpperCase()})
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Mercado Pago</span>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Dados do Cartão de Crédito
              </label>
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/AA"
                  maxLength={5}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <input
                  type="password"
                  required
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="CVV"
                  maxLength={4}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Regularizar e Acessar Hub de Vendas (R$ {price}/mês)</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
