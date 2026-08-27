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
    companyData: { name: string; cnpj: string; ie: string; plan?: string },
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
    companyData: { name: string; cnpj: string; ie: string; plan?: string },
    userData: { name: string; email: string; pass: string },
  ) => {
    // 1. Create Tenant first
    const newTenant = await pb.collection('tenants').create<TenantRecord>({
      name: companyData.name,
      cnpj: companyData.cnpj,
      ie: companyData.ie,
      email: userData.email,
      plan: (companyData.plan as any) || 'gratis',
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
