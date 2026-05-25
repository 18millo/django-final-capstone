import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { IconPackage, IconCheck, IconAlert, IconTag, IconClipboard, IconDollar, IconUsers, IconPlus } from '../components/Icons'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/shop/dashboard/')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-sm py-12 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading dashboard...</div>
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-secondary)' }}>Could not load dashboard.</p>
        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Make sure you have a Premium subscription to access the dashboard.</p>
      </div>
    )
  }

  const cards = [
    { label: 'Total Products', value: data.total_products, icon: IconPackage, color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
    { label: 'In Stock', value: data.in_stock_count, icon: IconCheck, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
    { label: 'Low Stock', value: data.low_stock_count, icon: IconAlert, color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
    { label: 'On Discount', value: data.on_discount_count, icon: IconTag, color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
    { label: 'Recent Orders', value: data.recent_orders_count, icon: IconClipboard, color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
    { label: 'Total Revenue', value: `$${data.total_revenue}`, icon: IconDollar, color: 'bg-red-500/10 border-red-500/20 text-red-400' },
    { label: 'Followers', value: data.follower_count, icon: IconUsers, color: 'bg-pink-500/10 border-pink-500/20 text-pink-400' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div key={card.label} className={`rounded-xl border p-4 animate-slideUp glow-card ${card.color}`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="mb-2"><card.icon size={24} /></div>
            <div className="text-2xl font-black">{card.value}</div>
            <div className="text-xs mt-1 opacity-70">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/vendor/products/new"
          className="rounded-xl p-5 hover:border-zinc-700 transition-colors"
          style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-bg-secondary)' }}
        >
          <div className="mb-2"><IconPlus size={24} /></div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>Add New Product</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>Create a new product listing</p>
        </Link>
        <Link
          to="/orders"
          className="rounded-xl p-5 hover:border-zinc-700 transition-colors"
          style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-bg-secondary)' }}
        >
          <div className="mb-2"><IconClipboard size={24} /></div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>View Orders</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>Manage incoming orders</p>
        </Link>
      </div>
    </div>
  )
}