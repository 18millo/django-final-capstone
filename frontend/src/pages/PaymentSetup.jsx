import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import { useAuth } from '../providers/AuthProvider'
import api from '../utils/api'
import { toast } from '../components/ui/Toast'
import Spinner from '../components/ui/Spinner'
import { IconCreditCard, IconGem, IconMail, IconPhone } from '../components/Icons'


export default function PaymentSetup() {
  const { user, refreshUser } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan') || 'monthly'
  const planLabel = plan === 'yearly' ? 'Yearly' : 'Monthly'
  const [method, setMethod] = useState('mpesa')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardBrand, setCardBrand] = useState('visa')
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [premiumInfo, setPremiumInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/premium/check/')
      .then((res) => setPremiumInfo(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user?.profile?.phone) {
      setMpesaPhone(user.profile.phone)
    }
  }, [user?.profile?.phone])

  const detectCardBrand = (num) => {
    const clean = num.replace(/\s/g, '')
    if (clean.startsWith('4')) return 'visa'
    if (clean.startsWith('5')) return 'mastercard'
    if (clean.startsWith('3')) return 'amex'
    if (clean.startsWith('6')) return 'discover'
    return 'visa'
  }

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
    setCardNumber(raw)
    if (raw.length >= 4) {
      setCardBrand(detectCardBrand(raw))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const payload = { method, plan }
    if (method === 'mpesa') {
      if (!mpesaPhone.trim()) {
        toast('Please enter your M-Pesa phone number', 'error')
        setSubmitting(false)
        return
      }
      payload.mpesa_phone = mpesaPhone.trim()
    } else {
      if (cardNumber.length < 4) {
        toast('Please enter at least the last 4 digits of your card', 'error')
        setSubmitting(false)
        return
      }
      payload.card_last_four = cardNumber.slice(-4)
      payload.card_brand = cardBrand
    }
    try {
      await api.post('/auth/premium/setup-payment/', payload)
      await refreshUser()
      toast('Premium trial activated! Welcome to Premium!', 'success')
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.mpesa_phone?.[0] || 'Failed to setup payment. Try again.'
      toast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel Premium? Your premium features will be removed immediately.')) return
    setCancelling(true)
    try {
      await api.post('/auth/premium/cancel/')
      await refreshUser()
      toast('Premium cancelled.', 'success')
      navigate('/', { replace: true })
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to cancel premium', 'error')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const [insightsPublic, setInsightsPublic] = useState(true)
  const [togglingInsights, setTogglingInsights] = useState(false)

  const handleToggleInsights = async () => {
    setTogglingInsights(true)
    try {
      const { data } = await api.post('/auth/premium/toggle-insights/')
      setInsightsPublic(data.show_views_publicly)
      setPremiumInfo((prev) => ({ ...prev, show_views_publicly: data.show_views_publicly }))
    } catch { }
    setTogglingInsights(false)
  }

  useEffect(() => {
    if (premiumInfo?.show_views_publicly !== undefined) {
      setInsightsPublic(premiumInfo.show_views_publicly)
    }
  }, [premiumInfo?.show_views_publicly])

  if (loading) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><Spinner /></div>
  }

  const isPremium = premiumInfo?.is_premium
  const emailVerified = user?.email_verified

  if (isPremium) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slowZoom" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=80)' }} />
        <div className={'absolute inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
        <div className="relative z-10 w-full max-w-lg mx-4">
          <div className={'rounded-3xl border p-8 backdrop-blur-sm ' + (isLight ? 'bg-white/90 border-nike-gray shadow-xl' : 'bg-nike-dark/80 border-white/5')}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3"><IconGem className="w-4 h-4" /></div>
              <h1 className={'text-2xl font-black tracking-tight ' + (isLight ? 'text-nike-black' : 'text-white')}>Manage Premium</h1>
              <p className={'text-sm mt-2 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                Your premium subscription details
              </p>
            </div>

            <div className={'rounded-2xl border p-5 mb-6 liquid-glass-card ' + (isLight ? 'bg-green-500/5 border-green-500/20' : 'bg-green-500/5 border-green-500/20')}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className={'text-xs tracking-widest uppercase font-bold text-green-400'}>Premium Active</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className={'flex justify-between ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                  <span>Status</span>
                  <span className={'font-bold ' + (isLight ? 'text-green-600' : 'text-green-400')}>
                    {premiumInfo?.in_grace_period ? 'Grace Period' : 'Active'}
                  </span>
                </div>
                {premiumInfo?.premium_expires_at && (
                  <div className={'flex justify-between ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                    <span>Trial Expires</span>
                    <span className={'font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{formatDate(premiumInfo.premium_expires_at)}</span>
                  </div>
                )}
                {premiumInfo?.in_grace_period && premiumInfo?.premium_grace_end && (
                  <div className={'flex justify-between ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                    <span>Grace Period Ends</span>
                    <span className={'font-bold ' + (isLight ? 'text-amber-500' : 'text-amber-400')}>{formatDate(premiumInfo.premium_grace_end)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={'rounded-2xl border p-5 mb-6 liquid-glass-card ' + (isLight ? 'bg-nike-gray/20 border-nike-gray' : 'bg-white/5 border-white/10')}>
              <h3 className={'font-bold text-xs tracking-widest uppercase mb-3 ' + (isLight ? 'text-nike-black' : 'text-white')}>Premium Features</h3>
              <div className="grid grid-cols-2 gap-2">
                {(premiumInfo?.premium_features || []).map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span>{f.icon}</span>
                    <span className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{f.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={'rounded-2xl border p-5 mb-6 liquid-glass-card ' + (isLight ? 'bg-nike-gray/20 border-nike-gray' : 'bg-white/5 border-white/10')}>
              <h3 className={'font-bold text-xs tracking-widest uppercase mb-3 ' + (isLight ? 'text-nike-black' : 'text-white')}>Insights Privacy</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>
                    {insightsPublic ? '📍 Public' : '🔒 Private'}
                  </p>
                  <p className={'text-xs mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                    {insightsPublic ? 'Post view counts visible to everyone' : 'Post view counts hidden (only you can see)'}
                  </p>
                </div>
                <button
                  onClick={handleToggleInsights}
                  disabled={togglingInsights}
                  className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (insightsPublic ? 'bg-nike-red' : 'bg-nike-gray')}
                >
                  <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (insightsPublic ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              </div>
              <p className={'text-[10px] mt-2 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                Vendors always show view counts publicly for transparency.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-4 border-2 border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Cancel Premium'}
              </button>
              <p className={'text-center text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                Cancelling will immediately end your premium access. No refunds as this is a free trial.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slowZoom" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=80)' }} />
      <div className={'absolute inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className={'rounded-3xl border p-8 backdrop-blur-sm ' + (isLight ? 'bg-white/90 border-nike-gray shadow-xl' : 'bg-nike-dark/80 border-white/5')}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3"><IconGem className="w-4 h-4" /></div>
              <h1 className={'text-2xl font-black tracking-tight ' + (isLight ? 'text-nike-black' : 'text-white')}>Set Up Payment</h1>
              <p className={'text-sm mt-2 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                {plan === 'yearly' ? 'Subscribe yearly and save 15%' : 'Subscribe monthly — cancel anytime'}
              </p>
            </div>

            {!emailVerified && (
              <div className={'rounded-2xl border p-5 mb-6 bg-nike-amber/10 border-nike-amber/30 liquid-glass-card'}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl"><IconMail className="w-4 h-4" /></span>
                  <div>
                    <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Verify your email first</p>
                    <p className={'text-xs mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                      Go to <Link to="/settings" className="text-nike-red hover:underline font-bold">Settings → Security</Link> to verify your email before activating premium.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mb-6">
            <button
              onClick={() => setMethod('mpesa')}
              className={'flex-1 py-4 rounded-2xl text-center font-bold text-sm tracking-wide border-2 transition-all duration-200 ' + (method === 'mpesa'
                ? 'border-nike-red bg-nike-red/10 text-nike-red'
                : (isLight ? 'border-nike-gray text-nike-light hover:border-nike-red/30' : 'border-white/10 text-white/40 hover:border-white/30')
              )}
            >
              <div className="text-2xl mb-1"><IconPhone className="w-4 h-4" /></div>
              M-Pesa
            </button>
            <button
              onClick={() => setMethod('card')}
              className={'flex-1 py-4 rounded-2xl text-center font-bold text-sm tracking-wide border-2 transition-all duration-200 ' + (method === 'card'
                ? 'border-nike-red bg-nike-red/10 text-nike-red'
                : (isLight ? 'border-nike-gray text-nike-light hover:border-nike-red/30' : 'border-white/10 text-white/40 hover:border-white/30')
              )}
            >
              <div className="text-2xl mb-1"><IconCreditCard className="w-4 h-4" /></div>
              Card
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {method === 'mpesa' ? (
              <div>
                <label className={'block text-xs tracking-widest uppercase font-bold mb-2 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  placeholder={user?.profile?.phone ? '' : 'Set your phone number in Settings first'}
                  value={mpesaPhone}
                  disabled
                  className={'w-full px-4 py-3 rounded-xl text-sm outline-none border cursor-not-allowed transition-all duration-200 ' + (isLight
                    ? 'bg-nike-gray/30 border-nike-gray text-nike-black/60'
                    : 'bg-white/5 border-white/10 text-white/60'
                  )}
                />
                <p className={'text-[10px] mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>M-Pesa number is linked to your profile phone number</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={'block text-xs tracking-widest uppercase font-bold mb-2 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className={'w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all duration-200 ' + (isLight
                      ? 'bg-white border-nike-gray text-nike-black placeholder:text-nike-light focus:border-nike-red'
                      : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30'
                    )}
                  />
                </div>
                {cardNumber.length >= 4 && (
                  <div className={'flex items-center gap-2 px-4 py-2 rounded-xl ' + (isLight ? 'bg-nike-gray/20' : 'bg-white/5')}>
                    <span className="text-lg">
                      {cardBrand === 'visa' ? '💳' : cardBrand === 'mastercard' ? '💳' : cardBrand === 'amex' ? '💳' : '💳'}
                    </span>
                    <span className={'text-xs uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                      {cardBrand} •••• {cardNumber.slice(-4)}
                    </span>
                  </div>
                )}
                <p className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                  Your card details are stored securely. You won&apos;t be charged during the trial period.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !emailVerified}
              className="w-full py-4 bg-nike-red hover:bg-white hover:text-nike-black text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
            >
              {submitting ? 'Activating…' : '🔓 Subscribe ' + planLabel}
            </button>
          </form>

          <p className={'text-center text-[10px] mt-4 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
            By clicking Subscribe, you agree to our{' '}
            <a href="/terms" className="text-nike-red hover:underline">Terms & Conditions</a>.
            {plan === 'yearly' ? ' Yearly billing — 7-day grace period if payment fails.' : ' Monthly billing — 7-day grace period if payment fails.'}
          </p>
        </div>
      </div>
    </div>
  )
}
