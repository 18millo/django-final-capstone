import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'
import { playError, playSuccess } from '../utils/sounds'
import QRCode from 'qrcode'
import { IconKey } from '../components/Icons'


export default function TotpSetup() {
  const { user, setupTotp, verifyTotp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('loading')
  const [secret, setSecret] = useState('')
  const [uri, setUri] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const textClass = 'text-white'
  const mutedClass = 'text-white/40'
  const borderClass = 'border-white/10'

  useEffect(() => {
    if (user?.totp_enabled) {
      navigate('/settings')
      return
    }
    initSetup()
  }, [])

  const initSetup = async () => {
    try {
      const data = await setupTotp()
      setSecret(data.secret)
      setUri(data.uri)
      const url = await QRCode.toDataURL(data.uri, {
        width: 300,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      })
      setQrDataUrl(url)
      setStep('scan')
    } catch {
      setError('Failed to initialize 2FA setup.')
      setStep('scan')
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await verifyTotp(code)
      playSuccess()
      navigate('/settings')
    } catch (err) {
      playError()
      const msg = err?.response?.data?.error || 'Invalid code. Try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'loading') {
    return (
      <div className={'min-h-[calc(100vh-4rem)] flex items-center justify-center bg-nike-black'}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-nike-red border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <Reveal direction="up">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4"><IconKey className="w-4 h-4" /></div>
        <h2 className={'text-2xl font-black tracking-tight ' + textClass}>SET UP TWO-FACTOR AUTH</h2>
        <p className={'text-sm mt-2 ' + mutedClass}>Scan the QR code with your authenticator app.</p>
      </div>

      {error && (
        <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
      )}

      <div className={'max-w-sm mx-auto p-6 rounded-2xl border ' + borderClass}>
        {qrDataUrl ? (
          <div className="flex justify-center mb-4">
            <img src={qrDataUrl} alt="QR Code" className="rounded-xl" />
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="w-[300px] h-[300px] bg-white/5 rounded-xl flex items-center justify-center text-white/20 text-sm">Loading QR...</div>
          </div>
        )}

        <div className={'text-center mb-4 ' + mutedClass}>
          <p className="text-xs mb-1">Or enter this key manually:</p>
          <code className="text-sm font-mono bg-white/10 px-3 py-1.5 rounded-lg text-nike-amber select-all">{secret}</code>
        </div>

        <div className="space-y-1 mb-4">
          <p className={'text-xs ' + mutedClass}>Supported apps: Google Authenticator, Authy, 1Password, etc.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            label="Verify Code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
            maxLength={6}
            inputMode="numeric"
          />
          <Button type="submit" loading={loading} className="w-full">Enable 2FA</Button>
        </form>
      </div>

      <p className="mt-6 text-center">
        <button
          onClick={() => navigate('/settings')}
          className={'text-xs tracking-wider uppercase font-bold transition-colors ' + mutedClass + ' hover:text-nike-red'}
        >
          Skip for now
        </button>
      </p>
    </Reveal>
  )
}