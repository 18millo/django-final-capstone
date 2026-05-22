import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import { useCart } from '../providers/CartProvider'
import { useAuth } from '../providers/AuthProvider'
import api from '../utils/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'
import Spinner from '../components/ui/Spinner'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

const BG = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80'

export default function Checkout() {
  const { theme } = useTheme()
  const { cart, loading, itemCount } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isLight = theme === 'light'

  const [paymentMethod, setPaymentMethod] = useState('')
  const [mpesaPhone, setMpesaPhone] = useState('')

  useEffect(() => {
    if (user?.profile?.phone) {
      setMpesaPhone(user.profile.phone)
    }
  }, [user?.profile?.phone])
  const [visaCard, setVisaCard] = useState('')
  const [visaExpiry, setVisaExpiry] = useState('')
  const [visaCvv, setVisaCvv] = useState('')
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', zip: '', country: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const bgClass = isLight ? 'bg-white' : 'bg-nike-dark'

  if (loading) return <div className={'min-h-screen flex items-center justify-center ' + (isLight ? 'bg-white' : 'bg-nike-black')}><Spinner /></div>

  const items = cart?.items || []
  const subtotal = items.reduce((s, i) => s + parseFloat(i.total || '0'), 0)
  const shipping = subtotal >= 100 ? 0 : 9.99
  const total = subtotal + shipping

  const handlePlaceOrder = async () => {
    setError('')
    const required = ['line1', 'city', 'state', 'zip', 'country']
    const missing = required.filter((f) => !address[f]?.trim())
    if (missing.length) { setError('Please fill in all required shipping address fields: ' + missing.join(', ') + '.'); return }
    if (!paymentMethod) { setError('Select a payment method.'); return }
    if (paymentMethod === 'mpesa' && (!user?.profile?.phone || user.profile.phone.length < 10)) { setError('Set your phone number in Settings before using M-Pesa.'); return }
    if (paymentMethod === 'visa' && visaCard.replace(/\s/g, '').length < 16) { setError('Enter a valid card number.'); return }

    playClick()
    setSubmitting(true)
    try {
      const payload = {
        payment_method: paymentMethod,
        mpesa_phone: paymentMethod === 'mpesa' ? mpesaPhone : '',
        visa_last_four: paymentMethod === 'visa' ? visaCard.replace(/\s/g, '').slice(-4) : '',
        shipping_address: address,
      }
      const res = await api.post('/checkout/', payload)
      playSuccess()
      toast('Order placed! Payment is pending.', 'success')
      navigate('/orders/' + res.data.id)
    } catch (err) {
      const data = err.response?.data
      setError(data?.error || Object.values(data || {}).flat()[0] || 'Checkout failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Checkout</h1>
            <p className={'text-sm mt-1 ' + mutedClass}>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/cart" className={'text-xs tracking-widest uppercase font-bold transition-colors ' + mutedClass + ' hover:text-nike-red'}>← Back to Cart</Link>
        </div>

        {error && (
          <div className="bg-nike-red/10 border border-nike-red/20 text-nike-red px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left — forms */}
          <div className="lg:col-span-3 space-y-6">
            <Reveal>
              <div className={'p-6 rounded-2xl border ' + borderClass + ' ' + bgClass}>
                <h3 className={'text-sm font-black tracking-tight mb-4 ' + textClass}>Shipping Address</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input label="Address Line 1" type="text" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="123 Main St" />
                  </div>
                  <div className="md:col-span-2">
                    <Input label="Address Line 2" type="text" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} placeholder="Apt, suite, etc. (optional)" />
                  </div>
                  <Input label="City" type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City" />
                  <Input label="State" type="text" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} placeholder="State" />
                  <Input label="ZIP Code" type="text" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} placeholder="12345" />
                  <Input label="Country" type="text" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} placeholder="Country" />
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className={'p-6 rounded-2xl border ' + borderClass + ' ' + bgClass}>
                <h3 className={'text-sm font-black tracking-tight mb-4 ' + textClass}>Payment Method</h3>

                <div className="space-y-3 mb-6">
                  <label
                    onClick={() => setPaymentMethod('mpesa')}
                    className={'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ' +
                      (paymentMethod === 'mpesa'
                        ? 'border-nike-red bg-nike-red/5'
                        : borderClass + ' hover:bg-white/[0.02]')}
                  >
                    <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center ' +
                      (paymentMethod === 'mpesa' ? 'border-nike-red' : borderClass)}>
                      {paymentMethod === 'mpesa' && <div className="w-2.5 h-2.5 rounded-full bg-nike-red" />}
                    </div>
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className={'text-sm font-bold ' + textClass}>MPesa</p>
                      <p className={'text-xs ' + mutedClass}>Pay with mobile money</p>
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('visa')}
                    className={'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ' +
                      (paymentMethod === 'visa'
                        ? 'border-nike-red bg-nike-red/5'
                        : borderClass + ' hover:bg-white/[0.02]')}
                  >
                    <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center ' +
                      (paymentMethod === 'visa' ? 'border-nike-red' : borderClass)}>
                      {paymentMethod === 'visa' && <div className="w-2.5 h-2.5 rounded-full bg-nike-red" />}
                    </div>
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className={'text-sm font-bold ' + textClass}>Visa / Card</p>
                      <p className={'text-xs ' + mutedClass}>Pay with debit or credit card</p>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'mpesa' && (
                  <div className={'p-4 rounded-xl border ' + borderClass + ' bg-white/[0.02]'}>
                    <Input
                      label="MPesa Phone Number"
                      type="tel"
                      value={mpesaPhone}
                      disabled
                      placeholder={user?.profile?.phone ? '' : 'Set phone in Settings first'}
                    />
                    <p className={'text-xs mt-1.5 ' + mutedClass}>Uses your profile phone number</p>
                  </div>
                )}

                {paymentMethod === 'visa' && (
                  <div className={'p-4 rounded-xl border ' + borderClass + ' bg-white/[0.02] space-y-3'}>
                    <Input
                      label="Card Number"
                      type="text"
                      value={visaCard}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
                        const formatted = raw.replace(/(.{4})/g, '$1 ').trim()
                        setVisaCard(formatted)
                      }}
                      placeholder="4242 4242 4242 4242"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Expiry"
                        type="text"
                        value={visaExpiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                          if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
                          setVisaExpiry(v)
                        }}
                        placeholder="MM/YY"
                      />
                      <Input
                        label="CVV"
                        type="text"
                        value={visaCvv}
                        onChange={(e) => setVisaCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                      />
                    </div>
                    <p className={'text-xs ' + mutedClass}>Payment will be processed later. Your card is not charged yet.</p>
                  </div>
                )}

                <p className={'text-xs mt-3 text-center ' + mutedClass}>
                  💳 No real payments are processed yet — this is a demo.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Right — summary */}
          <div className="lg:col-span-2">
            <Reveal>
              <div className={'p-6 rounded-2xl border ' + borderClass + ' ' + bgClass + ' sticky top-24'}>
                <h3 className={'text-sm font-black tracking-tight mb-4 ' + textClass}>Order Summary</h3>

                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-nike-gray/20">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🥊</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={'text-xs font-bold truncate ' + textClass}>{item.product_name}</p>
                        <p className={'text-xs ' + mutedClass}>Qty: {item.quantity}</p>
                      </div>
                      <p className={'text-xs font-bold ' + textClass}>${parseFloat(item.total).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className={'border-t pt-4 space-y-2 ' + borderClass}>
                  <div className="flex justify-between text-sm">
                    <span className={mutedClass}>Subtotal</span>
                    <span className={textClass}>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={mutedClass}>Shipping</span>
                    <span className={textClass}>{shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span>
                  </div>
                  <div className={'flex justify-between text-lg font-black border-t pt-2 ' + borderClass}>
                    <span className={textClass}>Total</span>
                    <span className="text-nike-red">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  loading={submitting}
                  className="w-full mt-6"
                  disabled={items.length === 0}
                >
                  Place Order
                </Button>

                <p className={'text-xs text-center mt-3 ' + mutedClass}>
                  By placing this order you agree to our Terms of Service.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  )
}