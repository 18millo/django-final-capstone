import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'

export default function ResetPassword() {
  const { token } = useParams()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
      await api.post('/auth/password-reset/confirm/', { token, password: form.password })
      setSuccess(true)
    } catch {
      setError('Invalid or expired reset link.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Reveal direction="up">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-green-400">✓</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">PASSWORD RESET!</h2>
          <p className="text-white/40 text-sm mb-8">Your password has been updated successfully.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-nike-black hover:bg-nike-red hover:text-white px-8 py-3 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300"
          >
            Sign in <span>→</span>
          </Link>
        </div>
      </Reveal>
    )
  }

  return (
    <Reveal direction="up">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black tracking-tight text-white">SET NEW PASSWORD</h2>
        <p className="text-white/40 text-sm mt-2">Choose a strong password.</p>
      </div>
      {error && (
        <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="New Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required minLength={8} />
        <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Confirm your password" required />
        <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
      </form>
    </Reveal>
  )
}
