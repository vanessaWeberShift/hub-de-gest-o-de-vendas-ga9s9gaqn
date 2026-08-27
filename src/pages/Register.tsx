import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  Receipt,
  Building2,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const { registerTenantAndUser } = useAuth()
  const { toast } = useToast()

  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<1 | 2>(1)

  // Selected plan from URL query param e.g. ?plano=essencial or ?plano=profissional
  const [selectedPlan, setSelectedPlan] = useState<string>('gratis')

  useEffect(() => {
    const p = searchParams.get('plano') || searchParams.get('plan')
    if (p && ['gratis', 'essencial', 'profissional', 'enterprise'].includes(p.toLowerCase())) {
      setSelectedPlan(p.toLowerCase())
    }
  }, [searchParams])

  // Step 1: Company data
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [ie, setIe] = useState('')

  // Step 2: User access
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      setErrorMsg('Informe a Razão Social ou Nome Fantasia da sua empresa.')
      return
    }
    setErrorMsg('')
    setStep(2)
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (password !== confirmPassword) {
      setErrorMsg('A confirmação de senha não confere com a senha informada.')
      return
    }

    if (password.length < 8) {
      setErrorMsg('A senha de acesso deve possuir no mínimo 8 caracteres.')
      return
    }

    setLoading(true)

    try {
      await registerTenantAndUser(
        {
          name: companyName,
          cnpj,
          ie,
          plan: selectedPlan,
        },
        {
          name: userName,
          email: userEmail,
          pass: password,
        },
      )

      toast({
        title: 'Cadastro concluído com sucesso!',
        description: 'Sua empresa e usuário administrador foram criados.',
      })

      navigate('/dashboard')
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao processar o cadastro. Verifique se o e-mail já existe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold mb-3">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Criar Conta no Hub Vendas
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span>Plano selecionado:</span>
            <span className="font-semibold uppercase tracking-wider text-emerald-300">
              {selectedPlan === 'gratis'
                ? 'Teste Grátis (5 dias)'
                : selectedPlan === 'essencial'
                  ? 'Essencial'
                  : selectedPlan === 'profissional'
                    ? 'Profissional'
                    : 'Enterprise'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Configure seu tenant multi-vendedor e comece a gerenciar suas vendas
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
              step === 1
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950 text-[10px]">
              1
            </span>
            <span>Dados da Empresa</span>
          </div>

          <div className="w-6 h-[1px] bg-slate-700" />

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
              step === 2
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950 text-[10px]">
              2
            </span>
            <span>Seu Acesso</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    1. Dados da Empresa (Tenant)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Identificação fiscal para emissão de notas fiscais
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Razão Social / Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Minha Loja Comércio Digital Ltda"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plano Escolhido
                  </label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                  >
                    <option value="gratis">Teste Grátis (5 dias)</option>
                    <option value="essencial">Plano Essencial - R$ 97/mês</option>
                    <option value="profissional">Plano Profissional - R$ 197/mês</option>
                    <option value="enterprise">Plano Enterprise - R$ 397/mês</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Inscrição Estadual (IE)
                  </label>
                  <input
                    type="text"
                    value={ie}
                    onChange={(e) => setIe(e.target.value)}
                    placeholder="123456789012"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2"
                >
                  <span>Avançar para dados de acesso</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    2. Seu Acesso de Administrador
                  </h2>
                  <p className="text-xs text-slate-500">Credenciais para gerenciar a conta</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Nome do Administrador"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail de Login *
                </label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="admin@empresa.com.br"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Senha (mín. 8 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-10 px-4 border-slate-200 text-slate-700 flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Concluir e Acessar Hub</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Já possui uma conta de vendedor?{' '}
              <Link
                to="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
