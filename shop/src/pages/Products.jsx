import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { IconTag, IconEye, IconEdit, IconTrash, IconPackage } from '../components/Icons'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = () => {
    setLoading(true)
    api.get('/shop/products/')
      .then(({ data }) => setProducts(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const toggleDiscount = async (id) => {
    try {
      await api.post(`/shop/products/${id}/toggle-discount/`)
      fetchProducts()
    } catch {}
  }

  const toggleVisibility = async (id) => {
    try {
      await api.post(`/shop/products/${id}/toggle-visibility/`)
      fetchProducts()
    } catch {}
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/shop/products/${id}/`)
      fetchProducts()
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Products</h1>
        <Link
          to="/vendor/products/new"
          className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg tracking-wider transition-colors"
        >
          + New Product
        </Link>
      </div>

      {loading ? (
        <div className="text-sm py-12 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ border: '1px solid var(--theme-border)' }}>
          <div className="mb-3"><IconPackage size={36} /></div>
          <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>No products yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>Create your first product to start selling</p>
          <Link
            to="/vendor/products/new"
            className="inline-block mt-4 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors"
          >
            Add Product
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 rounded-xl p-4 animate-slideUp glow-card hover:border-zinc-700 transition-colors"
              style={{ animationDelay: `${i * 0.03}s`, background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
              <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden" style={{ background: 'var(--theme-surface)' }}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--theme-text-muted)' }}><IconPackage size={20} /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold truncate" style={{ color: 'var(--theme-text)' }}>{p.name}</h3>
                  {p.discount_active && (
                    <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-bold">
                      -{p.discount_percent}%
                    </span>
                  )}
                  {!p.is_visible && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  <span>${parseFloat(p.price).toFixed(2)}</span>
                  <span>Stock: {p.stock}</span>
                  {p.serial_number && <span style={{ color: 'var(--theme-text-muted)' }}>{p.serial_number}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleDiscount(p.id)}
                  className={`text-xs px-2 py-1.5 rounded-lg font-bold transition-colors ${p.discount_active ? 'bg-purple-500/10 text-purple-400' : 'hover:text-zinc-300'}`}
                  style={!p.discount_active ? { background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' } : {}}
                  title="Toggle discount"
                >
                  <IconTag size={14} />
                </button>
                <button
                  onClick={() => toggleVisibility(p.id)}
                  className={`text-xs px-2 py-1.5 rounded-lg font-bold transition-colors ${!p.is_visible ? 'bg-amber-500/10 text-amber-400' : 'hover:text-zinc-300'}`}
                  style={p.is_visible ? { background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' } : {}}
                  title={p.is_visible ? 'Hide from customers' : 'Show to customers'}
                >
                  <IconEye size={14} />
                </button>
                <Link
                  to={`/vendor/products/${p.id}/edit`}
                  className="text-xs px-2 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' }}
                  title="Edit"
                >
                  <IconEdit size={14} />
                </Link>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="text-xs px-2 py-1.5 rounded-lg transition-colors hover:text-red-400"
                  style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' }}
                  title="Delete"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}