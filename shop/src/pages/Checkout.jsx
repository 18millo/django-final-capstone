import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { useCart } from '../providers/CartProvider'
import { IconCart } from '../components/Icons'

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, fetchCart } = useCart()
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
    setProcessing(true)
    try {
      const res = await api.post('/checkout/', {
        payment_method: 'paystack',
        shipping_address: address,
      })
      if (res.data.paystack) {
        window.location.href = res.data.authorization_url
        return
      }
      await fetchCart()
      navigate('/shop/orders')
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Checkout failed'
      setError(typeof msg === 'string' ? msg : 'Checkout failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

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

        <div className="rounded-xl p-5 animate-slideUp animate-delay-200" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Payment</h3>
          <div className="rounded-lg border border-dashed p-4" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>Pay with Paystack</p>
                <p className="text-[10px]" style={{ color: 'var(--theme-text-secondary)' }}>Secured by Paystack</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              You will be redirected to Paystack's secure checkout to complete your payment using card, mobile money, or bank transfer.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-sm tracking-wider transition-colors"
        >
          {processing ? 'Redirecting...' : `Pay $${parseFloat(cart.total).toFixed(2)} with Paystack`}
        </button>
      </form>
    </div>
  )
}
