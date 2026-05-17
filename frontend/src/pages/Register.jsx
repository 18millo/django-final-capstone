import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../providers/AuthProvider'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'
import { playError, playSuccess } from '../utils/sounds'
import { ROLE_ICONS, ROLE_LABELS, ROLE_COLORS } from '../utils/roles'

export default function Register() {
  const [form, setForm] = useState({
    email: '', username: '', password: '', confirmPassword: '', role: 'athlete',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(form.email, form.username, form.password, form.role)
      playSuccess()
      navigate('/')
    } catch (err) {
      playError()
      const data = err.response?.data
      if (data) {
        const messages = Object.values(data).flat()
        setError(messages[0] || 'Registration failed')
      } else {
        setError('Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Reveal direction="up">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black tracking-tight text-white">JOIN THE MOVEMENT</h2>
        <p className="text-white/40 text-sm mt-2">Create your account. It's free.</p>
      </div>
      {error && (
        <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" required />
        <Input label="Username" type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Choose a username (displayed on your profile)" required />
        <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required minLength={8} />
        <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Confirm your password" required />
        <div className="space-y-1.5">
              <label className="block text-xs tracking-widest uppercase font-bold text-white/40">I am a</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300 appearance-none"
                >
                  {['athlete', 'coach', 'gym_owner', 'vendor'].map((r) => {
                    const c = ROLE_COLORS[r]
                    return (
                      <option key={r} value={r} className="bg-nike-dark">
                        {'🏅 '}{ROLE_LABELS[r]}
                      </option>
                    )
                  })}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
        </div>
        <Button type="submit" loading={loading} className="w-full">Create Account</Button>
      </form>
      <div className="mt-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-nike-dark px-4 text-white/30 uppercase tracking-wider">Or sign up with</span>
          </div>
        </div>
        <div className="flex justify-center">
          <GoogleLogin
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
            text="signup_with"
            shape="rectangular"
          />
        </div>
      </div>
      <p className="mt-8 text-center text-sm text-white/40">
        Already have an account?{' '}
        <Link to="/login" className="text-nike-red hover:text-white font-bold transition-colors uppercase text-xs tracking-wider">
          Sign in
        </Link>
      </p>
    </Reveal>
  )
}
