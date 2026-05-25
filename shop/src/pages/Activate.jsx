import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import logo from '../images/logo.svg'

export default function Activate() {
  const { user, activate } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (user) navigate('/shop')
  }, [user, navigate])

  useEffect(() => {
    if (!token) setError('Invalid activation link. No token provided.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await activate(token, password, username)
      navigate('/shop')
    } catch (err) {
      const msg = err.response?.data?.error?.[0] || err.response?.data?.message || 'Activation failed'
      setError(typeof msg === 'string' ? msg : 'Activation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--theme-bg)' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(229,16,29,0.06) 0%, transparent 60%)' }} />
      <div className="w-full max-w-sm relative animate-slideUp">
        <div className="text-center mb-8">
          <img src={logo} alt="Combat Shop" className="h-8 mx-auto mb-4" />
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Activate Account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>Set your password to get started</p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-6" style={{ border: '1px solid var(--theme-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {!token && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm px-4 py-3 rounded-xl">
                No activation token found. Use the link from your invitation email.
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Display Name (optional)</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-nike-red/50 transition-all duration-300"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                placeholder="Your Name" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="w-full rounded-xl px-4 py-3 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-nike-red/50 transition-all duration-300"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                placeholder="Min. 8 characters" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                className="w-full rounded-xl px-4 py-3 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-nike-red/50 transition-all duration-300"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                placeholder="Repeat password" />
            </div>

            <button type="submit" disabled={loading || !token}
              className="w-full bg-nike-red hover:bg-white hover:text-nike-black text-white font-bold py-3 rounded-xl text-sm tracking-wider transition-all duration-300 disabled:opacity-50">
              {loading ? 'Activating...' : 'Activate Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
