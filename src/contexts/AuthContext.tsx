import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { TenantRecord, UserRecord } from '@/types'

interface AuthContextType {
  user: UserRecord | null
  tenant: TenantRecord | null
  tenantsList: TenantRecord[]
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  registerTenantAndUser: (
    companyData: {
      name: string
      cnpj: string
      ie: string
      phone?: string
      plan?: string
      billingCycle?: 'monthly' | 'annual'
      cardToken?: string
      cardHolderName?: string
      cardLast4?: string
      cardBrand?: string
    },
    userData: { name: string; email: string; pass: string },
  ) => Promise<void>
  refreshAuth: () => Promise<void>
  switchTenant: (tenantId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(null)
  const [tenant, setTenant] = useState<TenantRecord | null>(null)
  const [tenantsList, setTenantsList] = useState<TenantRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTenant = useCallback(async (tenantId?: string) => {
    if (!tenantId) {
      setTenant(null)
      return
    }
    try {
      const record = await pb.collection('tenants').getOne<TenantRecord>(tenantId)
      setTenant(record)
    } catch (_) {
      setTenant(null)
    }
  }, [])

  const loadTenantsList = useCallback(async () => {
    try {
      const records = await pb.collection('tenants').getFullList<TenantRecord>({
        sort: 'name',
      })
      setTenantsList(records)
    } catch (_) {
      setTenantsList([])
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      if (pb.authStore.isValid && pb.authStore.model) {
        const authModel = pb.authStore.model as unknown as UserRecord
        setUser(authModel)
        if (authModel.tenant) {
          await loadTenant(authModel.tenant)
        }
        await loadTenantsList()
      } else {
        setUser(null)
        setTenant(null)
        setTenantsList([])
      }
    } catch (_) {
      setUser(null)
      setTenant(null)
    } finally {
      setIsLoading(false)
    }
  }, [loadTenant, loadTenantsList])

  useEffect(() => {
    refreshAuth()
    const unsubscribe = pb.authStore.onChange(() => {
      refreshAuth()
    })
    return () => {
      unsubscribe()
    }
  }, [refreshAuth])

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email, pass)
    await refreshAuth()
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setTenant(null)
    setTenantsList([])
  }

  const registerTenantAndUser = async (
    companyData: {
      name: string
      cnpj: string
      ie: string
      phone?: string
      plan?: string
      billingCycle?: 'monthly' | 'annual'
      cardToken?: string
      cardHolderName?: string
      cardLast4?: string
      cardBrand?: string
    },
    userData: { name: string; email: string; pass: string },
  ) => {
    const plan = companyData.plan || 'gratis'
    const isFree = plan === 'gratis'
    const now = new Date()
    const trialEnds = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const nextBillingDateIso = trialEnds.toISOString().replace('T', ' ').slice(0, 19)

    // 1. Create Tenant first
    const newTenant = await pb.collection('tenants').create<TenantRecord>({
      name: companyData.name,
      cnpj: companyData.cnpj,
      ie: companyData.ie,
      phone: companyData.phone || '',
      email: userData.email,
      plan: plan as any,
      billing_cycle: companyData.billingCycle || 'monthly',
      subscription_status: isFree ? 'free' : 'trial',
      trial_ends_at: isFree ? undefined : nextBillingDateIso,
      next_billing_date: isFree ? undefined : nextBillingDateIso,
      card_last4: companyData.cardLast4 || (isFree ? undefined : '4242'),
      card_brand: companyData.cardBrand || (isFree ? undefined : 'visa'),
      card_holder_name: companyData.cardHolderName || userData.name,
    })

    // 2. Create User linked to Tenant
    await pb.collection('users').create({
      email: userData.email,
      password: userData.pass,
      passwordConfirm: userData.pass,
      name: userData.name,
      tenant: newTenant.id,
      role: 'admin',
    })

    // 3. Create initial NF-e settings for tenant
    try {
      await pb.collection('nfe_settings').create({
        tenant: newTenant.id,
        provider: 'nuvem_fiscal',
        environment: 'homologacao',
        series: '1',
      })
    } catch {
      /* intentionally ignored */
    }

    // 4. Authenticate user
    await pb.collection('users').authWithPassword(userData.email, userData.pass)

    // 5. Call Mercado Pago subscribe hook if paid plan
    if (!isFree) {
      try {
        const { billingService } = await import('@/services/api')
        await billingService.subscribe({
          tenantId: newTenant.id,
          plan: plan,
          billingCycle: companyData.billingCycle || 'monthly',
          email: userData.email,
          cardToken: companyData.cardToken || 'tok_demo_4242',
          cardHolderName: companyData.cardHolderName || userData.name,
          cardLast4: companyData.cardLast4 || '4242',
          cardBrand: companyData.cardBrand || 'visa',
        })
      } catch (e) {
        console.warn('Subscription registration notification note:', e)
      }
    }

    await refreshAuth()
  }

  const switchTenant = async (tenantId: string) => {
    if (!user) return
    try {
      await pb.collection('users').update(user.id, { tenant: tenantId })
      await pb.collection('users').authRefresh()
      await refreshAuth()
    } catch (err) {
      console.error('Erro ao trocar de empresa', err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        tenantsList,
        isLoading,
        login,
        logout,
        registerTenantAndUser,
        refreshAuth,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
