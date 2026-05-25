import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { IconPackage, IconCheck, IconClipboard, IconPlus, IconChevronRight } from '../components/Icons'

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/shop/orders/')
      .then(({ data }) => setOrders(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-sm py-12 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading orders...</div>
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl" style={{ border: '1px solid var(--theme-border)' }}>
        <div className="mb-3"><IconClipboard size={36} /></div>
        <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>No orders yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>Orders will appear here when customers purchase your products</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>Orders</h1>

      <div className="space-y-2">
        {orders.map((order, i) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="flex items-center gap-4 rounded-xl p-4 animate-slideUp glow-card hover:border-zinc-700 transition-colors"
            style={{ animationDelay: `${i * 0.05}s`, background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>Order #{order.id}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusColors[order.status] || ''}`}
                  style={!statusColors[order.status] ? { background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' } : {}}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                <span>{order.customer_display_name || order.customer_email}</span>
                <span>${parseFloat(order.total).toFixed(2)}</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <IconChevronRight />
          </Link>
        ))}
      </div>
    </div>
  )
}