import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'

const STATUS_STYLES = {
  pending: 'bg-nike-amber/10 text-nike-amber border-nike-amber/20',
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  shipped: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delivered: 'bg-nike-red/10 text-nike-red border-nike-red/20',
  cancelled: 'bg-white/5 text-white/30 border-white/10',
}

export default function SellerOrders() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'

  useEffect(() => {
    api.get('/seller/orders/')
      .then((res) => setOrders(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={'min-h-[calc(100vh-4rem)] flex items-center justify-center ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}><Spinner /></div>

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Incoming Orders</h1>
          <p className={'text-sm mt-0.5 ' + mutedClass}>Orders containing your products</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {orders.length === 0 ? (
          <div className={'text-center py-20 rounded-2xl border ' + borderClass + ' ' + (isLight ? 'bg-white' : 'bg-nike-dark/80')}>
            <div className="text-6xl mb-4">📦</div>
            <p className={'text-lg font-bold ' + textClass}>No orders yet</p>
            <p className={'text-sm mt-1 ' + mutedClass}>Orders for your products will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <Reveal key={order.id} delay={i * 40}>
                <div className={'rounded-2xl border overflow-hidden transition-all ' + borderClass + ' ' + (isLight ? 'bg-white' : 'bg-nike-dark/80')}>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className={'text-lg font-bold ' + textClass}>Order #{order.id}</p>
                        <p className={'text-xs mt-0.5 ' + mutedClass}>{new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}</p>
                      </div>
                      <span className={'text-[10px] tracking-widest uppercase font-bold px-3 py-1 rounded-full border ' + (STATUS_STYLES[order.status] || STATUS_STYLES.pending)}>
                        {order.status}
                      </span>
                    </div>
                    <div className={'text-xs space-y-1 ' + mutedClass}>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span>{item.product_name} × {item.quantity}</span>
                          <span className={'font-bold ' + textClass}>${parseFloat(item.total || item.unit_price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className={'flex items-center justify-between mt-3 pt-3 border-t ' + borderClass}>
                      <span className={'text-xs ' + mutedClass}>
                        {order.shipping_address?.name || order.user?.email || 'No customer info'}
                      </span>
                      <span className={'text-sm font-bold ' + textClass}>Total: ${parseFloat(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}