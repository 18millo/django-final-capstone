import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/password-reset/', { email })
      setSent(true)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Reveal direction="up">
        <div className="text-center">
          <div className="w-16 h-16 bg-nike-red/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">CHECK YOUR EMAIL</h2>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            If an account with that email exists, we've sent a password reset link.
          </p>
          <Link to="/login" className="text-nike-red hover:text-white font-bold uppercase text-xs tracking-wider transition-colors">
            Back to login
          </Link>
        </div>
      </Reveal>
    )
  }

  return (
    <Reveal direction="up">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black tracking-tight text-white">RESET PASSWORD</h2>
        <p className="text-white/40 text-sm mt-2">Enter your email and we'll send you a reset link.</p>
      </div>
      {error && (
        <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
        <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
      </form>
      <p className="mt-6 text-center text-sm text-white/40">
        <Link to="/login" className="text-nike-red hover:text-white font-bold uppercase text-xs tracking-wider transition-colors">
          Back to login
        </Link>
      </p>
    </Reveal>
  )
}
