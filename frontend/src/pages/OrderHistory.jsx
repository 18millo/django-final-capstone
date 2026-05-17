import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

export default function OrderHistory() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/')
      .then((res) => setOrders(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={'min-h-screen flex items-center justify-center ' + (isLight ? 'bg-white' : 'bg-nike-black')}><Spinner /></div>

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <h1 className={'text-2xl font-black tracking-tight mb-2 ' + (isLight ? 'text-nike-black' : 'text-white')}>Order History</h1>
        <p className={'text-sm mb-8 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>View all your past and current orders.</p>

        {orders.length === 0 ? (
          <div className={'text-center py-20 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
            <div className="text-6xl mb-4">📦</div>
            <p className={'text-lg font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>No orders yet</p>
            <p className="text-sm mt-1">Your purchases will appear here.</p>
            <Link to="/shop" className="inline-block mt-6 bg-nike-red text-white hover:bg-white hover:text-nike-black px-8 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <Reveal key={order.id} delay={i * 80}>
                <Link to={'/orders/' + order.id} className={'block p-6 rounded-2xl border transition-all duration-200 hover:scale-[1.005] ' + (isLight ? 'bg-white border-nike-gray shadow-sm hover:shadow-md' : 'bg-nike-dark border-white/5')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>#{order.id}</span>
                      <span className={'text-xs px-3 py-1 rounded-full border font-bold tracking-wider uppercase ' + (STATUS_STYLES[order.status] || STATUS_STYLES.pending)}>{order.status}</span>
                    </div>
                    <span className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</p>
                    <p className="text-base font-black text-nike-red">${parseFloat(order.total).toFixed(2)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
