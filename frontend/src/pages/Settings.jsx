import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api, { getToken } from '../utils/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { toast } from '../components/ui/Toast'
import { playSuccess, playClick } from '../utils/sounds'
const SHOP_URL = import.meta.env.VITE_SHOP_URL || 'http://localhost:5174'
import { mediaUrl } from '../utils/media'
import QRCode from 'qrcode'
import MapPicker from '../components/ui/MapPicker'
import { IconBoxingGlove, IconCheck, IconGear, IconGem, IconHourglass, IconMail, IconPackage, IconPhone, IconPin, IconQuestion, IconUser } from '../components/Icons'


const BG = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1920&q=80'

const WEIGHT_CLASSES = [
  { value: '', label: 'Not specified' },
  { value: 'strawweight', label: 'Strawweight (115 lbs / 52 kg)' },
  { value: 'flyweight', label: 'Flyweight (125 lbs / 57 kg)' },
  { value: 'bantamweight', label: 'Bantamweight (135 lbs / 61 kg)' },
  { value: 'featherweight', label: 'Featherweight (145 lbs / 66 kg)' },
  { value: 'lightweight', label: 'Lightweight (155 lbs / 70 kg)' },
  { value: 'welterweight', label: 'Welterweight (170 lbs / 77 kg)' },
  { value: 'middleweight', label: 'Middleweight (185 lbs / 84 kg)' },
  { value: 'light_heavyweight', label: 'Light Heavyweight (205 lbs / 93 kg)' },
  { value: 'heavyweight', label: 'Heavyweight (265 lbs / 120 kg)' },
]

const STANCES = [
  { value: '', label: 'Not specified' },
  { value: 'orthodox', label: 'Orthodox' },
  { value: 'southpaw', label: 'Southpaw' },
  { value: 'switch', label: 'Switch' },
]

