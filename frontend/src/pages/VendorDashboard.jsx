import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'
import { mediaUrl } from '../utils/media'
import { IconBoxingGlove, IconPackage } from '../components/Icons'


export default function VendorDashboard() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [togglingDiscount, setTogglingDiscount] = useState(null)
  const [followers, setFollowers] = useState([])
  const [removing, setRemoving] = useState(null)
  const [blocking, setBlocking] = useState(null)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/vendor/products/'),
      api.get('/auth/dashboard/vendor/stats/'),
    ])
      .then(([pRes, sRes]) => {
        setProducts(pRes.data.results || pRes.data || [])
        setStats(sRes.data)
        setFollowers(sRes.data.followers || [])
      })
      .catch(() => toast('Failed to load data', 'error'))
      .finally(() => setLoading(false))
  }

  const removeFollower = async (followerId) => {
    setRemoving(followerId)
    try {
      await api.post('/auth/users/' + followerId + '/remove-follower/')
      setFollowers((prev) => prev.filter((f) => f.id !== followerId))
      playSuccess()
      toast('Follower removed', 'success')
    } catch {
      toast('Failed to remove follower', 'error')
    } finally {
      setRemoving(null)
    }
  }

  const blockUser = async (userId) => {
    if (!confirm('Block this user? They will be removed from your followers.')) return
    setBlocking(userId)
    try {
      await api.post('/auth/users/' + userId + '/block/')
      setFollowers((prev) => prev.filter((f) => f.id !== userId))
      playSuccess()
      toast('User blocked', 'success')
    } catch {
      toast('Failed to block user', 'error')
    } finally {
      setBlocking(null)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (productId) => {
    if (!confirm('Delete this product?')) return
    setDeleting(productId)
    playClick()
    try {
      await api.delete('/vendor/products/' + productId + '/')
      playSuccess()
      toast('Product deleted', 'success')
      fetchData()
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
  const cardBg = 'liquid-glass-card'

  const lowStockProducts = products.filter((p) => p.stock <= 5)

  if (loading) return (
    <div className={'min-h-[calc(100vh-4rem)] flex items-center justify-center ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <Spinner />
    </div>
  )

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={'w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ' + (isLight ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-500/10 text-emerald-400')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/></svg>
              </div>
              <div>
                <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Vendor Dashboard</h1>
                <p className={'text-sm mt-0.5 ' + mutedClass}>Manage your product catalog</p>
              </div>
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

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats Cards */}
        <Reveal delay={50}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Total Products</div>
              <div className={'text-3xl font-black ' + textClass}>{stats?.total_products || products.length}</div>
            </div>
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>In Stock</div>
              <div className={'text-3xl font-black text-emerald-400'}>{products.filter((p) => p.stock > 5).length}</div>
            </div>
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Low Stock</div>
              <div className={'text-3xl font-black ' + (lowStockProducts.length > 0 ? 'text-nike-amber' : textClass)}>
                {lowStockProducts.length > 0 ? lowStockProducts.length : '0'}
              </div>
              {lowStockProducts.length > 0 && (
                <div className={'text-[10px] mt-1 text-nike-red'}>{lowStockProducts.map((p) => p.name).join(', ').slice(0, 40)}</div>
              )}
            </div>
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>On Discount</div>
              <div className={'text-3xl font-black ' + textClass}>{products.filter((p) => p.discount_active).length}</div>
            </div>
          </div>
        </Reveal>

        {/* Quick Actions */}
        <Reveal delay={100}>
          <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className={'text-xs tracking-widest uppercase font-bold mb-4 ' + mutedClass}>Quick Actions</div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { playClick(); navigate('/vendor/products/new') }}
                className="flex items-center gap-2 bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                New Product
              </button>
              <button
                onClick={() => { playClick(); navigate('/shop') }}
                className={'flex items-center gap-2 px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all duration-300 ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/></svg>
                View Shop
              </button>
              <button
                onClick={() => { playClick(); navigate('/seller/orders') }}
                className={'flex items-center gap-2 px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all duration-300 ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Orders
              </button>
            </div>
          </div>
        </Reveal>

        {/* Followers */}
        <Reveal delay={120}>
          <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className="flex items-center justify-between mb-4">
              <div className={'text-xs tracking-widest uppercase font-bold ' + mutedClass}>
                Followers
                <span className={'ml-2 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>({stats?.follower_count || 0})</span>
              </div>
            </div>
            {followers.length === 0 ? (
              <p className={'text-sm ' + mutedClass}>No followers yet.</p>
            ) : (
              <div className="grid gap-2">
                {followers.map((f) => (
                  <div key={f.id} className={'flex items-center justify-between p-3 rounded-xl ' + (isLight ? 'bg-nike-gray/20' : 'bg-white/5')}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-nike-gray/30 flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-nike-light)' }}>
                        {f.avatar ? <img src={mediaUrl(f.avatar)} className="w-full h-full object-cover" alt="" /> : (f.username || '?')[0].toUpperCase()}
                      </div>
                      <span className={'text-sm font-bold truncate ' + textClass}>
                        {f.username || 'Anonymous'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => removeFollower(f.id)}
                        disabled={removing === f.id}
                        className={'px-3 py-1.5 rounded-lg text-[10px] tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
                      >
                        {removing === f.id ? '...' : 'Remove'}
                      </button>
                      <button
                        onClick={() => blockUser(f.id)}
                        disabled={blocking === f.id}
                        className="px-3 py-1.5 rounded-lg text-[10px] tracking-widest uppercase font-bold border border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white transition-all"
                      >
                        {blocking === f.id ? '...' : 'Block'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        {/* Products List */}
        <Reveal delay={150}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={'text-xs tracking-widest uppercase font-bold ' + mutedClass}>
                Products
                <span className={'ml-2 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>({products.length})</span>
              </h2>
            </div>

            {products.length === 0 ? (
              <div className={'text-center py-20 rounded-2xl border ' + borderClass + ' ' + cardBg}>
                <div className="text-6xl mb-4"><IconPackage className="w-4 h-4" /></div>
                <p className={'text-lg font-bold ' + textClass}>No products yet</p>
                <p className={'text-sm mt-1 ' + mutedClass}>Add your first product to get started.</p>
                <button
                  onClick={() => { playClick(); navigate('/vendor/products/new') }}
                  className="mt-6 bg-nike-red text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase font-bold hover:bg-white hover:text-nike-black transition-all duration-300 shadow-lg shadow-nike-red/30"
                >
                  Add Product
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {products.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 20) * 40}>
                    <div className={'rounded-2xl border overflow-hidden transition-all hover:scale-[1.002] ' + (p.stock <= 5 ? 'ring-1 ring-nike-amber/50' : '') + ' ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
                      <div className="flex items-center gap-4 p-4 md:p-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 bg-nike-gray/20">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl"><IconBoxingGlove className="w-4 h-4" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={'text-sm font-bold truncate ' + textClass}>{p.name}</p>
                            {p.discount_active && (
                              <span className="text-[10px] bg-nike-red text-white font-bold px-2 py-0.5 rounded-full tracking-wider">{p.discount_percent || 0}% OFF</span>
                            )}
                            {p.stock <= 5 && (
                              <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + (p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-nike-amber/10 text-nike-amber')}>
                                {p.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                              </span>
                            )}
                          </div>
                          <div className={'flex items-center gap-3 mt-1 text-xs ' + mutedClass}>
                            <span className={'font-bold ' + textClass}>${parseFloat(p.price).toFixed(2)}</span>
                            <span>Stock: <span className={'font-bold ' + (p.stock <= 5 ? 'text-nike-amber' : textClass)}>{p.stock}</span></span>
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
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </Reveal>

      </div>
    </div>
  )
}
