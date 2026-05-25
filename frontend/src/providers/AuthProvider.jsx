import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setToken, removeToken, clearTokens, getToken, setRememberFlag } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = getToken('access_token')
    if (token) {
      api.get('/auth/me/')
        .then((res) => setUser(res.data))
        .catch(() => {
          clearTokens()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (login, password, rememberMe = false) => {
    const { data } = await api.post('/auth/login/', { login, password })
    if (data.requires_2fa || data.requires_access_code) {
      return { ...data, rememberMe }
    }
    setToken('access_token', data.tokens.access, rememberMe)
    setToken('refresh_token', data.tokens.refresh, rememberMe)
    setRememberFlag(rememberMe)
    setUser(data.user)
    return data
  }

  const verifyLogin = async (email, code) => {
    const { data } = await api.post('/auth/verify-login/', { email, code })
    const remembered = !!localStorage.getItem('refresh_token')
    setToken('access_token', data.tokens.access, remembered)
    setToken('refresh_token', data.tokens.refresh, remembered)
    setUser(data.user)
    return data
  }

  const verifyAccessCode = async (email, code) => {
    const { data } = await api.post('/auth/verify-access-code/', { email, code })
    if (data.requires_2fa) {
      return data
    }
    const remembered = !!localStorage.getItem('refresh_token')
    setToken('access_token', data.tokens.access, remembered)
    setToken('refresh_token', data.tokens.refresh, remembered)
    setUser(data.user)
    return data
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register/', payload)
    if (data.tokens) {
      setToken('access_token', data.tokens.access, true)
      setToken('refresh_token', data.tokens.refresh, true)
      setUser(data.user)
    }
    return data
  }

  const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google/', { credential })
    setToken('access_token', data.tokens.access, true)
    setToken('refresh_token', data.tokens.refresh, true)
    setUser(data.user)
    return data
  }

  const setupTotp = async () => {
    const { data } = await api.post('/auth/2fa/setup/')
    return data
  }

  const verifyTotp = async (code) => {
    const { data } = await api.post('/auth/2fa/verify/', { code })
    setUser((prev) => ({ ...prev, totp_enabled: true }))
    return data
  }

  const disableTotp = async (code) => {
    const { data } = await api.post('/auth/2fa/disable/', { code })
    setUser((prev) => ({ ...prev, totp_enabled: false }))
    return data
  }

  const setUsername = async (username) => {
    const { data } = await api.post('/auth/set-username/', { username })
    setUser((prev) => ({ ...prev, ...data }))
  }

  const logout = () => {
    clearTokens()
    setRememberFlag(false)
    document.cookie = 'shop_active=; path=/; domain=localhost; max-age=0; SameSite=Lax'
    setUser(null)
    navigate('/login')
  }

  const updateUser = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }))
  }

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me/')
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyLogin, verifyAccessCode, register, googleLogin, setUsername, logout, updateUser, refreshUser, setupTotp, verifyTotp, disableTotp }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
