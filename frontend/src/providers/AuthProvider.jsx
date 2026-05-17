import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/auth/me/')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.clear()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (login, password) => {
    const { data } = await api.post('/auth/login/', { login, password })
    localStorage.setItem('access_token', data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    setUser(data.user)
    return data
  }

  const register = async (email, username, password, role) => {
    const { data } = await api.post('/auth/register/', { email, username, password, role })
    localStorage.setItem('access_token', data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    setUser(data.user)
    return data
  }

  const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google/', { credential })
    localStorage.setItem('access_token', data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    setUser(data.user)
    return data
  }

  const setUsername = async (username) => {
    const { data } = await api.post('/auth/set-username/', { username })
    setUser((prev) => ({ ...prev, ...data }))
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
    navigate('/login')
  }

  const updateUser = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, setUsername, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
