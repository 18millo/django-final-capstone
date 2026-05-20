import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'

const BG = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80'

const STATUS_STYLES = {
  pending: 'bg-nike-amber/10 text-nike-amber border-nike-amber/20',
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  shipped: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delivered: 'bg-nike-red/10 text-nike-red border-nike-red/20',
  cancelled: 'bg-white/5 text-white/30 border-white/10',
}

export default function OrderDetail() {
  const { id } = useParams()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/' + id + '/')
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className={'min-h-screen flex items-center justify-center ' + (isLight ? 'bg-white' : 'bg-nike-black')}><Spinner /></div>
  if (!order) return <div className={'min-h-screen flex items-center justify-center ' + (isLight ? 'bg-white' : 'bg-nike-black')}><p className={'text-sm ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Order not found</p></div>

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <Link to="/orders" className={'inline-flex items-center gap-1 text-xs tracking-widest uppercase font-bold mb-6 transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Orders
        </Link>

        <div className={'p-6 md:p-8 rounded-2xl border liquid-glass-card ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className={'text-xl font-black tracking-tight ' + (isLight ? 'text-nike-black' : 'text-white')}>Order #{order.id}</h1>
              <p className={'text-sm mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Placed on {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <span className={'inline-block px-4 py-2 rounded-xl text-xs tracking-widest uppercase font-bold border ' + (STATUS_STYLES[order.status] || STATUS_STYLES.pending)}>{order.status}</span>
          </div>

          <div className={'mb-8 p-4 rounded-xl ' + (isLight ? 'bg-nike-gray/20' : 'bg-white/5')}>
            <p className={'text-xs tracking-widest uppercase font-bold mb-1 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Shipping Address</p>
            <p className={'text-sm ' + (isLight ? 'text-nike-black' : 'text-white')}>
              {order.shipping_address ? (
                <>
                  {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
                </>
              ) : 'No address provided'}
            </p>
          </div>

          <div className="space-y-3">
            <p className={'text-xs tracking-widest uppercase font-bold mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Items</p>
            {(order.items || []).map((item, i) => (
              <Reveal key={i} delay={i * 50}>
                <div className={'flex items-center justify-between p-4 rounded-xl ' + (isLight ? 'bg-nike-gray/20' : 'bg-white/5')}>
                  <div>
                    <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{item.product_name}</p>
                    <p className={'text-xs mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Qty: {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}</p>
                    {item.variant && <p className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/20')}>{item.variant}</p>}
                  </div>
                  <p className={'text-sm font-black ' + (isLight ? 'text-nike-black' : 'text-white')}>${parseFloat(item.total).toFixed(2)}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className={'mt-8 pt-6 border-t flex items-center justify-between ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
            <span className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Total</span>
            <span className="text-xl font-black text-nike-red">${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/shop" className={'inline-flex items-center gap-2 text-xs tracking-widest uppercase font-bold transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')}>
            Continue Shopping <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
