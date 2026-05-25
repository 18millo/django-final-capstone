import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function CustomerOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/orders/${id}/`)
      .then(({ data }) => setOrder(data))
      .catch(() => navigate('/orders'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="text-sm py-20 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading order...</div>
  }
  if (!order) return null

  const addr = order.shipping_address || {}

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/orders" className="text-xs mb-4 inline-block transition-colors hover:[color:var(--theme-text)]" style={{ color: 'var(--theme-text-secondary)' }}>
        ← Back to Orders
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Order #{order.id}</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${statusColors[order.status] || ''}`}
          style={!statusColors[order.status] ? { background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' } : {}}>
          {order.status}
        </span>
      </div>

      <div className="space-y-4">
        {/* Items */}
        <div className="rounded-xl p-5 animate-slideUp" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Items</h3>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{item.product_name || 'Product'}</span>
                  <span className="ml-2" style={{ color: 'var(--theme-text-secondary)' }}>x{item.quantity || 1}</span>
                </div>
                <span>${parseFloat(item.total || item.price || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex items-center justify-between text-sm font-bold" style={{ borderTop: '1px solid var(--theme-border)' }}>
            <span>Total</span>
            <span>${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping */}
        {addr.line1 && (
          <div className="rounded-xl p-5 animate-slideUp animate-delay-100" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Shipping Address</h3>
            <p className="text-sm">{addr.line1}</p>
            {addr.line2 && <p className="text-sm">{addr.line2}</p>}
            <p className="text-sm">{[addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}</p>
            {addr.country && <p className="text-sm">{addr.country}</p>}
          </div>
        )}

        {/* Payment */}
        <div className="rounded-xl p-5 animate-slideUp animate-delay-200" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-secondary)' }}>Payment</h3>
          <p className="text-sm"><span style={{ color: 'var(--theme-text-secondary)' }}>Method:</span> {order.payment_method?.toUpperCase() || 'N/A'}</p>
          {order.mpesa_phone && <p className="text-sm mt-1"><span style={{ color: 'var(--theme-text-secondary)' }}>Phone:</span> {order.mpesa_phone}</p>}
          <p className="text-sm mt-1"><span style={{ color: 'var(--theme-text-secondary)' }}>Date:</span> {new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
