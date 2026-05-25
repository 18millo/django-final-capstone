import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

function getToken(key) {
  return localStorage.getItem(key)
}

function setToken(key, value) {
  localStorage.setItem(key, value)
}

function removeToken(key) {
  localStorage.removeItem(key)
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

let refreshPromise = null

async function ensureFreshToken() {
  const token = getToken('shop_access')
  if (!token || !isTokenExpired(token)) return

  const refresh = getToken('shop_refresh')
  if (!refresh) {
    removeToken('shop_access')
    removeToken('shop_refresh')
    window.location.href = '/login'
    throw new Error('no refresh token')
  }

  if (!refreshPromise) {
    refreshPromise = axios.post(`${API_URL}/auth/refresh/`, { refresh })
      .then(({ data }) => {
        refreshPromise = null
        setToken('shop_access', data.access)
        if (data.refresh) setToken('shop_refresh', data.refresh)
        return data.access
      })
      .catch((err) => {
        refreshPromise = null
        removeToken('shop_access')
        removeToken('shop_refresh')
        throw err
      })
  }

  return refreshPromise
}

api.interceptors.request.use(async (config) => {
  try {
    await ensureFreshToken()
  } catch {
    return config
  }
  const token = getToken('shop_access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = getToken('shop_refresh')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh })
          setToken('shop_access', data.access)
          if (data.refresh) setToken('shop_refresh', data.refresh)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          removeToken('shop_access')
          removeToken('shop_refresh')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
