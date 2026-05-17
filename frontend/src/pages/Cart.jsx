import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import { useCart } from '../providers/CartProvider'
import Spinner from '../components/ui/Spinner'
import { playClick } from '../utils/sounds'

const BG = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80'

export default function Cart() {
  const { theme } = useTheme()
  const { cart, loading, itemCount, updateItem, removeItem } = useCart()
  const isLight = theme === 'light'
  const navigate = useNavigate()

  if (loading) return <div className={'min-h-screen flex items-center justify-center ' + (isLight ? 'bg-white' : 'bg-nike-black')}><Spinner /></div>

  const items = cart?.items || []
  const total = items.reduce((s, i) => s + parseFloat(i.total || '0'), 0)

  const handleCheckout = () => {
    playClick()
    navigate('/checkout')
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={'text-2xl font-black tracking-tight ' + (isLight ? 'text-nike-black' : 'text-white')}>Cart</h1>
            <p className={'text-sm mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/shop" className={'text-xs tracking-widest uppercase font-bold transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')}>Continue Shopping →</Link>
        </div>

        {items.length === 0 ? (
          <div className={'text-center py-20 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
            <div className="text-6xl mb-4">🛒</div>
            <p className={'text-lg font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Your cart is empty</p>
            <p className="text-sm mt-1">Add some gear to get started.</p>
            <Link to="/shop" className="inline-block mt-6 bg-nike-red text-white hover:bg-white hover:text-nike-black px-8 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">Shop Now</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className={'flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.005] ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 bg-nike-gray/20">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🥊</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={'/shop/' + item.product} className={'text-sm font-bold truncate block hover:text-nike-red transition-colors ' + (isLight ? 'text-nike-black' : 'text-white')}>{item.product_name}</Link>
                  <p className={'text-xs mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>${parseFloat(item.unit_price).toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={'flex items-center rounded-xl border overflow-hidden ' + (isLight ? 'border-nike-gray' : 'border-white/10')}>
                    <button onClick={() => { playClick(); updateItem(item.id, Math.max(1, item.quantity - 1)) }} className={'w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}>−</button>
                    <span className={'w-10 text-center text-xs font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{item.quantity}</span>
                    <button onClick={() => { playClick(); updateItem(item.id, item.quantity + 1) }} className={'w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}>+</button>
                  </div>
                </div>
                <p className={'text-sm font-black w-20 text-right ' + (isLight ? 'text-nike-black' : 'text-white')}>${parseFloat(item.total).toFixed(2)}</p>
                <button
                  onClick={() => { playClick(); removeItem(item.id) }}
                  className={'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ' + (isLight ? 'hover:bg-red-50 text-nike-light hover:text-red-500' : 'hover:bg-red-900/20 text-white/30 hover:text-red-400')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            ))}

            <div className={'p-6 rounded-2xl border ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
              <div className="flex items-center justify-between text-sm">
                <span className={'font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Total</span>
                <span className="text-xl font-black text-nike-red">${total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-nike-red text-white hover:bg-white hover:text-nike-black px-8 py-4 rounded-xl text-sm tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30 hover:shadow-none"
              >
                Proceed to Checkout
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
