import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../providers/AuthProvider'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'
import { playError, playSuccess } from '../utils/sounds'
import { ROLE_LABELS, ROLE_COLORS } from '../utils/roles'

const CODE_ROLES = { vendor: 'Vendor', coach: 'Coach', gym_owner: 'Gym Owner' }

export default function Register() {
  const [form, setForm] = useState({
    email: '', username: '', password: '', confirmPassword: '', role: 'athlete',
    business_name: '', business_location: '', business_description: '',
    specialization: '', certifications: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [accessRole, setAccessRole] = useState('')
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
      const payload = {
        email: form.email,
        username: form.username,
        password: form.password,
        role: form.role,
      }
      if (form.role === 'vendor') {
        payload.business_name = form.business_name
        payload.business_location = form.business_location
        payload.business_description = form.business_description
      }
      if (form.role === 'coach') {
        payload.specialization = form.specialization
        payload.certifications = form.certifications
      }
      const res = await register(payload)
      playSuccess()
      if (res.vendor_access_code) {
        setAccessCode(res.vendor_access_code)
        setAccessRole(form.role)
      } else {
        navigate('/login', { state: { registered: true } })
      }
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

  if (accessCode) {
    const label = CODE_ROLES[accessRole] || 'Account'
    return (
      <Reveal direction="up">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black tracking-tight text-white">{label.toUpperCase()} ACCOUNT CREATED</h2>
          <p className="text-white/40 text-sm mt-2">Your access code is ready. Save it — you'll need it to sign in.</p>
        </div>
        <div className="p-6 rounded-2xl border mb-6 text-center bg-white/5 border-white/10">
          <p className="text-xs tracking-widest uppercase font-bold text-white/40 mb-2">Your Access Code</p>
          <div className="inline-block px-6 py-3 rounded-xl bg-nike-red/10 border border-nike-red/30">
            <span className="text-2xl font-black tracking-widest text-nike-red">{accessCode}</span>
          </div>
        </div>
        <Button onClick={() => navigate('/login')} className="w-full">
          Sign In →
        </Button>
      </Reveal>
    )
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
              {['athlete', 'coach', 'gym_owner', 'vendor'].map((r) => (
                <option key={r} value={r} className="bg-nike-dark">
                  {'🏅 '}{ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>

        {form.role === 'vendor' && (
          <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <p className="text-xs tracking-widest uppercase font-bold text-nike-amber/60">Vendor Details</p>
            <Input label="Business Name" type="text" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Your business name" />
            <Input label="Business Location" type="text" value={form.business_location} onChange={(e) => setForm({ ...form, business_location: e.target.value })} placeholder="City, Country" />
            <div className="space-y-1">
              <label className="block text-xs tracking-widest uppercase font-bold text-white/40">Business Description</label>
              <textarea
                value={form.business_description}
                onChange={(e) => setForm({ ...form, business_description: e.target.value })}
                placeholder="Tell us about your business..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300 resize-none h-24"
              />
            </div>
          </div>
        )}

        {form.role === 'coach' && (
          <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <p className="text-xs tracking-widest uppercase font-bold text-nike-amber/60">Coach Profile</p>
            <Input label="Specialization" type="text" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Boxing, BJJ, Muay Thai, MMA" />
            <div className="space-y-1">
              <label className="block text-xs tracking-widest uppercase font-bold text-white/40">Certifications</label>
              <textarea
                value={form.certifications}
                onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                placeholder="List your certifications..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300 resize-none h-24"
              />
            </div>
          </div>
        )}

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
