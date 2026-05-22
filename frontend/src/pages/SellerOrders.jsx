import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { toast } from '../components/ui/Toast'

const STATUS_STYLES = {
  pending: 'bg-nike-amber/10 text-nike-amber border-nike-amber/20',
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
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
  const [tab, setTab] = useState('incoming')
  const [confirmingId, setConfirmingId] = useState(null)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'

  const fetchOrders = () => {
    api.get('/seller/orders/')
      .then((res) => setOrders(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const handleConfirm = async (orderId) => {
    setConfirmingId(orderId)
    try {
      await api.post(`/seller/orders/${orderId}/confirm/`)
      toast('Order #' + orderId + ' confirmed! Email sent to customer.', 'success')
      fetchOrders()
    } catch (err) {
      const data = err.response?.data
      toast(data?.error || 'Failed to confirm order', 'error')
    } finally {
      setConfirmingId(null)
    }
  }

  const filtered = orders.filter((o) =>
    tab === 'incoming' ? o.status === 'pending' : o.status !== 'pending'
  )

  if (loading) return <div className={'min-h-[calc(100vh-4rem)] flex items-center justify-center ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}><Spinner /></div>

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Orders</h1>
          <p className={'text-sm mt-0.5 ' + mutedClass}>Orders containing your products</p>
          <div className="flex gap-4 mt-4">
            {['incoming', 'confirmed'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={'text-xs tracking-widest uppercase font-bold px-4 py-2 rounded-full transition-all duration-200 ' +
                  (tab === t
                    ? 'bg-nike-red text-white shadow-lg shadow-nike-red/20'
                    : 'text-white/40 hover:text-white')}
              >
                {t === 'incoming' ? `Incoming (${orders.filter((o) => o.status === 'pending').length})` : `Confirmed (${orders.filter((o) => o.status !== 'pending').length})`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className={'text-center py-20 rounded-2xl border ' + borderClass + ' ' + (isLight ? 'bg-white' : 'bg-nike-dark/80')}>
            <div className="text-6xl mb-4">📦</div>
            <p className={'text-lg font-bold ' + textClass}>{tab === 'incoming' ? 'No incoming orders' : 'No confirmed orders'}</p>
            <p className={'text-sm mt-1 ' + mutedClass}>{tab === 'incoming' ? 'Orders for your products will appear here.' : 'Confirmed orders will appear here.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order, i) => (
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

                    {/* Customer Info */}
                    <div className={'mb-3 p-3 rounded-xl text-xs ' + (isLight ? 'bg-nike-gray/20' : 'bg-white/5')}>
                      <p className={'font-bold mb-1 ' + textClass}>Customer</p>
                      <p className={mutedClass}>{order.customer_display_name || order.customer_username || order.customer_email || 'N/A'}</p>
                      <p className={mutedClass}>{order.customer_email}</p>
                      {order.customer_phone && <p className={mutedClass}>{order.customer_phone}</p>}
                      {order.shipping_address && (
                        <div className="mt-1">
                          <p className={'font-bold mt-2 mb-0.5 ' + textClass}>Shipping</p>
                          <p className={mutedClass}>{order.shipping_address.line1}</p>
                          {order.shipping_address.line2 && <p className={mutedClass}>{order.shipping_address.line2}</p>}
                          <p className={mutedClass}>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                          <p className={mutedClass}>{order.shipping_address.country}</p>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className={'text-xs space-y-1 ' + mutedClass}>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span>{item.product_name} × {item.quantity}</span>
                          <span className={'font-bold ' + textClass}>${parseFloat(item.total || item.unit_price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className={'flex items-center justify-between mt-3 pt-3 border-t ' + borderClass}>
                      <span className={'text-sm font-bold ' + textClass}>Total: ${parseFloat(order.total).toFixed(2)}</span>
                      {order.status === 'pending' && (
                        <Button
                          onClick={() => handleConfirm(order.id)}
                          loading={confirmingId === order.id}
                          className="text-xs px-4 py-1.5"
                        >
                          Confirm Order
                        </Button>
                      )}
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
