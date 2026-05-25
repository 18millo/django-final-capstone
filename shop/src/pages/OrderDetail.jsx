import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { useTheme } from '../providers/ThemeProvider'
import { IconCheck, IconArrowLeft } from '../components/Icons'

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get(`/shop/orders/${id}/`)
      .then(({ data }) => setOrder(data))
      .catch(() => navigate('/vendor/orders'))
      .finally(() => setLoading(false))
  }, [id])

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await api.post(`/shop/orders/${id}/confirm/`)
      setMessage('Order confirmed')
      setOrder((prev) => ({ ...prev, status: 'confirmed' }))
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to confirm')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return <div className="text-sm py-12 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading order...</div>
  }

  if (!order) return null

  return (
    <div>
      <button onClick={() => navigate('/vendor/orders')} className="flex items-center gap-1 text-xs mb-4 transition-colors hover:[color:var(--theme-text)]" style={{ color: 'var(--theme-text-secondary)' }}>
        <IconArrowLeft size={14} /> Back to Orders
      </button>
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>Order #{order.id}</h1>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-lg mb-4 ${message === 'Order confirmed' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-xl p-5" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Order Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--theme-text-secondary)' }}>Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.status] || ''}`}>{order.status}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--theme-text-secondary)' }}>Payment</span><span>{order.payment_method || '—'}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--theme-text-secondary)' }}>Total</span><span className="font-bold">${parseFloat(order.total).toFixed(2)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--theme-text-secondary)' }}>Date</span><span>{new Date(order.created_at).toLocaleString()}</span></div>
          </div>
        </div>

        {order.items && (
          <div className="rounded-xl p-5" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Items</h3>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.product_name} <span style={{ color: 'var(--theme-text-secondary)' }}>x{item.quantity}</span></span>
                  <span>${parseFloat(item.total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.shipping_address && (
          <div className="rounded-xl p-5" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Shipping Address</h3>
            <p className="text-sm">{order.shipping_address.line1}</p>
            {order.shipping_address.line2 && <p className="text-sm">{order.shipping_address.line2}</p>}
            <p className="text-sm">{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
            <p className="text-sm">{order.shipping_address.country}</p>
          </div>
        )}

        {order.status === 'pending' && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg text-sm tracking-wider transition-colors"
          >
            <IconCheck size={16} /> {confirming ? 'Confirming...' : 'Confirm Order'}
          </button>
        )}
      </div>
    </div>
  )
}