import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

function getToken(key) {
  return sessionStorage.getItem(key) || localStorage.getItem(key)
}

function setToken(key, value, remember) {
  if (remember) {
    localStorage.setItem(key, value)
    sessionStorage.removeItem(key)
  } else {
    sessionStorage.setItem(key, value)
    localStorage.removeItem(key)
  }
}

function removeToken(key) {
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

function clearTokens() {
  localStorage.clear()
  sessionStorage.clear()
}

function setRememberFlag(remember) {
  if (remember) {
    localStorage.setItem('combathub_remember', 'true')
  } else {
    localStorage.removeItem('combathub_remember')
  }
}

function getRememberFlag() {
  return localStorage.getItem('combathub_remember') === 'true'
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
  const token = getToken('access_token')
  if (!token || !isTokenExpired(token)) return

  const refresh = getToken('refresh_token')
  if (!refresh) {
    clearTokens()
    throw new Error('no refresh token')
  }

  if (!refreshPromise) {
    refreshPromise = axios.post('http://localhost:8000/api/auth/refresh/', { refresh })
      .then(({ data }) => {
        refreshPromise = null
        const remembered = getRememberFlag()
        setToken('access_token', data.access, remembered)
        if (data.refresh) setToken('refresh_token', data.refresh, remembered)
        return data.access
      })
      .catch((err) => {
        refreshPromise = null
        clearTokens()
        throw err
      })
  }

  return refreshPromise
}

const inflight = new Map()

api.interceptors.request.use(async (config) => {
  try {
    await ensureFreshToken()
  } catch {
    // token refresh failed – proceed without auth
  }
  const token = getToken('access_token')
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
      const refresh = getToken('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('http://localhost:8000/api/auth/refresh/', { refresh })
          const remembered = getRememberFlag()
          setToken('access_token', data.access, remembered)
          if (data.refresh) setToken('refresh_token', data.refresh, remembered)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          clearTokens()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
export { setToken, removeToken, clearTokens, getToken, setRememberFlag, getRememberFlag }
