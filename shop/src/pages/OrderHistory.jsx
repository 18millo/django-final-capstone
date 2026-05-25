import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconClipboard } from '../components/Icons'
import api from '../api'

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-400',
  confirmed: 'bg-blue-500/10 text-blue-400',
  paid: 'bg-emerald-500/10 text-emerald-400',
  shipped: 'bg-cyan-500/10 text-cyan-400',
  delivered: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/')
      .then(({ data }) => setOrders(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-sm py-20 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading orders...</div>
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="mb-4"><IconClipboard size={48} /></div>
        <h2 className="text-xl font-black mb-2" style={{ color: 'var(--theme-text)' }}>No orders yet</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--theme-text-secondary)' }}>Your order history will appear here</p>
        <Link to="/" className="inline-block bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm tracking-wider transition-colors">
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>My Orders</h1>
      <div className="space-y-3">
        {orders.map((order, i) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="flex items-center justify-between rounded-xl p-4 animate-slideUp glow-card hover:border-zinc-700 transition-colors"
            style={{ animationDelay: `${i * 0.05}s`, background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>Order #{order.id}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[order.status] || ''}`}
                  style={!statusColors[order.status] ? { background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' } : {}}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} — {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">${parseFloat(order.total).toFixed(2)}</p>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>→</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
