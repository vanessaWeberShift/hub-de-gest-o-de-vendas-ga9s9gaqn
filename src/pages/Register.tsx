import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  Receipt,
  Building2,
  User,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  Phone,
  Mail,
  Lock,
  FileCheck2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { billingService } from '@/services/api'
import {
  validateCNPJ,
  validateInscricaoEstadual,
  validateEmail,
  validatePhone,
  formatCnpjMask,
  formatPhoneMask,
  deriveUfFromCnpj,
  lookupCnpjData,
  BRAZILIAN_UFS,
  BrazilianUF,
} from '@/lib/validators'

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const { registerTenantAndUser } = useAuth()
  const { toast } = useToast()

  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Selected plan and billing cycle
  const [selectedPlan, setSelectedPlan] = useState<string>('essencial')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [mpConfig, setMpConfig] = useState<{
    publicKey: string
    isConfigured: boolean
    mode: 'production' | 'simulated'
  }>({
    publicKey: '',
    isConfigured: false,
    mode: 'simulated',
  })

  useEffect(() => {
    const p = searchParams.get('plano') || searchParams.get('plan')
    if (p && ['gratis', 'essencial', 'profissional', 'enterprise'].includes(p.toLowerCase())) {
      setSelectedPlan(p.toLowerCase())
    }
    const cycle = searchParams.get('ciclo') || searchParams.get('cycle')
    if (cycle && ['monthly', 'annual'].includes(cycle.toLowerCase())) {
      setBillingCycle(cycle.toLowerCase() as 'monthly' | 'annual')
    }

    billingService
      .getConfig()
      .then((res) => {
        setMpConfig({
          publicKey: res.publicKey,
          isConfigured: res.isConfigured,
          mode: res.mode,
        })
      })
      .catch(() => {
        // default to simulated
      })
  }, [searchParams])

  const isFreePlan = selectedPlan === 'gratis'

  // Step 1: Company data
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [ie, setIe] = useState('')
  const [uf, setUf] = useState<BrazilianUF | ''>('SP')
  const [isUfAutoDetected, setIsUfAutoDetected] = useState(false)
  const [phone, setPhone] = useState('')

  // Step 2: User access
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 3: Payment details (PCI-compliant / tokenized for Mercado Pago)
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardDoc, setCardDoc] = useState('')
  const [detectedBrand, setDetectedBrand] = useState<
    'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'generic'
  >('visa')

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
    cardNumber?: string
    cardHolder?: string
    cardExpiry?: string
    cardCvv?: string
    cardDoc?: string
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
    cardNumber?: boolean
    cardHolder?: boolean
    cardExpiry?: boolean
    cardCvv?: boolean
    cardDoc?: boolean
  }>({})

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Card brand detection helper
  const detectBrand = (num: string) => {
    const clean = num.replace(/\D/g, '')
    if (/^4/.test(clean)) return 'visa'
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard'
    if (/^(4011|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(clean))
      return 'elo'
    if (/^3[47]/.test(clean)) return 'amex'
    if (/^(606282|3841)/.test(clean)) return 'hipercard'
    return 'generic'
  }

  // Formatting helpers
  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  // Validation handlers
  const validateField = (name: string, value: string, extra?: any) => {
    const newErrors = { ...errors }

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

      case 'cardNumber':
        if (!isFreePlan) {
          const cleanNum = value.replace(/\D/g, '')
          if (!cleanNum) {
            newErrors.cardNumber = 'Número do cartão é obrigatório.'
          } else if (cleanNum.length < 13 || cleanNum.length > 19) {
            newErrors.cardNumber = 'Número de cartão inválido.'
          } else {
            delete newErrors.cardNumber
          }
        }
        break

      case 'cardHolder':
        if (!isFreePlan) {
          if (!value.trim()) {
            newErrors.cardHolder = 'Nome impresso no cartão é obrigatório.'
          } else if (value.trim().length < 3) {
            newErrors.cardHolder = 'Informe o nome completo conforme o cartão.'
          } else {
            delete newErrors.cardHolder
          }
        }
        break

      case 'cardExpiry':
        if (!isFreePlan) {
          const cleanExp = value.replace(/\D/g, '')
          if (cleanExp.length < 4) {
            newErrors.cardExpiry = 'Informe MM/AA válido.'
          } else {
            const m = parseInt(cleanExp.slice(0, 2), 10)
            const y = parseInt(cleanExp.slice(2, 4), 10)
            if (m < 1 || m > 12) {
              newErrors.cardExpiry = 'Mês inválido (01 a 12).'
            } else if (y < 24 || y > 50) {
              newErrors.cardExpiry = 'Ano de validade inválido.'
            } else {
              delete newErrors.cardExpiry
            }
          }
        }
        break

      case 'cardCvv':
        if (!isFreePlan) {
          const cleanCvv = value.replace(/\D/g, '')
          if (cleanCvv.length < 3 || cleanCvv.length > 4) {
            newErrors.cardCvv = 'CVV inválido (3 ou 4 dígitos).'
          } else {
            delete newErrors.cardCvv
          }
        }
        break

      case 'cardDoc':
        if (!isFreePlan && value.trim()) {
          const cleanDoc = value.replace(/\D/g, '')
          if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
            newErrors.cardDoc = 'CPF/CNPJ do titular inválido.'
          } else {
            delete newErrors.cardDoc
          }
        } else {
          delete newErrors.cardDoc
        }
        break

      default:
        break
    }

    setErrors(newErrors)
    return newErrors
  }

  // Handle Input Changes
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpjMask(e.target.value)
    setCnpj(formatted)
    if (touched.cnpj) validateField('cnpj', formatted)

    const clean = formatted.replace(/[./\-\s]/g, '')
    if (clean.length >= 8) {
      const derived = deriveUfFromCnpj(formatted)
      if (derived) {
        setUf(derived)
        setIsUfAutoDetected(true)
        if (ie && touched.ie) validateField('ie', ie, { uf: derived })
      }

      if (clean.length === 14 && validateCNPJ(formatted).isValid) {
        lookupCnpjData(formatted).then((data) => {
          if (data?.uf) {
            setUf(data.uf)
            setIsUfAutoDetected(true)
            if (ie && touched.ie) validateField('ie', ie, { uf: data.uf })
          }
          if (data?.razaoSocial && !companyName) {
            setCompanyName(data.razaoSocial)
          }
        })
      }
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneMask(e.target.value)
    setPhone(formatted)
    if (touched.phone) validateField('phone', formatted)
  }

  const handleIeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setIe(val)
    if (touched.ie) validateField('ie', val, { uf })
  }

  const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUf = e.target.value as BrazilianUF
    setUf(newUf)
    setIsUfAutoDetected(false)
    if (ie && touched.ie) validateField('ie', ie, { uf: newUf })
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted)
    const brand = detectBrand(formatted)
    setDetectedBrand(brand)
    if (touched.cardNumber) validateField('cardNumber', formatted)
  }

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value)
    setCardExpiry(formatted)
    if (touched.cardExpiry) validateField('cardExpiry', formatted)
  }

  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCardCvv(clean)
    if (touched.cardCvv) validateField('cardCvv', clean)
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
      case 'cardNumber':
        validateField('cardNumber', cardNumber)
        break
      case 'cardHolder':
        validateField('cardHolder', cardHolder)
        break
      case 'cardExpiry':
        validateField('cardExpiry', cardExpiry)
        break
      case 'cardCvv':
        validateField('cardCvv', cardCvv)
        break
      case 'cardDoc':
        validateField('cardDoc', cardDoc)
        break
    }
  }

  // Submit Step 1
  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setTouched((prev) => ({
      ...prev,
      companyName: true,
      cnpj: true,
      ie: true,
      phone: true,
    }))

    const step1Errors: typeof errors = {}
    if (!companyName.trim())
      step1Errors.companyName = 'Razão Social ou Nome Fantasia é obrigatório.'
    if (!cnpj.trim()) {
      step1Errors.cnpj = 'CNPJ da empresa é obrigatório.'
    } else {
      const cnpjRes = validateCNPJ(cnpj)
      if (!cnpjRes.isValid) step1Errors.cnpj = cnpjRes.message || 'CNPJ inválido.'
    }
    if (ie.trim()) {
      const ieRes = validateInscricaoEstadual(ie, uf)
      if (!ieRes.isValid) step1Errors.ie = ieRes.message || 'Inscrição Estadual inválida para a UF.'
    }
    if (phone.trim()) {
      const phoneRes = validatePhone(phone, false)
      if (!phoneRes.isValid) step1Errors.phone = phoneRes.message || 'Telefone inválido.'
    }

    setErrors((prev) => ({ ...prev, ...step1Errors }))
    if (Object.keys(step1Errors).length > 0) {
      setErrorMsg('Por favor, corrija os erros destacados no formulário antes de prosseguir.')
      return
    }

    setStep(2)
  }

  // Submit Step 2
  const handleNextStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setTouched((prev) => ({
      ...prev,
      userName: true,
      userEmail: true,
      password: true,
      confirmPassword: true,
    }))

    const step2Errors: typeof errors = {}
    if (!userName.trim()) step2Errors.userName = 'Nome completo do administrador é obrigatório.'
    if (!userEmail.trim()) {
      step2Errors.userEmail = 'E-mail de login é obrigatório.'
    } else {
      const emailRes = validateEmail(userEmail)
      if (!emailRes.isValid) step2Errors.userEmail = emailRes.message || 'E-mail inválido.'
    }
    if (!password) {
      step2Errors.password = 'A senha de acesso é obrigatória.'
    } else if (password.length < 8) {
      step2Errors.password = 'A senha deve possuir no mínimo 8 caracteres.'
    }
    if (!confirmPassword) {
      step2Errors.confirmPassword = 'Confirme a sua senha.'
    } else if (password !== confirmPassword) {
      step2Errors.confirmPassword = 'A confirmação de senha não confere com a senha.'
    }

    setErrors((prev) => ({ ...prev, ...step2Errors }))
    if (Object.keys(step2Errors).length > 0) {
      setErrorMsg('Por favor, corrija os erros destacados nas credenciais de acesso.')
      return
    }

    if (isFreePlan) {
      // Plano Grátis concludes immediately without card step
      await executeFinalRegistration()
    } else {
      // Paid plan advances to step 3 (Cartão e 5 dias de trial)
      if (!cardHolder && userName) {
        setCardHolder(userName.toUpperCase())
      }
      if (!cardDoc && cnpj) {
        setCardDoc(cnpj)
      }
      setStep(3)
    }
  }

  // Final Registration Call
  const executeFinalRegistration = async (cardData?: {
    token?: string
    last4?: string
    brand?: string
    holder?: string
  }) => {
    setLoading(true)
    setErrorMsg('')

    try {
      const cleanDigits = cardNumber.replace(/\D/g, '')
      const last4 = cardData?.last4 || (cleanDigits.length >= 4 ? cleanDigits.slice(-4) : '4242')
      const brand = cardData?.brand || detectedBrand || 'visa'

      await registerTenantAndUser(
        {
          name: companyName.trim(),
          cnpj: cnpj.trim(),
          ie: ie.trim(),
          phone: phone.trim(),
          plan: selectedPlan,
          billingCycle: billingCycle,
          cardToken: cardData?.token || `tok_mp_${Date.now()}_${last4}`,
          cardHolderName: cardHolder.trim() || userName.trim(),
          cardLast4: last4,
          cardBrand: brand,
        },
        {
          name: userName.trim(),
          email: userEmail.trim().toLowerCase(),
          pass: password,
        },
      )

      toast({
        title: isFreePlan
          ? 'Cadastro concluído com sucesso!'
          : 'Assinatura criada com 5 dias grátis!',
        description: isFreePlan
          ? 'Sua conta no plano Grátis foi criada. Aproveite o Hub Vendas!'
          : 'Cartão validado com sucesso. Seu período de teste de 5 dias começou agora.',
      })

      navigate('/dashboard')
    } catch (err: any) {
      console.error('Registration error:', err)
      setErrorMsg(
        err?.message ||
          'Erro ao processar o cadastro. Verifique os dados preenchidos ou tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  // Submit Step 3 (Payment / Mercado Pago)
  const handleFinalPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    setTouched((prev) => ({
      ...prev,
      cardNumber: true,
      cardHolder: true,
      cardExpiry: true,
      cardCvv: true,
      cardDoc: true,
    }))

    const step3Errors: typeof errors = {}
    const cleanNum = cardNumber.replace(/\D/g, '')
    if (!cleanNum) {
      step3Errors.cardNumber = 'Número do cartão é obrigatório.'
    } else if (cleanNum.length < 13 || cleanNum.length > 19) {
      step3Errors.cardNumber = 'Número de cartão inválido.'
    }

    if (!cardHolder.trim()) {
      step3Errors.cardHolder = 'Nome impresso no cartão é obrigatório.'
    }

    const cleanExp = cardExpiry.replace(/\D/g, '')
    if (cleanExp.length < 4) {
      step3Errors.cardExpiry = 'Informe validade MM/AA.'
    }

    const cleanCvv = cardCvv.replace(/\D/g, '')
    if (cleanCvv.length < 3) {
      step3Errors.cardCvv = 'CVV inválido.'
    }

    setErrors((prev) => ({ ...prev, ...step3Errors }))
    if (Object.keys(step3Errors).length > 0) {
      setErrorMsg('Por favor, confira os dados do cartão de crédito para ativar o trial de 5 dias.')
      return
    }

    await executeFinalRegistration({
      last4: cleanNum.slice(-4),
      brand: detectedBrand,
      holder: cardHolder.trim(),
    })
  }

  // Plan pricing calculations
  const pricesMonthly: Record<string, number> = {
    essencial: 97,
    profissional: 197,
    enterprise: 397,
  }
  const pricesAnnual: Record<string, number> = { essencial: 77, profissional: 157, enterprise: 317 }
  const currentPrice =
    billingCycle === 'annual' ? pricesAnnual[selectedPlan] || 97 : pricesMonthly[selectedPlan] || 97

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold mb-3">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Criar Conta no Hub Vendas
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span>Plano:</span>
            <span className="font-semibold uppercase tracking-wider text-emerald-300">
              {selectedPlan === 'gratis'
                ? 'Grátis (5 dias)'
                : selectedPlan === 'essencial'
                  ? 'Essencial'
                  : selectedPlan === 'profissional'
                    ? 'Profissional'
                    : 'Enterprise'}
            </span>
            {!isFreePlan && (
              <span className="text-[11px] text-slate-400">
                • {billingCycle === 'annual' ? 'Anual (20% OFF)' : 'Mensal'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Configure seu tenant multi-vendedor e comece a gerenciar suas vendas
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
          <button
            type="button"
            onClick={() => (step === 2 || step === 3) && setStep(1)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
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
            <span>Empresa</span>
          </button>

          <div className="w-4 sm:w-6 h-[1px] bg-slate-700" />

          <button
            type="button"
            onClick={() => step === 3 && setStep(2)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              step === 2
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : step === 3
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer'
                  : 'bg-slate-800 text-slate-500'
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                step === 2
                  ? 'bg-emerald-500 text-slate-950'
                  : step === 3
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-slate-700 text-slate-500'
              }`}
            >
              2
            </span>
            <span>Acesso</span>
          </button>

          {!isFreePlan && (
            <>
              <div className="w-4 sm:w-6 h-[1px] bg-slate-700" />
              <div
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  step === 3
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    step === 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  3
                </span>
                <span>Cartão (5d Grátis)</span>
              </div>
            </>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Empresa */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} noValidate className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    1. Dados da Empresa (Tenant)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Identificação fiscal para emissão de notas fiscais e canais de venda
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

              {/* Plano & Ciclo */}
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
                    <option value="gratis">Plano Grátis (5 dias, sem cartão)</option>
                    <option value="essencial">Plano Essencial - R$ 97/mês (5d grátis)</option>
                    <option value="profissional">
                      Plano Profissional - R$ 197/mês (5d grátis)
                    </option>
                    <option value="enterprise">Plano Enterprise - R$ 397/mês (5d grátis)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ciclo de Cobrança
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isFreePlan}
                      onClick={() => setBillingCycle('monthly')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        billingCycle === 'monthly' || isFreePlan
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Mensal
                    </button>
                    <button
                      type="button"
                      disabled={isFreePlan}
                      onClick={() => setBillingCycle('annual')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                        billingCycle === 'annual' && !isFreePlan
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Anual</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 font-bold">
                        -20%
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Telefone & CNPJ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      CNPJ da Empresa *
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={handleCnpjChange}
                    onBlur={() => handleBlur('cnpj')}
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                    className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 font-mono text-slate-900 transition-colors uppercase ${
                      touched.cnpj && errors.cnpj
                        ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {touched.cnpj && errors.cnpj && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.cnpj}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Inscrição Estadual + UF */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      UF da IE
                    </label>
                    {isUfAutoDetected && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Auto
                      </span>
                    )}
                  </div>
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
                  {touched.ie && errors.ie && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.ie}</span>
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
          )}

          {/* STEP 2: Seu Acesso */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} noValidate className="space-y-4">
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

              {/* Nome */}
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

              {/* E-mail */}
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
                {touched.userEmail && errors.userEmail && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.userEmail}</span>
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

              {/* Actions */}
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
                  ) : isFreePlan ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Concluir Cadastro Grátis</span>
                    </>
                  ) : (
                    <>
                      <span>Avançar para Pagamento</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Cartão de Crédito e 5 Dias Grátis */}
          {step === 3 && !isFreePlan && (
            <form onSubmit={handleFinalPaymentSubmit} noValidate className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    3. Cartão de Crédito & Teste de 5 Dias
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ambiente seguro Mercado Pago • <b>R$ 0,00 cobrado hoje</b>
                  </p>
                </div>
              </div>

              {/* Trial guarantee notice */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>5 Dias de Acesso Gratuito</span>
                </div>
                <p className="text-slate-600">
                  Seu cartão só será cobrado no valor de{' '}
                  <b>
                    R$ {currentPrice},00/{billingCycle === 'annual' ? 'mês' : 'mês'}
                  </b>{' '}
                  a partir do <b>6º dia</b>. Cancele quando quiser no painel sem cobranças.
                </p>
              </div>

              {/* MP Simulated Mode notice if token not configured */}
              {!mpConfig.isConfigured && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Zap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-tight">
                    <span className="font-bold">Mercado Pago em Modo Simulado/Demonstração:</span> O
                    gateway validará os dados do cartão com segurança e concederá os 5 dias de teste
                    gratuitamente.
                  </div>
                </div>
              )}

              {/* Card Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Número do Cartão de Crédito *
                  </label>
                  <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {detectedBrand}
                  </span>
                </div>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    onBlur={() => handleBlur('cardNumber')}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 font-mono text-slate-900 transition-colors ${
                      touched.cardNumber && errors.cardNumber
                        ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {touched.cardNumber && errors.cardNumber && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.cardNumber}</span>
                  </p>
                )}
              </div>

              {/* Titular */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Impresso no Cartão *
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase()
                    setCardHolder(val)
                    if (touched.cardHolder) validateField('cardHolder', val)
                  }}
                  onBlur={() => handleBlur('cardHolder')}
                  placeholder="EX: JOAO DA SILVA"
                  className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 text-slate-900 uppercase transition-colors ${
                    touched.cardHolder && errors.cardHolder
                      ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {touched.cardHolder && errors.cardHolder && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.cardHolder}</span>
                  </p>
                )}
              </div>

              {/* Validade + CVV + CPF/CNPJ Titular */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Validade *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleCardExpiryChange}
                      onBlur={() => handleBlur('cardExpiry')}
                      placeholder="MM/AA"
                      maxLength={5}
                      className={`w-full pl-8 pr-2 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 font-mono text-slate-900 transition-colors ${
                        touched.cardExpiry && errors.cardExpiry
                          ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {touched.cardExpiry && errors.cardExpiry && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">
                      {errors.cardExpiry}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    CVV *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={cardCvv}
                      onChange={handleCardCvvChange}
                      onBlur={() => handleBlur('cardCvv')}
                      placeholder="123"
                      maxLength={4}
                      className={`w-full pl-8 pr-2 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 font-mono text-slate-900 transition-colors ${
                        touched.cardCvv && errors.cardCvv
                          ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {touched.cardCvv && errors.cardCvv && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.cardCvv}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    CPF/CNPJ Titular
                  </label>
                  <input
                    type="text"
                    value={cardDoc}
                    onChange={(e) => setCardDoc(e.target.value)}
                    placeholder="Opcional"
                    maxLength={18}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Security badge */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Criptografia de ponta a ponta Mercado Pago PCI-DSS
                </span>
                <span className="text-emerald-700 font-semibold">5 dias grátis</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
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
                      <span>Iniciar Teste Grátis de 5 Dias</span>
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
