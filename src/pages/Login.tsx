import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Receipt, Eye, EyeOff, ArrowRight, Lock, Mail, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('vanessa@wshift.com.br')
  const [password, setPassword] = useState('Skip@Pass')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      await login(email, password)
      toast({
        title: 'Bem-vindo de volta!',
        description: 'Autenticação realizada com sucesso.',
      })
      navigate('/dashboard')
    } catch (err: any) {
      setErrorMsg(err?.message || 'E-mail ou senha incorretos. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)

    try {
      await pb.collection('users').requestPasswordReset(forgotEmail)
      toast({
        title: 'E-mail de recuperação enviado',
        description: 'Verifique sua caixa de entrada para redefinir a senha.',
      })
      setForgotModalOpen(false)
      setForgotEmail('')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível enviar',
        description: err?.message || 'Erro ao processar solicitação de recuperação.',
      })
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header / Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold mb-3">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Hub de Gestão de Vendas</h1>
          <p className="text-sm text-slate-400 mt-1">
            Controle de receita, emissão de NF-e e integração com marketplaces
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Acesse sua conta</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Insira seu e-mail corporativo e senha de acesso
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com.br"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Entrar no Hub</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Ainda não possui uma conta de vendedor?{' '}
              <Link
                to="/register"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Criar nova empresa
              </Link>
            </p>
          </div>
        </div>

        {/* Credentials reminder hint */}
        <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
          <p>Acesso rápido de demonstração:</p>
          <p className="font-mono text-emerald-400 mt-0.5">vanessa@wshift.com.br / Skip@Pass</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Recuperar senha</h3>
            <p className="text-xs text-slate-500 mt-1">
              Informe seu e-mail cadastrado para receber o link de redefinição.
            </p>

            <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu.email@empresa.com.br"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForgotModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={forgotLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar link'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
