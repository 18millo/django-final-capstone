import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import { useCart } from '../providers/CartProvider'
import api from '../utils/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Reveal from '../components/ui/Reveal'
import Spinner from '../components/ui/Spinner'
import { playClick } from '../utils/sounds'
import { IconBoxingGlove, IconCreditCard } from '../components/Icons'


const BG = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80'

export default function Checkout() {
  const { theme } = useTheme()
  const { cart, loading, itemCount } = useCart()
  const navigate = useNavigate()
  const isLight = theme === 'light'

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

    playClick()
    setSubmitting(true)
    try {
      const res = await api.post('/checkout/', {
        payment_method: 'paystack',
        shipping_address: address,
      })

      if (res.data.paystack) {
        sessionStorage.setItem('paystack_ref', res.data.reference)
        window.location.href = res.data.authorization_url
        return
      }
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
                <h3 className={'text-sm font-black tracking-tight mb-4 ' + textClass}>Payment</h3>
                <div className={'p-4 rounded-xl border border-dashed ' + borderClass + ' bg-nike-red/5'}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-nike-red/10 rounded-full flex items-center justify-center shrink-0">
                      <IconCreditCard className="w-5 h-5 text-nike-red" />
                    </div>
                    <div>
                      <p className={'text-sm font-bold ' + textClass}>Pay with Paystack</p>
                      <p className={'text-[10px] ' + mutedClass}>Secured by Paystack</p>
                    </div>
                  </div>
                  <p className={'text-xs ' + mutedClass}>
                    You will be redirected to Paystack's secure checkout to complete your payment using card, mobile money, or bank transfer.
                  </p>
                </div>
                <p className={'text-xs mt-3 text-center ' + mutedClass}>
                  <IconCreditCard className="w-4 h-4" /> Payments are processed securely via Paystack.
                </p>
              </div>
            </Reveal>
          </div>

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
                          <div className="w-full h-full flex items-center justify-center text-lg"><IconBoxingGlove className="w-4 h-4" /></div>
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
                  Pay with Paystack
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