const SIDEBAR_ITEMS = [
  { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z' },
  { id: 'fighter', label: 'Fighter Stats', icon: 'M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { id: 'products', label: 'My Products', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z', vendorOnly: true },
  { id: 'premium', label: 'Premium', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'contact', label: 'Contact Us', icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' },
  { id: 'help', label: 'Help', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' },
  { id: 'security', label: 'Security', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'appearance', label: 'Appearance', icon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' },
  { id: 'about', label: 'About', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
]

const PREMIUM_FEATURES = [
  { icon: '🏪', title: 'Sell Products', desc: 'Create and manage your own shop within CombatHub marketplace.', label: 'Vendors' },
  { icon: '📊', title: 'Business Dashboard', desc: 'View sales analytics, track orders, and manage inventory from one place.', label: 'Vendors' },
  { icon: '📸', title: 'Gallery Uploads', desc: 'Upload and showcase high-quality images for your products and services.', label: 'Vendors' },
  { icon: '📦', title: 'Inventory Management', desc: 'Track stock levels, set low-stock alerts, and manage product variants.', label: 'Vendors' },
  { icon: '📈', title: 'Growth Analytics', desc: 'Track follower growth, engagement, and product performance over time.', label: 'Business' },
  { icon: '🎯', title: 'Smart Promotions', desc: 'Create discount campaigns and promotional offers for your shop.', label: 'Vendors' },
  { icon: '🤝', title: 'Priority Following', desc: 'Get your follow requests seen first by other businesses and athletes.', label: 'Business' },
  { icon: '🔒', title: 'Advanced Privacy', desc: 'Control profile visibility, hide activity, and manage who can contact you.', label: 'All Users' },
]

const ATHLETE_FEATURES = [
  { icon: '📋', title: 'Advanced Profile Stats', desc: 'See detailed follower analytics, profile visits, and engagement trends over time.', label: 'Athletes' },
  { icon: '⭐', title: 'Priority Following', desc: 'Get your follow requests seen first by coaches, vendors, and gym owners.', label: 'Athletes' },
  { icon: '🔔', title: 'Smart Notifications', desc: 'Get notified when your favorite vendors restock or coaches post new content.', label: 'Athletes' },
  { icon: '🏅', title: 'Achievement Badges', desc: 'Unlock exclusive premium achievement badges on your profile.', label: 'Athletes' },
  { icon: '🎯', title: 'Personalized Feed', desc: 'Get a curated feed of content from your favorite fighters, coaches, and brands.', label: 'Athletes' },
  { icon: '🎫', title: 'Event Priority', desc: 'Get early access to event tickets, meet-and-greets, and exclusive promotions.', label: 'Athletes' },
  { icon: '🛡️', title: 'Enhanced Privacy', desc: 'Control who can see your activity, followers list, and online status.', label: 'Athletes' },
  { icon: '📱', title: 'Ad-Free Experience', desc: 'Browse CombatHub without promotional content and banners.', label: 'Athletes' },
]

function VendorProducts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const textClass = 'text-white'
  const mutedClass = 'text-white/40'
  const borderClass = 'border-white/10'

  const fetchProducts = () => {
    setLoading(true)
    api.get('/vendor/products/')
      .then((res) => setProducts(res.data.results || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (productId) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete('/vendor/products/' + productId + '/')
      toast('Product deleted', 'success')
      fetchProducts()
    } catch {
      toast('Delete failed', 'error')
    }
  }

  const handleToggleDiscount = async (productId) => {
    try {
      const res = await api.post('/vendor/products/' + productId + '/toggle-discount/')
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, discount_active: res.data.discount_active } : p))
    } catch {
      toast('Failed to toggle', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: 'var(--color-nike-light)' }}><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z"/></svg>
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>My Products</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>Manage your product catalog</p>
              </div>
            </div>
            <button
              onClick={() => { playClick(); navigate('/vendor/products/new') }}
              className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
            >
              + Add Product
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : products.length === 0 ? (
            <div className={'text-center py-12 ' + mutedClass}>
              <p className="text-4xl mb-3"><IconPackage className="w-4 h-4" /></p>
              <p className="font-bold" style={{ color: 'var(--color-nike-white)' }}>No products yet</p>
              <p className="text-sm mt-1">Add your first product to get started selling on CombatHub.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className={'flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.002] ' + borderClass} style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)' }}>
                  <div
                    onClick={() => window.open(`${SHOP_URL}?token=${getToken('access_token') || ''}`, '_blank')}
                    className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-nike-gray/20 cursor-pointer"
                    title="View in Shop"
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl"><IconBoxingGlove className="w-4 h-4" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={'text-sm font-bold truncate ' + textClass}>{p.name}</p>
                      {p.discount_active && (
                        <span className="text-[10px] bg-nike-red text-white font-bold px-2 py-0.5 rounded-full">{p.discount_percent || 0}% OFF</span>
                      )}
                    </div>
                    <div className={'flex items-center gap-2 mt-0.5 text-xs ' + mutedClass}>
                      <span>${parseFloat(p.price).toFixed(2)}</span>
                      <span>· Stock: {p.stock}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => window.open(`${SHOP_URL}?token=${getToken('access_token') || ''}`, '_blank')}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] transition-all" style={{ backgroundColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}
                      title="View in Shop"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button
                      onClick={() => { playClick(); handleToggleDiscount(p.id) }}
                      className={'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ' + (p.discount_active ? 'bg-emerald-500 text-white' : '')}
                      style={!p.discount_active ? { backgroundColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' } : {}}
                      title={p.discount_active ? 'Disable discount' : 'Enable discount'}
                    >%</button>
                    <button
                      onClick={() => { playClick(); navigate('/vendor/products/' + p.id + '/edit') }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-900/20" style={{ color: 'var(--color-nike-light)' }}
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
              </Reveal>
    </div>
  )
}

function EmailVerification() {
  const { user, refreshUser } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [changing, setChanging] = useState(false)
  const [message, setMessageObj] = useState({ text: '', type: '' })
  const setMessage = (val) => {
    if (typeof val === 'string') setMessageObj({ text: val, type: '' })
    else setMessageObj(val)
  }

  const handleSendCode = async () => {
    setSending(true)
    setMessage('')
    try {
      await api.post('/auth/email/send-code/')
      setCodeSent(true)
      setMessage('Verification code sent to your email.')
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to send code')
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    if (code.length < 6) return
    setVerifying(true)
    try {
      await api.post('/auth/email/verify/', { code })
      await refreshUser()
      setMessage('Email verified successfully!')
    } catch (err) {
      setMessage(err.response?.data?.error || 'Invalid code')
    } finally {
      setVerifying(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail.includes('@')) return toast('Invalid email', 'error')
    setChanging(true)
    try {
      await api.post('/auth/email/change/', { email: newEmail })
      setCodeSent(true)
      setMessage('Verification code sent to ' + newEmail)
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to change email')
    } finally {
      setChanging(false)
    }
  }

  return (
    <div>
      {message.text && (
        <div className={'px-5 py-4 rounded-xl mb-8 text-sm border ' + (message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-nike-red/10 border-nike-red/20 text-nike-red')}>
          {message.text}
        </div>
      )}
      <div>
        <label className={'text-xs tracking-widest uppercase font-bold mb-1.5 block ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Current Email</label>
        <div className="flex items-center gap-2">
          <span className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{user?.email}</span>
          {user?.email_verified && <span className="text-[10px] text-emerald-400 font-bold"><IconCheck className="w-4 h-4" /> Verified</span>}
        </div>
      </div>

      {changingEmail ? (
        <div className="space-y-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email"
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
          />
          <div className="flex gap-2">
            <Button onClick={handleChangeEmail} loading={changing}>Save & Send Code</Button>
            <button onClick={() => { setChangingEmail(false); setNewEmail(''); setMessage('') }} className="text-xs px-3 hover:underline" style={{ color: 'var(--color-nike-light)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setChangingEmail(true)} className="text-xs hover:underline font-bold" style={{ color: 'var(--color-nike-light)' }}>
          Change email
        </button>
      )}

      {!user?.email_verified && !changingEmail && (
        <div className="pt-2 border-t border-white/10">
          {!codeSent ? (
            <Button onClick={handleSendCode} loading={sending}>Send Verification Code</Button>
          ) : (
            <div className="space-y-3">
              <p className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Enter the 6-digit code sent to your email:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  className="w-32 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-bold focus:outline-none transition-all duration-300"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
                />
                <Button onClick={handleVerify} loading={verifying}>Verify</Button>
              </div>
              <button onClick={handleSendCode} className="text-xs hover:underline" style={{ color: 'var(--color-nike-light)' }}>
                Resend code
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EnableTotp() {
  const { setupTotp, verifyTotp } = useAuth()
  const [step, setStep] = useState('idle')
  const [secret, setSecret] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSetup = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await setupTotp()
      setSecret(data.secret)
      const url = await QRCode.toDataURL(data.uri, {
        width: 300,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      })
      setQrDataUrl(url)
      setStep('scan')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to setup 2FA')
    } finally {
      setLoading(false)
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
      setStep('done')
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid code.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3"><IconCheck className="w-4 h-4" /></div>
        <p className="font-bold" style={{ color: 'var(--color-nike-white)' }}>2FA Enabled Successfully!</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>You'll now need a code from your authenticator app to sign in.</p>
      </div>
    )
  }

  if (step === 'scan') {
    return (
      <div>
        {error && <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
        {qrDataUrl ? (
          <div className="flex justify-center mb-4">
            <img src={qrDataUrl} alt="QR Code" className="rounded-xl" />
          </div>
        ) : (
          <div className={'text-center mb-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]'}>
            <p className="text-xs mb-2" style={{ color: 'var(--color-nike-light)' }}>Secret key:</p>
            <code className="text-sm font-mono bg-white/10 px-3 py-1.5 rounded-lg text-nike-amber select-all">{secret}</code>
          </div>
        )}
        <p className="text-xs mb-4" style={{ color: 'var(--color-nike-light)' }}>
          Scan the QR code with Google Authenticator, Authy, or any TOTP app. Then enter the 6-digit code below.
        </p>
        <form onSubmit={handleVerify} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            className="w-full rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-bold focus:outline-none transition-all duration-300"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
          />
          <Button type="submit" loading={loading} className="w-full">Verify & Enable</Button>
        </form>
      </div>
    )
  }

  return (
    <div>
      {error && <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
      <p className="text-sm mb-4" style={{ color: 'var(--color-nike-light)' }}>
        Two-factor authentication adds an extra layer of security. After enabling, you'll need to enter a code from your authenticator app each time you sign in.
      </p>
      <Button onClick={handleSetup} loading={loading}>Set Up 2FA</Button>
    </div>
  )
}

function DisableTotp() {
  const { disableTotp } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDisable = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await disableTotp(code)
      setConfirming(false)
      setCode('')
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid code.')
    } finally {
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-nike-light)' }}>
          2FA is currently enabled. Your account requires a code from your authenticator app to sign in.
        </p>
        <Button onClick={() => setConfirming(true)} className="bg-nike-red/20 text-nike-red border border-nike-red/30">Disable 2FA</Button>
      </div>
    )
  }

  return (
    <div>
      {error && <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
      <p className="text-sm mb-3 font-bold" style={{ color: 'var(--color-nike-white)' }}>Enter a code from your authenticator app to confirm disabling 2FA:</p>
      <form onSubmit={handleDisable} className="space-y-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          inputMode="numeric"
          className="w-full rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-bold focus:outline-none transition-all duration-300"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
        />
        <Button type="submit" loading={loading} className="w-full bg-nike-red/20 text-nike-red border border-nike-red/30">Confirm Disable</Button>
        <button
          onClick={() => { setConfirming(false); setError('') }}
          className="w-full text-xs text-center py-2"
          style={{ color: 'var(--color-nike-light)' }}
        >
          Cancel
        </button>
      </form>
    </div>
  )
}

export default function Settings() {
  const { user, updateUser, logout } = useAuth()
  const { theme, toggleTheme, font: appFont, changeFont, fonts, appVersion } = useTheme()
  const [tab, setTab] = useState('profile')
  const [openFaq, setOpenFaq] = useState(null)
  const [form, setForm] = useState({
    username: '', bio: '', phone: '', weight_class: '',
    height_ft: '', height_in: '', reach_in: '', stance: '',
    business_name: '', business_location: '', business_description: '',
    latitude: '', longitude: '',
    messaging_enabled: true,
  })
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showPhoneVerify, setShowPhoneVerify] = useState(false)
  const [phoneCode, setPhoneCode] = useState('')
  const [sendingPhoneCode, setSendingPhoneCode] = useState(false)
  const [verifyingPhone, setVerifyingPhone] = useState(false)
  const isLight = theme === 'light'

  useEffect(() => {
    if (user) {
      const p = user.profile || {}
      setForm({
        username: user.username || '',
        bio: p.bio || '',
        phone: p.phone || '',
        weight_class: p.weight_class || '',
        height_ft: p.height_ft || '',
        height_in: p.height_in || '',
        reach_in: p.reach_in || '',
        stance: p.stance || '',
        business_name: p.business_name || '',
        business_location: p.business_location || '',
        business_description: p.business_description || '',
        latitude: p.latitude || '',
        longitude: p.longitude || '',
        messaging_enabled: p.messaging_enabled !== undefined ? p.messaging_enabled : true,
      })
    }
  }, [user])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const formData = new FormData()
      formData.append('username', form.username)
      Object.entries(form).forEach(([key, val]) => {
        if (key !== 'username') {
          const emptyNumerics = ['height_ft', 'height_in', 'reach_in', 'latitude', 'longitude']
          if (key === 'messaging_enabled') {
            formData.append('profile[messaging_enabled]', val)
            return
          }
          if (emptyNumerics.includes(key) && val === '') return
          formData.append('profile[' + key + ']', val)
        }
      })
      if (avatar) formData.append('profile[avatar]', avatar)

      const { data } = await api.patch('/auth/me/', formData)
      updateUser(data)
      playSuccess()
      setMessage({ type: 'success', text: 'Profile updated!' })
    } catch (err) {
      const errData = err.response?.data
      console.error('Profile update error:', JSON.stringify(errData))
      const msg = typeof errData === 'string' ? errData :
        errData?.username?.[0] ||
        (errData?.profile ? Object.values(errData.profile).flat().join(', ') : null) ||
        errData?.detail ||
        'Failed to update profile'
      setMessage({ type: 'error', text: msg })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />

      {/* Sidebar */}
      <div className="relative z-10 w-64 shrink-0 min-h-[calc(100vh-4rem)] flex flex-col" style={{ backgroundColor: 'var(--color-nike-dark)', borderRight: '1px solid var(--color-nike-gray)' }}>
        <div className="px-6 py-8 border-b" style={{ borderColor: 'var(--color-nike-gray)' }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-nike-red rounded-xl flex items-center justify-center font-black text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">SETTINGS</h2>
              <p className="text-xs" style={{ color: 'var(--color-nike-light)' }}>Manage your account</p>
            </div>
          </div>
        </div>
         <nav className="flex-1 p-3 space-y-1">
           {SIDEBAR_ITEMS
             .filter((item) => !item.vendorOnly || user?.role === 'vendor')
             .filter((item) => !(item.id === 'fighter' && ['vendor', 'gym_owner'].includes(user.role)))
             .map((item) => (
               <button
                 key={item.id}
                 onClick={() => setTab(item.id)}
                 className={'flex items-center gap-3 w-full px-4 py-3 text-xs tracking-widest uppercase font-bold rounded-xl transition-all duration-300 text-left ' + (tab === item.id ? 'bg-nike-red text-white shadow-lg shadow-nike-red/20' : 'hover:bg-white/5')}
                 style={tab !== item.id ? { color: 'var(--color-nike-light)' } : {}}
               >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                   <path d={item.icon} />
                 </svg>
                 {item.label}
               </button>
             ))}
          </nav>
          <div className="p-3">
            <button
              type="button"
              onClick={() => logout()}
              className="flex items-center gap-3 w-full px-4 py-3 text-xs tracking-widest uppercase font-bold rounded-xl transition-all duration-300 text-left hover:bg-nike-red/20"
              style={{ color: 'var(--color-nike-light)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        <div className="p-4 border-t text-xs" style={{ borderColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}>
          v{appVersion}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
        <div className="max-w-2xl mx-auto">
          {message.text && (
            <div className={'px-5 py-4 rounded-xl mb-8 text-sm border ' + (message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-nike-red/10 border-nike-red/20 text-nike-red')}>
              {message.text}
            </div>
          )}

          {tab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                        {avatarPreview ? (
                          <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar" />
                        ) : user.profile?.avatar ? (
                          <img src={mediaUrl(user.profile.avatar)} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: 'var(--color-nike-light)' }}><IconUser className="w-4 h-4" /></div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-nike-red text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-white hover:text-nike-black transition-all duration-300 text-sm font-bold shadow-lg">
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />+
                      </label>
                    </div>
                    <div>
                      <p className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>{user.email}</p>
                      <p className="text-sm uppercase tracking-wider" style={{ color: 'var(--color-nike-light)' }}>{user.role.replace('_', ' ')}</p>
                      {['vendor', 'coach', 'gym_owner'].includes(user.role) && user.profile?.vendor_access_code && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] tracking-widest uppercase font-bold text-nike-amber/60">Access Code:</span>
                          <span className="text-xs font-mono font-bold tracking-wider text-nike-red">{user.profile.vendor_access_code}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                    <div>
                      <Input label="Phone" type="tel" value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setShowPhoneVerify(false) }} />
                      <div className="flex items-center gap-2 mt-1.5">
                        {user.profile?.phone_verified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase font-bold text-green-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                            Verified
                          </span>
                        ) : form.phone && form.phone.length >= 8 && !showPhoneVerify ? (
                          <button
                            onClick={() => setShowPhoneVerify(true)}
                            className="text-[10px] tracking-widest uppercase font-bold text-nike-red hover:underline"
                          >
                            Verify Phone
                          </button>
                        ) : null}
                      </div>
                      {showPhoneVerify && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter code"
                            value={phoneCode}
                            onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-28 px-3 py-2 rounded-lg text-xs font-mono text-center tracking-widest outline-none transition-all duration-300"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
                          />
                          {phoneCode.length === 6 ? (
                            <button
                              onClick={async () => {
                                setVerifyingPhone(true)
                                try {
                                  await api.post('/auth/phone/verify/', { phone: form.phone, code: phoneCode })
                                  updateUser({ ...user, profile: { ...user.profile, phone_verified: true, phone: form.phone } })
                                  toast('Phone verified!', 'success')
                                  setShowPhoneVerify(false)
                                  setPhoneCode('')
                                } catch (err) {
                                  toast(err.response?.data?.error || 'Invalid code', 'error')
                                } finally {
                                  setVerifyingPhone(false)
                                }
                              }}
                              disabled={verifyingPhone}
                              className="px-4 py-2 bg-nike-red text-white rounded-lg text-[10px] tracking-widest uppercase font-bold transition-all duration-300 disabled:opacity-50"
                            >
                              {verifyingPhone ? '…' : 'Verify'}
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                setSendingPhoneCode(true)
                                try {
                                  await api.post('/auth/phone/send-code/', { phone: form.phone })
                                  toast('Code sent!', 'success')
                                } catch (err) {
                                  toast(err.response?.data?.error || 'Failed to send code', 'error')
                                } finally {
                                  setSendingPhoneCode(false)
                                }
                              }}
                              disabled={sendingPhoneCode || phoneCode.length > 0}
                              className="px-4 py-2 rounded-lg text-[10px] tracking-widest uppercase font-bold border transition-all duration-300 disabled:opacity-50"
                              style={{ borderColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}
                            >
                              {sendingPhoneCode ? 'Sending…' : 'Send Code'}
                            </button>
                          )}
                          <button onClick={() => { setShowPhoneVerify(false); setPhoneCode('') }} className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--color-nike-light)' }}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 space-y-1.5">
                    <label className="block text-xs tracking-widest uppercase font-bold" style={{ color: 'var(--color-nike-light)' }}>Bio</label>
                    <textarea
                      className="w-full rounded-xl px-4 py-3 placeholder:text-white/20 focus:outline-none focus:border-[var(--color-nike-light)] focus:bg-white/10 transition-all duration-300"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
                      rows={4}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Tell the world about your fighting journey..."
                    />
                  </div>
                </div>

                {user?.role === 'vendor' && (
                  <div className="mt-8 border-t pt-8" style={{ borderColor: 'var(--color-nike-gray)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: 'var(--color-nike-white)' }}>Allow Messages</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-nike-light)' }}>Let others send you direct messages</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, messaging_enabled: !form.messaging_enabled })}
                        className={'relative w-12 h-6 rounded-full transition-all duration-300 ' + (form.messaging_enabled ? 'bg-nike-red' : 'bg-nike-gray')}
                      >
                        <div className={'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ' + (form.messaging_enabled ? 'translate-x-6' : 'translate-x-0.5')} />
                      </button>
                    </div>
                  </div>
                )}

                {['vendor', 'gym_owner'].includes(user.role) && (
                  <div className="mt-8 space-y-5">
                    <h3 className={'text-sm font-black tracking-widest uppercase ' + (isLight ? 'text-nike-black' : 'text-white/60')}>Business Details</h3>
                    <div className="grid md:grid-cols-2 gap-5">
                      <Input label="Business Name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
                      <Input label="City, Country" value={form.business_location} onChange={(e) => setForm({ ...form, business_location: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs tracking-widest uppercase font-bold" style={{ color: 'var(--color-nike-light)' }}>Business Description</label>
                      <textarea
                        className="w-full rounded-xl px-4 py-3 placeholder:text-white/20 focus:outline-none focus:border-[var(--color-nike-light)] focus:bg-white/10 transition-all duration-300"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
                        rows={4}
                        value={form.business_description}
                        onChange={(e) => setForm({ ...form, business_description: e.target.value })}
                        placeholder="Describe your business..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs tracking-widest uppercase font-bold" style={{ color: 'var(--color-nike-light)' }}>Location on Map</label>
                      <p className="text-[10px]" style={{ color: 'var(--color-nike-light)' }}>Click on the map to set your business location pin.</p>
                      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-nike-gray)', height: '300px' }}>
                        <MapPicker
                          lat={form.latitude ? parseFloat(form.latitude) : null}
                          lng={form.longitude ? parseFloat(form.longitude) : null}
                          onLocationChange={(lat, lng) => setForm((p) => ({ ...p, latitude: lat, longitude: lng }))}
                        />
                      </div>
                      <div className="flex gap-4 text-xs" style={{ color: 'var(--color-nike-light)' }}>
                        {form.latitude && <span>Lat: {form.latitude}</span>}
                        {form.longitude && <span>Lng: {form.longitude}</span>}
                      </div>
                    </div>
                    </div>
                  )}
                </Reveal>
            <Button type="submit" loading={loading} className="w-full">Save Changes</Button>
          </form>
        )}

          {tab === 'fighter' && user.role === 'athlete' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <h3 className="font-bold text-sm tracking-widest uppercase mb-6" style={{ color: 'var(--color-nike-light)' }}>Fighter Stats</h3>
                  <div className="grid md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-xs tracking-widest uppercase font-bold mb-1.5" style={{ color: 'var(--color-nike-light)' }}>Weight Class</label>
                      <select
                        value={form.weight_class}
                        onChange={(e) => setForm({ ...form, weight_class: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all duration-300"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
                      >
                        {WEIGHT_CLASSES.map((wc) => (
                          <option key={wc.value} value={wc.value} style={{ backgroundColor: 'var(--color-nike-dark)' }}>{wc.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs tracking-widest uppercase font-bold mb-1.5" style={{ color: 'var(--color-nike-light)' }}>Stance</label>
                      <select
                        value={form.stance}
                        onChange={(e) => setForm({ ...form, stance: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all duration-300"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
                      >
                        {STANCES.map((s) => (
                          <option key={s.value} value={s.value} style={{ backgroundColor: 'var(--color-nike-dark)' }}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="Height (ft)" type="number" value={form.height_ft} onChange={(e) => setForm({ ...form, height_ft: e.target.value })} />
                    <Input label="Height (in)" type="number" value={form.height_in} onChange={(e) => setForm({ ...form, height_in: e.target.value })} />
                    <Input label="Reach (in)" type="number" value={form.reach_in} onChange={(e) => setForm({ ...form, reach_in: e.target.value })} />
                  </div>
                </div>
              </Reveal>
              <Button type="submit" loading={loading} className="w-full">Save Changes</Button>
            </form>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>Theme</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>
                        {theme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="relative w-14 h-7 rounded-full transition-all duration-300 flex items-center"
                      style={{ backgroundColor: theme === 'dark' ? 'var(--color-nike-red)' : 'var(--color-nike-gray)' }}
                    >
                      <div className={'flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ' + (theme === 'dark' ? 'translate-x-1' : 'translate-x-7')}>
                        {theme === 'dark' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f172a" className="w-3.5 h-3.5">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" className="w-3.5 h-3.5">
                            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </Reveal>

              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>Font</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>
                        {appFont || 'Inter'}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {fonts.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => changeFont(f.value)}
                          className={'px-4 py-2 rounded-xl text-sm font-bold transition-all border ' + (appFont === f.value ? 'bg-nike-red text-white border-nike-red' : 'hover:bg-white/10 border-white/10')}
                          style={{ fontFamily: f.family, color: appFont === f.value ? '#fff' : 'var(--color-nike-light)' }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          )}

          {tab === 'products' && user?.role === 'vendor' && (
            <VendorProducts />
          )}

          {tab === 'security' && (
            <div className="space-y-6">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: 'var(--color-nike-light)' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>Email Verification</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>
                        {user.email_verified ? '✅ Email verified' : 'Verify your email to access premium features'}
                      </p>
                    </div>
                  </div>
                  {!user.email_verified && <EmailVerification />}
                </div>
              </Reveal>

              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: 'var(--color-nike-light)' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>Two-Factor Authentication</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>
                        {user.totp_enabled ? '2FA is enabled' : 'Add an extra layer of security to your account'}
                      </p>
                    </div>
                  </div>

                  {user.totp_enabled ? (
                    <DisableTotp />
                  ) : (
                    <EnableTotp />
                  )}
                </div>
              </Reveal>
            </div>
          )}

          {tab === 'premium' && (
            <div className="space-y-6 max-w-4xl">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" style={{ color: 'var(--color-nike-red)' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl" style={{ color: 'var(--color-nike-white)' }}>Premium Features</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>Unlock the full potential of CombatHub</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(user?.role === 'athlete' ? ATHLETE_FEATURES : PREMIUM_FEATURES).map((f, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                        <div className="text-2xl shrink-0">{f.icon}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold" style={{ color: 'var(--color-nike-white)' }}>{f.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-nike-light)' }}>{f.desc}</p>
                          <span className="inline-block mt-1.5 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}>{f.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={50}>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-2xl"><IconGem className="w-4 h-4" /></div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>Pricing Plans</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-nike-light)' }}>Start with a free trial, then choose a plan.</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="relative p-6 rounded-xl flex flex-col" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: 'var(--color-nike-light)' }}>Free Trial</p>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-black" style={{ color: 'var(--color-nike-white)' }}>$0</span>
                        <span className="text-xs" style={{ color: 'var(--color-nike-light)' }}>/30 days</span>
                      </div>
                      <p className="text-xs mt-2" style={{ color: 'var(--color-nike-light)' }}>Full access to all premium features. No charges during trial.</p>
                      <p className="text-[10px] mt-2" style={{ color: 'var(--color-nike-amber)' }}><IconHourglass className="w-4 h-4" /> Includes 7-day grace period after expiry</p>
                    </div>
                    <div className="relative p-6 rounded-xl flex flex-col" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '2px solid var(--color-nike-red)' }}>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-bold bg-nike-red text-white">Popular</div>
                      <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: 'var(--color-nike-light)' }}>Monthly</p>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-black" style={{ color: 'var(--color-nike-white)' }}>$35</span>
                        <span className="text-xs" style={{ color: 'var(--color-nike-light)' }}>/month</span>
                      </div>
                      <p className="text-xs mt-2" style={{ color: 'var(--color-nike-light)' }}>Billed monthly. Cancel anytime.</p>
                      <p className="text-[10px] mt-2" style={{ color: 'var(--color-nike-amber)' }}><IconHourglass className="w-4 h-4" /> 7-day grace period if payment fails</p>
                      <Link to="/premium/setup?plan=monthly" className="mt-4 w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-nike-red hover:bg-nike-red/80 transition-colors text-center block">Subscribe</Link>
                    </div>
                    <div className="relative p-6 rounded-xl flex flex-col" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                      <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: 'var(--color-nike-light)' }}>Yearly</p>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-black" style={{ color: 'var(--color-nike-white)' }}>$357</span>
                        <span className="text-xs" style={{ color: 'var(--color-nike-light)' }}>/year</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="line-through" style={{ color: 'var(--color-nike-light)' }}>$420</span>
                        <span className="text-green-400 font-bold">Save $63</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-nike-light)' }}>15% off vs monthly billing.</p>
                      <p className="text-[10px] mt-2" style={{ color: 'var(--color-nike-amber)' }}><IconHourglass className="w-4 h-4" /> 7-day grace period if payment fails</p>
                      <Link to="/premium/setup?plan=yearly" className="mt-4 w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-nike-red hover:bg-nike-red/80 transition-colors text-center block">Subscribe</Link>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl"><IconGear className="w-4 h-4" /></div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>Manage Premium</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-nike-light)' }}>View or cancel your premium subscription.</p>
                    </div>
                  </div>
                  <Link to="/premium" className="w-full py-3 rounded-xl font-bold text-sm text-white bg-nike-red hover:bg-nike-red/80 transition-colors text-center block">Manage Premium</Link>
                </div>
              </Reveal>
            </div>
          )}

          {tab === 'contact' && (
            <div className="space-y-6">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: 'var(--color-nike-light)' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>Contact Us</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>Get in touch with the CombatHub team</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-5">
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=mungailevi1@gmail.com" target="_blank" rel="noopener noreferrer" className="group relative p-6 rounded-2xl flex flex-col items-center text-center transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 cursor-pointer overflow-hidden" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.15), transparent)' }} />
                      <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-8deg]" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-red) 20%, transparent)' }}>
                        <span><IconMail className="w-4 h-4" /></span>
                      </div>
                      <p className="relative text-[10px] uppercase tracking-[0.15em] font-bold mb-2" style={{ color: 'var(--color-nike-light)' }}>Email</p>
                      <p className="relative text-sm font-bold transition-colors duration-300 group-hover:text-nike-red" style={{ color: 'var(--color-nike-white)' }}>mungailevi1@gmail.com</p>
                    </a>
                    <a href="tel:+254729624970" className="group relative p-6 rounded-2xl flex flex-col items-center text-center transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 cursor-pointer overflow-hidden" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), transparent)' }} />
                      <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-8deg]" style={{ backgroundColor: 'color-mix(in srgb, rgb(34,197,94) 20%, transparent)' }}>
                        <span><IconPhone className="w-4 h-4" /></span>
                      </div>
                      <p className="relative text-[10px] uppercase tracking-[0.15em] font-bold mb-2" style={{ color: 'var(--color-nike-light)' }}>Phone</p>
                      <p className="relative text-sm font-bold transition-colors duration-300 group-hover:text-emerald-400" style={{ color: 'var(--color-nike-white)' }}>+254 729 624 970</p>
                    </a>
                    <div className="group relative p-6 rounded-2xl flex flex-col items-center text-center transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 overflow-hidden" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), transparent)' }} />
                      <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-8deg]" style={{ backgroundColor: 'color-mix(in srgb, rgb(59,130,246) 20%, transparent)' }}>
                        <span><IconPin className="w-4 h-4" /></span>
                      </div>
                      <p className="relative text-[10px] uppercase tracking-[0.15em] font-bold mb-2" style={{ color: 'var(--color-nike-light)' }}>Location</p>
                      <p className="relative text-sm font-bold" style={{ color: 'var(--color-nike-white)' }}>Nairobi, Chiromo<br />Parklands Plaza, 5th Floor</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          )}

          {tab === 'help' && (
            <div className="space-y-6">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: 'var(--color-nike-light)' }}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>Help Center</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>Find answers to common questions</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                      <h4 className="text-sm font-bold" style={{ color: 'var(--color-nike-white)' }}>How do I reset my password?</h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-nike-light)' }}>Go to the login page and click "Forgot Password". Follow the email instructions to reset your password.</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                      <h4 className="text-sm font-bold" style={{ color: 'var(--color-nike-white)' }}>How do I become a vendor?</h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-nike-light)' }}>Navigate to your Settings and select the Premium tab to see available upgrades. Vendors can list products and manage their shop.</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                      <h4 className="text-sm font-bold" style={{ color: 'var(--color-nike-white)' }}>Contact Support</h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-nike-light)' }}>For additional help, email us at <a href="https://mail.google.com/mail/?view=cm&fs=1&to=mungailevi1@gmail.com" target="_blank" rel="noopener noreferrer" className="text-nike-red hover:underline">mungailevi1@gmail.com</a></p>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="p-8 rounded-2xl backdrop-blur-md overflow-hidden" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-2xl"><IconQuestion className="w-4 h-4" /></div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>Frequently Asked Questions</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-nike-light)' }}>Everything you need to know about CombatHub.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { q: 'What is CombatHub Premium?', a: 'Premium is a subscription that unlocks business tools for vendors, coaches, and gym owners — plus extra perks like advanced analytics, priority access, and an ad-free experience for athletes and all users.' },
                      { q: 'How does the free trial work?', a: 'Sign up, choose your role, and add a payment method on the payment setup page. You get 30 days of all premium features completely free. No charges during the trial.' },
                      { q: 'What happens after the trial ends?', a: 'When the 30-day trial expires, you are automatically granted a 7-day grace period. During this time you keep full access to premium features. After the grace period ends, premium features are locked and you revert to the free tier.' },
                      { q: 'Will I be charged after the trial?', a: 'Not automatically. Payment processing (monthly/annual subscriptions via M-Pesa or card) will be introduced in a future update. For now, your premium simply expires.' },
                      { q: 'How do I cancel my premium?', a: 'Go to Manage Premium and click "Cancel Premium". Your premium features will be revoked immediately. Since it is a free trial, there are no charges or refunds involved. You can also just let the trial and grace period expire naturally.' },
                      { q: 'Can I reactivate after cancelling?', a: 'Yes. Go to the payment setup page again, re-enter your payment method, and you will receive another 30-day trial. There is no limit on how many times you can restart.' },
                      { q: 'What payment methods are accepted?', a: 'We currently accept M-Pesa (Kenya) and credit/debit cards (Visa, Mastercard, Amex, Discover). More methods will be added in the future.' },
                      { q: 'Is my payment information secure?', a: 'Yes. M-Pesa phone numbers and card details are stored securely in our database. We use industry-standard encryption and never expose full card numbers — only the last four digits and card brand are stored.' },
                      { q: 'Why do vendors/coaches/gym owners need premium?', a: 'These roles have access to business tools — selling products, business dashboards, gallery uploads, inventory management, and growth analytics. Premium is required to unlock these features. Regular users (athletes, fans) can use CombatHub for free.' },
                      { q: 'What does premium give athletes?', a: 'Athlete premium includes advanced profile stats, priority following, smart notifications, achievement badges, a personalized feed, event priority access, enhanced privacy controls, and an ad-free browsing experience.' },
                      { q: 'What is the grace period?', a: 'The grace period is a 7-day extension granted automatically after your 30-day trial expires. It gives you extra time to decide if you want to keep premium before features are locked. You will receive a notification when it starts.' },
                      { q: 'What happens to my products/data if premium expires?', a: 'Your products and data are preserved but hidden from the marketplace. Once you reactivate premium, everything is restored. Nothing is deleted.' },
                      { q: 'Can I switch payment methods?', a: 'Yes. On the payment setup page, just enter your new payment info. It will replace your existing method on file.' },
                      { q: 'I still have questions. How do I get help?', a: 'Send us a message through the app or contact support at mungailevi1@gmail.com. Premium users get priority responses.' },
                    ].map((faq, i) => (
                      <div key={i} className="rounded-xl border overflow-hidden transition-all duration-200" style={{ borderColor: 'var(--color-nike-gray)', backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)' }}>
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="flex items-center justify-between w-full px-5 py-4 text-left transition-all duration-200 hover:bg-white/5"
                        >
                          <h3 className="font-bold text-sm tracking-wide pr-4" style={{ color: 'var(--color-nike-white)' }}>{faq.q}</h3>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={'w-4 h-4 shrink-0 transition-transform duration-200 ' + (openFaq === i ? 'rotate-180' : '')}
                            style={{ color: 'var(--color-nike-light)' }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        <div className={'overflow-hidden transition-all duration-300 ' + (openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
                          <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--color-nike-light)' }}>{faq.a}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          )}

          {tab === 'about' && (
            <div className="space-y-6">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: 'var(--color-nike-light)' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>About CombatHub</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>Version {appVersion}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-nike-light)' }}>
                      CombatHub is the complete ecosystem for combat sports athletes, coaches, and gyms. Built with Django, React, and Tailwind CSS.
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-nike-gray)' }}>
                      <div className="w-10 h-10 bg-nike-red rounded-full flex items-center justify-center font-black text-sm">
                        M
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--color-nike-white)' }}>Created by Millo</p>
                        <p className="text-xs" style={{ color: 'var(--color-nike-light)' }}>Full-stack developer & combat sports enthusiast</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
