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
  AlertCircle,
  Phone,
  Mail,
  Lock,
  FileCheck2,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  validateCNPJ,
  validateInscricaoEstadual,
  validateEmail,
  validatePhone,
  formatCnpjMask,
  formatPhoneMask,
  BRAZILIAN_UFS,
  BrazilianUF,
} from '@/lib/validators'

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
  const [uf, setUf] = useState<BrazilianUF | ''>('SP')
  const [phone, setPhone] = useState('')

  // Step 2: User access
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Validation errors map & touched fields
  const [errors, setErrors] = useState<{
    companyName?: string
    cnpj?: string
    ie?: string
    phone?: string
    userName?: string
    userEmail?: string
    password?: string
    confirmPassword?: string
  }>({})

  const [touched, setTouched] = useState<{
    companyName?: boolean
    cnpj?: boolean
    ie?: boolean
    phone?: boolean
    userName?: boolean
    userEmail?: boolean
    password?: boolean
    confirmPassword?: boolean
  }>({})

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Validation handlers
  const validateField = (name: string, value: string, extra?: any) => {
    let newErrors = { ...errors }

    switch (name) {
      case 'companyName':
        if (!value.trim()) {
          newErrors.companyName = 'Razão Social ou Nome Fantasia é obrigatório.'
        } else if (value.trim().length < 3) {
          newErrors.companyName = 'Informe pelo menos 3 caracteres.'
        } else {
          delete newErrors.companyName
        }
        break

      case 'cnpj':
        if (!value.trim()) {
          newErrors.cnpj = 'CNPJ da empresa é obrigatório.'
        } else {
          const res = validateCNPJ(value)
          if (!res.isValid) {
            newErrors.cnpj = res.message || 'CNPJ inválido.'
          } else {
            delete newErrors.cnpj
          }
        }
        break

      case 'ie':
        if (value.trim()) {
          const res = validateInscricaoEstadual(value, extra?.uf || uf)
          if (!res.isValid) {
            newErrors.ie = res.message || 'Inscrição Estadual inválida.'
          } else {
            delete newErrors.ie
          }
        } else {
          delete newErrors.ie
        }
        break

      case 'phone':
        if (value.trim()) {
          const res = validatePhone(value, false)
          if (!res.isValid) {
            newErrors.phone = res.message || 'Telefone inválido.'
          } else {
            delete newErrors.phone
          }
        } else {
          delete newErrors.phone
        }
        break

      case 'userName':
        if (!value.trim()) {
          newErrors.userName = 'Nome completo do administrador é obrigatório.'
        } else if (value.trim().length < 3) {
          newErrors.userName = 'Informe ao menos o primeiro e segundo nome.'
        } else {
          delete newErrors.userName
        }
        break

      case 'userEmail':
        if (!value.trim()) {
          newErrors.userEmail = 'E-mail de login é obrigatório.'
        } else {
          const res = validateEmail(value)
          if (!res.isValid) {
            newErrors.userEmail = res.message || 'E-mail inválido.'
          } else {
            delete newErrors.userEmail
          }
        }
        break

      case 'password':
        if (!value) {
          newErrors.password = 'A senha de acesso é obrigatória.'
        } else if (value.length < 8) {
          newErrors.password = 'A senha deve possuir no mínimo 8 caracteres.'
        } else {
          delete newErrors.password
        }
        if (confirmPassword && value !== confirmPassword) {
          newErrors.confirmPassword = 'A confirmação de senha não confere.'
        } else if (confirmPassword && value === confirmPassword) {
          delete newErrors.confirmPassword
        }
        break

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Confirme a sua senha.'
        } else if (value !== password) {
          newErrors.confirmPassword = 'A confirmação de senha não confere com a senha.'
        } else {
          delete newErrors.confirmPassword
        }
        break

      default:
        break
    }

    setErrors(newErrors)
    return newErrors
  }

  // Handle Input Changes with Formatting
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpjMask(e.target.value)
    setCnpj(formatted)
    if (touched.cnpj) {
      validateField('cnpj', formatted)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneMask(e.target.value)
    setPhone(formatted)
    if (touched.phone) {
      validateField('phone', formatted)
    }
  }

  const handleIeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setIe(val)
    if (touched.ie) {
      validateField('ie', val, { uf })
    }
  }

  const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUf = e.target.value as BrazilianUF
    setUf(newUf)
    if (ie && touched.ie) {
      validateField('ie', ie, { uf: newUf })
    }
  }

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    switch (field) {
      case 'companyName':
        validateField('companyName', companyName)
        break
      case 'cnpj':
        validateField('cnpj', cnpj)
        break
      case 'ie':
        validateField('ie', ie, { uf })
        break
      case 'phone':
        validateField('phone', phone)
        break
      case 'userName':
        validateField('userName', userName)
        break
      case 'userEmail':
        validateField('userEmail', userEmail)
        break
      case 'password':
        validateField('password', password)
        break
      case 'confirmPassword':
        validateField('confirmPassword', confirmPassword)
        break
    }
  }

  // Submit Step 1
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    // Mark all Step 1 fields as touched
    setTouched((prev) => ({
      ...prev,
      companyName: true,
      cnpj: true,
      ie: true,
      phone: true,
    }))

    const step1Errors: typeof errors = {}

    if (!companyName.trim()) {
      step1Errors.companyName = 'Razão Social ou Nome Fantasia é obrigatório.'
    } else if (companyName.trim().length < 3) {
      step1Errors.companyName = 'Informe pelo menos 3 caracteres.'
    }

    if (!cnpj.trim()) {
      step1Errors.cnpj = 'CNPJ da empresa é obrigatório.'
    } else {
      const cnpjRes = validateCNPJ(cnpj)
      if (!cnpjRes.isValid) {
        step1Errors.cnpj = cnpjRes.message || 'CNPJ inválido.'
      }
    }

    if (ie.trim()) {
      const ieRes = validateInscricaoEstadual(ie, uf)
      if (!ieRes.isValid) {
        step1Errors.ie = ieRes.message || 'Inscrição Estadual inválida para a UF selecionada.'
      }
    }

    if (phone.trim()) {
      const phoneRes = validatePhone(phone, false)
      if (!phoneRes.isValid) {
        step1Errors.phone = phoneRes.message || 'Telefone inválido.'
      }
    }

    setErrors((prev) => ({ ...prev, ...step1Errors }))

    if (Object.keys(step1Errors).length > 0) {
      setErrorMsg('Por favor, corrija os erros destacados no formulário antes de prosseguir.')
      return
    }

    setErrorMsg('')
    setStep(2)
  }

  // Submit Step 2
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    // Mark all Step 2 fields as touched
    setTouched((prev) => ({
      ...prev,
      userName: true,
      userEmail: true,
      password: true,
      confirmPassword: true,
    }))

    const step2Errors: typeof errors = {}

    if (!userName.trim()) {
      step2Errors.userName = 'Nome completo do administrador é obrigatório.'
    } else if (userName.trim().length < 3) {
      step2Errors.userName = 'Informe pelo menos 3 caracteres.'
    }

    if (!userEmail.trim()) {
      step2Errors.userEmail = 'E-mail de login é obrigatório.'
    } else {
      const emailRes = validateEmail(userEmail)
      if (!emailRes.isValid) {
        step2Errors.userEmail = emailRes.message || 'E-mail inválido.'
      }
    }

    if (!password) {
      step2Errors.password = 'A senha de acesso é obrigatória.'
    } else if (password.length < 8) {
      step2Errors.password = 'A senha deve possuir no mínimo 8 caracteres.'
    }

    if (!confirmPassword) {
      step2Errors.confirmPassword = 'Confirme a sua senha.'
    } else if (password !== confirmPassword) {
      step2Errors.confirmPassword = 'A confirmação de senha não confere com a senha informada.'
    }

    setErrors((prev) => ({ ...prev, ...step2Errors }))

    if (Object.keys(step2Errors).length > 0) {
      setErrorMsg('Por favor, corrija os erros destacados nas credenciais de acesso.')
      return
    }

    setLoading(true)

    try {
      await registerTenantAndUser(
        {
          name: companyName.trim(),
          cnpj: cnpj.trim(),
          ie: ie.trim(),
          phone: phone.trim(),
          plan: selectedPlan,
        },
        {
          name: userName.trim(),
          email: userEmail.trim().toLowerCase(),
          pass: password,
        },
      )

      toast({
        title: 'Cadastro concluído com sucesso!',
        description: 'Sua empresa e usuário administrador foram criados no Hub de Vendas.',
      })

      navigate('/dashboard')
    } catch (err: any) {
      console.error('Registration error:', err)
      setErrorMsg(
        err?.message ||
          'Erro ao processar o cadastro. Verifique se o e-mail já existe ou os dados preenchidos.',
      )
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
          <button
            type="button"
            onClick={() => step === 2 && setStep(1)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              step === 1
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer'
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                step === 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}
            >
              1
            </span>
            <span>Dados da Empresa</span>
          </button>

          <div className="w-6 h-[1px] bg-slate-700" />

          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              step === 2
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                step === 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-500'
              }`}
            >
              2
            </span>
            <span>Seu Acesso</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} noValidate className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    1. Dados da Empresa (Tenant)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Identificação fiscal para emissão de notas fiscais e gestão de canais
                  </p>
                </div>
              </div>

              {/* Razão Social */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Razão Social / Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value)
                    if (touched.companyName) validateField('companyName', e.target.value)
                  }}
                  onBlur={() => handleBlur('companyName')}
                  placeholder="Ex: Minha Loja Comércio Digital Ltda"
                  className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                    touched.companyName && errors.companyName
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {touched.companyName && errors.companyName && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.companyName}</span>
                  </p>
                )}
              </div>

              {/* Plano & Telefone */}
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
                    Telefone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      onBlur={() => handleBlur('phone')}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                        touched.phone && errors.phone
                          ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {touched.phone && errors.phone && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                  {!errors.phone && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Fixo ou celular com DDD (ex: 11 98765-4321)
                    </p>
                  )}
                </div>
              </div>

              {/* CNPJ */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    CNPJ da Empresa *
                  </label>
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Suporta numérico e alfanumérico (Receita Federal)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={cnpj}
                  onChange={handleCnpjChange}
                  onBlur={() => handleBlur('cnpj')}
                  placeholder="00.000.000/0001-00 ou 12.ABC.345/0001-90"
                  maxLength={18}
                  className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 font-mono text-slate-900 transition-colors uppercase ${
                    touched.cnpj && errors.cnpj
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {touched.cnpj && errors.cnpj ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.cnpj}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Aceita 14 dígitos numéricos ou novo padrão alfanumérico com validação de dígitos
                    verificadores.
                  </p>
                )}
              </div>

              {/* Inscrição Estadual (IE) + UF */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    UF da IE
                  </label>
                  <select
                    value={uf}
                    onChange={handleUfChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                  >
                    {BRAZILIAN_UFS.map((item) => (
                      <option key={item.uf} value={item.uf}>
                        {item.uf} - {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Inscrição Estadual (IE)
                    </label>
                    <span className="text-[11px] text-slate-400">Opcional / ISENTO</span>
                  </div>
                  <input
                    type="text"
                    value={ie}
                    onChange={handleIeChange}
                    onBlur={() => handleBlur('ie')}
                    placeholder="Ex: 123456789012 ou ISENTO"
                    className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 font-mono text-slate-900 transition-colors uppercase ${
                      touched.ie && errors.ie
                        ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {touched.ie && errors.ie ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.ie}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Validado conforme regras da SEFAZ para o estado de {uf || 'origem'}.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-600/20 transition-all"
                >
                  <span>Avançar para dados de acesso</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} noValidate className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    2. Seu Acesso de Administrador
                  </h2>
                  <p className="text-xs text-slate-500">
                    Credenciais de login para gerenciar a conta da empresa
                  </p>
                </div>
              </div>

              {/* Nome do Administrador */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value)
                      if (touched.userName) validateField('userName', e.target.value)
                    }}
                    onBlur={() => handleBlur('userName')}
                    placeholder="Ex: João da Silva"
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                      touched.userName && errors.userName
                        ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {touched.userName && errors.userName && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.userName}</span>
                  </p>
                )}
              </div>

              {/* E-mail de Login */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail de Login *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value)
                      if (touched.userEmail) validateField('userEmail', e.target.value)
                    }}
                    onBlur={() => handleBlur('userEmail')}
                    placeholder="admin@empresa.com.br"
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                      touched.userEmail && errors.userEmail
                        ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {touched.userEmail && errors.userEmail ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.userEmail}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Será seu e-mail de acesso principal para emissão de notas e painel.
                  </p>
                )}
              </div>

              {/* Senha e Confirmação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Senha (mín. 8 chars) *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (touched.password) validateField('password', e.target.value)
                      }}
                      onBlur={() => handleBlur('password')}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                        touched.password && errors.password
                          ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {touched.password && errors.password && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (touched.confirmPassword)
                          validateField('confirmPassword', e.target.value)
                      }}
                      onBlur={() => handleBlur('confirmPassword')}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                        touched.confirmPassword && errors.confirmPassword
                          ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-10 px-4 border-slate-200 text-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-600/20 transition-all"
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
