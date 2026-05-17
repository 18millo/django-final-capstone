import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

export default function VendorDashboard() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [togglingDiscount, setTogglingDiscount] = useState(null)

  const fetchProducts = () => {
    setLoading(true)
    api.get('/vendor/products/')
      .then((res) => setProducts(res.data.results || res.data || []))
      .catch(() => toast('Failed to load products', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (productId) => {
    if (!confirm('Delete this product?')) return
    setDeleting(productId)
    playClick()
    try {
      await api.delete('/vendor/products/' + productId + '/')
      playSuccess()
      toast('Product deleted', 'success')
      fetchProducts()
    } catch {
      toast('Delete failed', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const toggleDiscount = async (productId) => {
    setTogglingDiscount(productId)
    playClick()
    try {
      const res = await api.post('/vendor/products/' + productId + '/toggle-discount/')
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, discount_active: res.data.discount_active } : p))
      playSuccess()
    } catch {
      toast('Failed to toggle discount', 'error')
    } finally {
      setTogglingDiscount(null)
    }
  }

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Vendor Dashboard</h1>
              <p className={'text-sm mt-1 ' + mutedClass}>Manage your product catalog</p>
            </div>
            <button
              onClick={() => { playClick(); navigate('/vendor/products/new') }}
              className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
            >
              Add Product
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : products.length === 0 ? (
          <div className={'text-center py-20 ' + mutedClass}>
            <div className="text-6xl mb-4">📦</div>
            <p className={'text-lg font-bold ' + textClass}>No products yet</p>
            <p className="text-sm mt-1">Add your first product to get started.</p>
            <button
              onClick={() => { playClick(); navigate('/vendor/products/new') }}
              className="mt-6 bg-nike-red text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase font-bold hover:bg-white hover:text-nike-black transition-all duration-300 shadow-lg shadow-nike-red/30"
            >
              Add Product
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className={'rounded-2xl border overflow-hidden transition-all hover:scale-[1.002] ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}
              >
                <div className="flex items-center gap-4 p-4 md:p-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 bg-nike-gray/20">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🥊</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={'text-sm font-bold truncate ' + textClass}>{p.name}</p>
                      {p.discount_active && (
                        <span className="text-[10px] bg-nike-red text-white font-bold px-2 py-0.5 rounded-full tracking-wider">{p.discount_percent || 0}% OFF</span>
                      )}
                    </div>
                    <div className={'flex items-center gap-3 mt-1 text-xs ' + mutedClass}>
                      <span>${parseFloat(p.price).toFixed(2)}</span>
                      <span>Stock: {p.stock}</span>
                      <span className={'px-2 py-0.5 rounded-full text-[10px] ' + (p.discount_active ? 'bg-emerald-500/10 text-emerald-400' : (isLight ? 'bg-nike-gray/30 text-nike-light' : 'bg-white/5 text-white/30'))}>
                        {p.discount_active ? 'Discount Active' : 'No Discount'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleDiscount(p.id)}
                      disabled={togglingDiscount === p.id}
                      className={'w-9 h-9 rounded-xl flex items-center justify-center transition-all text-xs font-bold ' + (p.discount_active
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : (isLight ? 'bg-nike-gray/30 text-nike-light hover:bg-nike-gray/50' : 'bg-white/10 text-white/30 hover:bg-white/20'))}
                      title={p.discount_active ? 'Disable discount' : 'Enable discount'}
                    >
                      {togglingDiscount === p.id ? '...' : '%'}
                    </button>
                    <button
                      onClick={() => { playClick(); navigate('/vendor/products/' + p.id + '/edit') }}
                      className={'w-9 h-9 rounded-xl flex items-center justify-center transition-all ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/30')}
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className={'w-9 h-9 rounded-xl flex items-center justify-center transition-all ' + (isLight ? 'hover:bg-red-50 text-nike-light hover:text-red-500' : 'hover:bg-red-900/20 text-white/30 hover:text-red-400')}
                      title="Delete"
                    >
                      {deleting === p.id ? (
                        <Spinner />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className={'px-4 md:px-6 pb-4 flex items-center gap-1 text-[10px] ' + mutedClass}>
                  <span>ID: {p.id}</span>
                  {p.category && <><span className="mx-1">·</span><span>{p.category?.name || ''}</span></>}
                  {p.brand && <><span className="mx-1">·</span><span>{p.brand}</span></>}
                  {p.created_at && <><span className="mx-1">·</span><span>Added {new Date(p.created_at).toLocaleDateString()}</span></>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
