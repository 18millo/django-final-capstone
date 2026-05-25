import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../api'

const AuthContext = createContext(null)

const COOKIE_NAME = 'shop_active'

function setShopCookie() {
  document.cookie = `${COOKIE_NAME}=1; path=/; domain=localhost; max-age=86400; SameSite=Lax`
}

function clearShopCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; domain=localhost; max-age=0; SameSite=Lax`
}

function hasShopCookie() {
  return document.cookie.split('; ').some((c) => c.startsWith(COOKIE_NAME + '='))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const processSSO = useCallback(async (token) => {
    try {
      const { data } = await api.post('/shop/auth/sso/', { token })
      localStorage.setItem('shop_access', data.access)
      localStorage.setItem('shop_refresh', data.refresh)
      setShopCookie()
      setUser(data.user)
      window.history.replaceState({}, '', window.location.pathname)
    } catch {
      localStorage.removeItem('shop_access')
      localStorage.removeItem('shop_refresh')
      clearShopCookie()
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('shop_access')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/shop/auth/me/')
      setUser(data.user || data)
    } catch {
      localStorage.removeItem('shop_access')
      localStorage.removeItem('shop_refresh')
    } finally {
      setLoading(false)
    }
  }, [])

  const ssoProcessedRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ssoToken = params.get('token')
    if (ssoToken && !ssoProcessedRef.current) {
      ssoProcessedRef.current = true
      processSSO(ssoToken)
    } else if (!ssoToken) {
      fetchUser()
    }
  }, [processSSO, fetchUser])

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return
      if (!localStorage.getItem('shop_access')) return
      if (!hasShopCookie()) {
        localStorage.removeItem('shop_access')
        localStorage.removeItem('shop_refresh')
        setUser(null)
      }
    }
    document.addEventListener('visibilitychange', check)
    return () => document.removeEventListener('visibilitychange', check)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/shop/auth/login/', { email, password })
    localStorage.setItem('shop_access', data.access)
    localStorage.setItem('shop_refresh', data.refresh)
    setShopCookie()
    setUser(data.user)
    return data
  }

  const ssoLogin = async (token) => {
    const { data } = await api.post('/shop/auth/sso/', { token })
    localStorage.setItem('shop_access', data.access)
    localStorage.setItem('shop_refresh', data.refresh)
    setShopCookie()
    setUser(data.user)
    return data
  }

  const activate = async (token, password, username) => {
    const { data } = await api.post('/shop/auth/activate/', { token, password, username })
    localStorage.setItem('shop_access', data.access)
    localStorage.setItem('shop_refresh', data.refresh)
    setShopCookie()
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('shop_access')
    localStorage.removeItem('shop_refresh')
    clearShopCookie()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, ssoLogin, activate, logout, fetchUser, processSSO }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
