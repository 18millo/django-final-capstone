import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'
import { playError, playSuccess } from '../utils/sounds'
import { IconLock } from '../components/Icons'


export default function VerifyLogin() {
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyLogin } = useAuth()
  const email = location.state?.email || ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code from your authenticator app.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await verifyLogin(email, code)
      playSuccess()
      navigate('/')
    } catch (err) {
      playError()
      const data = err.response?.data
      const msg = typeof data === 'object' ? Object.values(data).flat()[0] : 'Verification failed'
      setError(msg || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <Reveal direction="up">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tight text-white">INVALID REQUEST</h2>
          <p className="text-white/40 text-sm mt-2">No login session found.</p>
          <Link to="/login" className="mt-6 inline-block text-nike-red hover:text-white font-bold transition-colors uppercase text-xs tracking-wider">
            Back to sign in
          </Link>
        </div>
      </Reveal>
    )
  }

  return (
    <Reveal direction="up">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4"><IconLock className="w-4 h-4" /></div>
        <h2 className="text-2xl font-black tracking-tight text-white">TWO-FACTOR AUTHENTICATION</h2>
        <p className="text-white/40 text-sm mt-2">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>
      {error && (
        <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Authenticator Code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          required
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
        />
        <Button type="submit" loading={loading} className="w-full">Verify & Sign In</Button>
      </form>
      <p className="mt-8 text-center text-sm text-white/40">
        <Link to="/login" className="text-nike-red hover:text-white font-bold transition-colors uppercase text-xs tracking-wider">
          Use a different account
        </Link>
      </p>
    </Reveal>
  )
}