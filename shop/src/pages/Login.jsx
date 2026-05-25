import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import { IconSun, IconMoon } from '../components/Icons'
import logo from '../images/logo.svg'

export default function Login() {
  const { theme, toggleTheme } = useTheme()
  const { user, login, ssoLogin, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ssoToken] = useState(() => searchParams.get('token'))

  useEffect(() => {
    if (user && user.role === 'vendor') {
      navigate('/vendor/dashboard', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (!ssoToken) return
    setLoading(true)
    ssoLogin(ssoToken)
      .then(() => {})
      .catch((err) => {
        setError(err.response?.data?.error?.[0] || err.response?.data?.message || 'SSO login failed')
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data.user?.role !== 'vendor') {
        logout()
        setError('This login is for vendors only. Athletes, please use the main app.')
        return
      }
      navigate('/vendor/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error?.[0] || err.response?.data?.message || 'Login failed'
      setError(typeof msg === 'string' ? msg : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (ssoToken) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fadeIn" style={{ background: 'var(--theme-bg)' }}>
        <div className="text-center">
          <img src={logo} alt="Combat Shop" className="h-10 mx-auto mb-6 opacity-80" />
          <div className="flex justify-center mb-4">
            <svg className="w-8 h-8 text-nike-red animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Signing you in...</p>
          {error && (
            <p className="text-xs mt-2 text-nike-red">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--theme-bg)' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(229,16,29,0.06) 0%, transparent 60%)' }} />
      <div className="w-full max-w-sm relative animate-slideUp">
        <div className="text-center mb-8">
          <img src={logo} alt="Combat Shop" className="h-8 mx-auto mb-4" />
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Vendor Login</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>Sign in to manage your shop</p>
          <button onClick={toggleTheme} className="mt-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {theme === 'dark' ? <><IconSun size={14} /><span className="ml-1">Light Mode</span></> : <><IconMoon size={14} /><span className="ml-1">Dark Mode</span></>}
          </button>
        </div>

        <div className="liquid-glass-card rounded-2xl p-6" style={{ border: '1px solid var(--theme-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-nike-red/50 transition-all duration-300"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-nike-red/50 transition-all duration-300"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-nike-red hover:bg-white hover:text-nike-black text-white font-bold py-3 rounded-xl text-sm tracking-wider transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--theme-text-muted)' }}>
          Vendors only. Athletes and other roles, please use the main app.
        </p>
      </div>
    </div>
  )
}
