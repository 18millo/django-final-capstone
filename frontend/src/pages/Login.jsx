import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'
import GoogleLoginWrapper from '../components/ui/GoogleLoginWrapper'
import { playError } from '../utils/sounds'

export default function Login() {
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.login, form.password, rememberMe)
      if (data.requires_2fa) {
        navigate('/verify-login', { state: { email: data.email } })
      } else if (data.requires_access_code) {
        navigate('/verify-access-code', { state: { email: data.email } })
      } else {
        navigate('/')
      }
    } catch (err) {
      playError()
      const data = err.response?.data
      const msg = data?.detail || data?.non_field_errors?.[0] || data?.error || 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Reveal direction="up">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black tracking-tight text-white">WELCOME BACK</h2>
        <p className="text-white/40 text-sm mt-2">Sign in to continue your journey.</p>
      </div>
      {error && (
        <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email or Username"
          type="text"
          value={form.login}
          onChange={(e) => setForm({ ...form, login: e.target.value })}
          placeholder="Enter your email (vendors must use email)"
          required
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Enter your password"
          required
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-transparent text-nike-red focus:ring-nike-red focus:ring-1 cursor-pointer"
            />
            <span className="text-xs tracking-wider text-white/40 group-hover:text-white/60 transition-colors uppercase font-medium">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-xs tracking-wider text-white/40 hover:text-nike-red transition-colors uppercase font-medium">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">Sign In</Button>
      </form>
      <div className="mt-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-nike-dark px-4 text-white/30 uppercase tracking-wider">Or continue with</span>
          </div>
        </div>
        <div className="flex justify-center">
          <GoogleLoginWrapper
            onSuccess={async (credentialResponse) => {
              try {
                const data = await googleLogin(credentialResponse.credential)
                if (data.is_new_google_user) {
                  navigate('/username-setup')
                } else {
                  navigate('/')
                }
              } catch {
                setError('Google sign-in failed')
              }
            }}
            onError={() => setError('Google sign-in failed')}
            size="large"
            theme="outline"
            text="signin_with"
            shape="rectangular"
          />
        </div>
      </div>
      <p className="mt-8 text-center text-sm text-white/40">
        Don't have an account?{' '}
        <Link to="/register" className="text-nike-red hover:text-white font-bold transition-colors uppercase text-xs tracking-wider">
          Sign up
        </Link>
      </p>
    </Reveal>
  )
}
