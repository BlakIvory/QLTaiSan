import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'

interface User {
  id: number
  name: string
  email: string
  phone?: string
  employee_code?: string
  avatar?: string
  is_active: boolean
  last_login_at?: string
  organization?: { id: number; name: string; type: string } | null
  roles: string[]
  permissions: string[]
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setIsLoading(false)
      return
    }
    try {
      const res = await api.get(API_ENDPOINTS.AUTH.ME)
      setUser(res.data.data)
    } catch {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password })
    const { token: newToken, user: newUser } = res.data.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT)
    } finally {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    }
  }, [])

  const hasPermission = useCallback(
    (permission: string) => user?.permissions?.includes(permission) ?? false,
    [user]
  )

  const hasRole = useCallback(
    (role: string) => user?.roles?.includes(role) ?? false,
    [user]
  )

  const hasAnyRole = useCallback(
    (roles: string[]) => roles.some(r => user?.roles?.includes(r)) ?? false,
    [user]
  )

  const refreshUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      login, logout,
      hasPermission, hasRole, hasAnyRole,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
