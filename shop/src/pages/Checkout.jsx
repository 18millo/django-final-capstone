import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { useCart } from '../providers/CartProvider'
import { IconCart } from '../components/Icons'

function formatCardNumber(val) {
  const digits = val.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

function detectCardBrand(number) {
  const cleaned = number.replace(/\D/g, '')
  if (/^4/.test(cleaned)) return 'Visa'
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard'
  if (/^3[47]/.test(cleaned)) return 'Amex'
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover'
  return ''
}

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, fetchCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState('')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', zip: '', country: '' })
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  if (!cart || !cart.items?.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="mb-4"><IconCart size={48} /></div>
        <h2 className="text-xl font-black mb-2" style={{ color: 'var(--theme-text)' }}>Nothing to checkout</h2>
        <Link to="/shop" className="text-sm text-red-400 hover:text-red-300">Browse products</Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!paymentMethod) { setError('Select a payment method'); return }
    setProcessing(true)
    try {
      const payload = {
        payment_method: paymentMethod,
        mpesa_phone: paymentMethod === 'mpesa' ? mpesaPhone : '',
        visa_last_four: paymentMethod === 'visa' ? cardNumber.replace(/\D/g, '').slice(-4) : '',
        shipping_address: address,
      }
      await api.post('/checkout/', payload)
      await fetchCart()
      navigate('/shop/orders')
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Checkout failed'
      setError(typeof msg === 'string' ? msg : 'Checkout failed')
    } finally {
      setProcessing(false)
    }
  }

  const cardBrand = detectCardBrand(cardNumber)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Order summary */}
        <div className="rounded-xl p-5 animate-slideUp" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Order Summary</h3>
          <div className="space-y-2">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.product_name} <span style={{ color: 'var(--theme-text-secondary)' }}>x{item.quantity}</span></span>
                <span>${parseFloat(item.total).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex items-center justify-between font-bold" style={{ borderTop: '1px solid var(--theme-border)' }}>
            <span>Total</span>
            <span>${parseFloat(cart.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping address */}
        <div className="rounded-xl p-5 animate-slideUp animate-delay-100" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Shipping Address</h3>
          <div className="space-y-3">
            <input required placeholder="Address line 1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            <input placeholder="Address line 2 (optional)" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })}
              className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
              <input required placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="ZIP code" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
              <input required placeholder="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-xl p-5 animate-slideUp animate-delay-200" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Payment Method</h3>
          <div className="space-y-3">
            {/* MPesa */}
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'mpesa' ? 'border-red-500/30 bg-red-500/5' : ''}`}
              style={paymentMethod === 'mpesa' ? {} : { border: '1px solid var(--theme-border)' }}>
              <input type="radio" name="payment" value="mpesa" checked={paymentMethod === 'mpesa'} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-red-500" />
              <div>
                <span className="text-sm font-semibold">MPesa</span>
                <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>Mobile money</p>
              </div>
            </label>
            {paymentMethod === 'mpesa' && (
              <input required placeholder="Phone number" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            )}

            {/* Card */}
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'visa' ? 'border-red-500/30 bg-red-500/5' : ''}`}
              style={paymentMethod === 'visa' ? {} : { border: '1px solid var(--theme-border)' }}>
              <input type="radio" name="payment" value="visa" checked={paymentMethod === 'visa'} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-red-500" />
              <div>
                <span className="text-sm font-semibold">Credit / Debit Card</span>
                <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>Visa, Mastercard, Amex</p>
              </div>
            </label>

            {paymentMethod === 'visa' && (
              <div className="space-y-4 mt-4">
                {/* Card preview */}
                <div className="relative rounded-xl p-5 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', minHeight: '160px' }}>
                  <div className="absolute top-4 right-4 text-xs font-bold opacity-60">
                    {cardBrand || 'CARD'}
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 space-y-3">
                    <div className="text-lg tracking-[4px] font-mono">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex gap-8 text-[10px]">
                      <div>
                        <p className="opacity-60 uppercase tracking-wider mb-0.5">Card Holder</p>
                        <p className="text-sm font-semibold tracking-wide">{cardName || 'Your Name'}</p>
                      </div>
                      <div>
                        <p className="opacity-60 uppercase tracking-wider mb-0.5">Expires</p>
                        <p className="text-sm font-semibold">{cardExpiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold mb-1 block" style={{ color: 'var(--theme-text-secondary)' }}>Card Number</label>
                  <input required placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
                    style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold mb-1 block" style={{ color: 'var(--theme-text-secondary)' }}>Expiry Date</label>
                    <input required placeholder="MM/YY" maxLength={5} value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
                      style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold mb-1 block" style={{ color: 'var(--theme-text-secondary)' }}>CVV</label>
                    <input required placeholder="123" maxLength={4} value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
                      style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold mb-1 block" style={{ color: 'var(--theme-text-secondary)' }}>Cardholder Name</label>
                  <input required placeholder="John Doe" value={cardName} onChange={(e) => setCardName(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
                    style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
                </div>
                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>No real payments are processed — this is a demo.</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-sm tracking-wider transition-colors"
        >
          {processing ? 'Processing...' : `Pay $${parseFloat(cart.total).toFixed(2)}`}
        </button>
      </form>
    </div>
  )
}