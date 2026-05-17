import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'
import { playError, playSuccess } from '../utils/sounds'

export default function VerifyAccessCode() {
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyAccessCode } = useAuth()
  const email = location.state?.email || ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length < 8) {
      setError('Please enter your full 8-character access code.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await verifyAccessCode(email, code)
      if (data.requires_2fa) {
        navigate('/verify-login', { state: { email } })
        return
      }
      playSuccess()
      navigate('/')
    } catch (err) {
      playError()
      const data = err.response?.data
      const msg = typeof data === 'object' ? Object.values(data).flat()[0] : 'Verification failed'
      setError(msg || 'Invalid access code.')
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
        <div className="text-5xl mb-4">🔑</div>
        <h2 className="text-2xl font-black tracking-tight text-white">ACCESS CODE REQUIRED</h2>
        <p className="text-white/40 text-sm mt-2">
          Enter your 8-character access code to sign in.
        </p>
      </div>
      {error && (
        <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Access Code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
          placeholder="e.g. X7K9M2P1"
          required
          maxLength={8}
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
