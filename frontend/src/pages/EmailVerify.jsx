import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import { useAuth } from '../providers/AuthProvider'
import api from '../utils/api'
import { toast } from '../components/ui/Toast'

const BG = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=80'

export default function EmailVerify() {
  const { user, refreshUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (user?.email_verified) {
      navigate(-1)
    }
  }, [user, navigate])

  const handleSend = async () => {
    setSending(true)
    try {
      await api.post('/auth/email/send-code/')
      setSent(true)
      toast('Verification code sent! Check your email.', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to send code', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    if (code.length < 6) {
      toast('Enter the 6-digit code', 'error')
      return
    }
    setVerifying(true)
    try {
      await api.post('/auth/email/verify/', { code })
      toast('Email verified!', 'success')
      window.location.href = '/'
    } catch (err) {
      toast(err.response?.data?.error || 'Invalid code', 'error')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-105" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className={'rounded-3xl border p-8 text-center backdrop-blur-sm ' + (isLight ? 'bg-white/90 border-nike-gray shadow-xl' : 'bg-nike-dark/80 border-white/5')}>
          <div className="text-5xl mb-4">📧</div>
          <h1 className={'text-2xl font-black tracking-tight mb-3 ' + (isLight ? 'text-nike-black' : 'text-white')}>
            Verify Your Email
          </h1>
          <p className={'text-sm mb-6 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
            {sent
              ? 'Enter the 6-digit code sent to your email.'
              : 'Send a verification code to your email to access dashboards.'}
          </p>

          {!sent ? (
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full py-4 bg-nike-red hover:bg-white hover:text-nike-black text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Verification Code'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className={'rounded-2xl border p-5 text-left ' + (isLight ? 'bg-nike-gray/20 border-nike-gray' : 'bg-white/5 border-white/10')}>
                <p className={'text-xs mb-3 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                  Check {user?.email} for the code (check spam too). Code expires in 10 minutes.
                </p>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={'w-full px-4 py-3 rounded-xl text-lg font-mono text-center tracking-[0.3em] outline-none border transition-all duration-200 ' + (isLight
                    ? 'bg-white border-nike-gray text-nike-black placeholder:text-nike-light focus:border-nike-red'
                    : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30'
                  )}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleVerify}
                  disabled={verifying || code.length < 6}
                  className="flex-1 py-4 bg-nike-red hover:bg-white hover:text-nike-black text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
                >
                  {verifying ? '…' : 'Verify'}
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="px-6 py-4 rounded-2xl font-bold text-sm tracking-widest uppercase border transition-all duration-300 disabled:opacity-50"
                  style={{ borderColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}
                >
                  {sending ? '…' : 'Resend'}
                </button>
              </div>
            </div>
          )}

          <Link
            to="/settings"
            className="block mt-4 text-xs tracking-wider uppercase"
            style={{ color: 'var(--color-nike-light)' }}
          >
            Go to Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
