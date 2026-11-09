import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('saas-demo-token'))
  const [loading, setLoading] = useState(true)

  const fetchUser = async (authToken) => {
    if (!authToken) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
    } catch (error) {
      localStorage.removeItem('saas-demo-token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser(token)
  }, [token])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('saas-demo-token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('saas-demo-token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout failed', error)
    }
    localStorage.removeItem('saas-demo-token')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, setUser }),
    [user, token, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
