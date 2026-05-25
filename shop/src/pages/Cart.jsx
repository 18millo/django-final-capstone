import { Link } from 'react-router-dom'
import { useCart } from '../providers/CartProvider'
import { IconCart, IconPackage } from '../components/Icons'

export default function Cart() {
  const { cart, loading, updateItem, removeItem } = useCart()

  if (loading) {
    return <div className="text-sm py-20 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading cart...</div>
  }

  if (!cart || !cart.items?.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="mb-4"><IconCart size={48} /></div>
        <h2 className="text-xl font-black mb-2" style={{ color: 'var(--theme-text)' }}>Your cart is empty</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--theme-text-secondary)' }}>Add some products to get started</p>
        <Link to="/shop" className="inline-block bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm tracking-wider transition-colors">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>Cart ({cart.items.length} items)</h1>

      <div className="space-y-3">
        {cart.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-4 rounded-xl p-4 animate-slideUp glow-card" style={{ animationDelay: `${i * 0.05}s`, background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
            <div className="w-16 h-16 rounded-lg shrink-0 overflow-hidden" style={{ background: 'var(--theme-surface)' }}>
              {item.product_image ? (
                <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--theme-text-muted)' }}><IconPackage size={24} /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/shop/products/${item.product}`} className="text-sm font-bold hover:text-red-400 transition-colors" style={{ color: 'var(--theme-text)' }}>
                {item.product_name}
              </Link>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>${parseFloat(item.unit_price).toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                <button
                  onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                  className="px-2 py-1 text-sm transition-colors" style={{ color: 'var(--theme-text-secondary)' }}
                >−</button>
                <span className="px-2 py-1 text-xs font-medium min-w-[1.5rem] text-center">{item.quantity}</span>
                <button
                  onClick={() => updateItem(item.id, item.quantity + 1)}
                  className="px-2 py-1 text-sm transition-colors" style={{ color: 'var(--theme-text-secondary)' }}
                >+</button>
              </div>
              <p className="text-sm font-bold w-16 text-right">${parseFloat(item.total).toFixed(2)}</p>
              <button
                onClick={() => removeItem(item.id)}
                className="text-sm transition-colors px-1" style={{ color: 'var(--theme-text-muted)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 flex items-center justify-between" style={{ borderTop: '1px solid var(--theme-border)' }}>
        <div>
          <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Total</p>
          <p className="text-2xl font-black" style={{ color: 'var(--theme-text)' }}>${parseFloat(cart.total).toFixed(2)}</p>
        </div>
        <Link
          to="/shop/checkout"
          className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-lg text-sm tracking-wider transition-colors"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  )
}