import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import { useAuth } from '../providers/AuthProvider'
import { useCart } from '../providers/CartProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

const BG = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1920&q=80'

export default function Shop() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const { addItem } = useCart()
  const isLight = theme === 'light'
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ category: '', brand: '', min_price: '', max_price: '', search: '', featured: false, limited: false })
  const [showFilters, setShowFilters] = useState(false)

  const fetchProducts = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.category) params.set('category', filters.category)
    if (filters.brand) params.set('brand', filters.brand)
    if (filters.min_price) params.set('min_price', filters.min_price)
    if (filters.max_price) params.set('max_price', filters.max_price)
    if (filters.search) params.set('search', filters.search)
    if (filters.featured) params.set('featured', 'true')
    if (filters.limited) params.set('limited', 'true')
    params.set('page', page)
    params.set('page_size', '12')
    api.get('/products/?' + params.toString())
      .then((res) => { setProducts(res.data.results || res.data); setTotal(res.data.count || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [page])
  useEffect(() => { setPage(1); fetchProducts() }, [filters.category, filters.brand, filters.featured, filters.limited, filters.search, filters.min_price, filters.max_price])

  useEffect(() => {
    api.get('/categories/').then((res) => setCategories(res.data)).catch(() => {})
    api.get('/brands/').then((res) => setBrands(res.data)).catch(() => {})
  }, [])

  const clearFilters = () => {
    setFilters({ category: '', brand: '', min_price: '', max_price: '', search: '', featured: false, limited: false })
    setPage(1)
  }

  const toggleFav = async (pid) => {
    if (!user) return toast('Sign in to favorite', 'error')
    playClick()
    const wasFav = products.find((p) => p.id === pid)?.is_favorited
    setProducts((prev) => prev.map((p) => p.id === pid ? { ...p, is_favorited: !wasFav } : p))
    try { await api.post('/products/' + pid + '/favorite/') } catch { setProducts((prev) => prev.map((p) => p.id === pid ? { ...p, is_favorited: wasFav } : p)) }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10">
        <div className={'sticky top-0 z-20 backdrop-blur-md border-b ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/90 border-white/5')}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ' + (isLight ? 'text-nike-light' : 'text-white/30')}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchProducts() }}
                  placeholder="Search products..."
                  className={'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ' + (isLight ? 'bg-nike-gray/20 border-nike-gray text-nike-black placeholder:text-nike-light focus:border-nike-red/50' : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30')}
                />
              </div>
              <button
                onClick={() => { playClick(); setShowFilters((p) => !p) }}
                className={'shrink-0 px-4 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (showFilters || Object.values(filters).some((v) => v && v !== '' && v !== false)
                  ? 'bg-nike-red text-white border-nike-red'
                  : (isLight ? 'border-nike-gray text-nike-light hover:border-nike-black' : 'border-white/10 text-white/40 hover:border-white/40'))
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 inline mr-1.5"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                  Filters
                </button>
              </div>
            {showFilters && (
              <div className={'flex flex-wrap items-end gap-4 mt-4 pt-4 border-t ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
                <div>
                  <label className={'block text-[10px] tracking-widest uppercase font-bold mb-1 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Category</label>
                    <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className={'text-xs px-3 py-2 rounded-xl border outline-none ' + (isLight ? 'bg-white border-nike-gray text-nike-black' : 'bg-white/5 border-white/10 text-white')}>
                      <option value="" className="bg-nike-dark">All</option>
                      {categories.map((c) => <option key={c.id} value={c.slug} className="bg-nike-dark">{c.name}</option>)}
                    </select>
                </div>
                <div>
                  <label className={'block text-[10px] tracking-widest uppercase font-bold mb-1 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Brand</label>
                    <select value={filters.brand} onChange={(e) => setFilters((p) => ({ ...p, brand: e.target.value }))} className={'text-xs px-3 py-2 rounded-xl border outline-none ' + (isLight ? 'bg-white border-nike-gray text-nike-black' : 'bg-white/5 border-white/10 text-white')}>
                      <option value="" className="bg-nike-dark">All</option>
                      {brands.map((b) => <option key={b} value={b} className="bg-nike-dark">{b}</option>)}
                    </select>
                </div>
                <div>
                  <label className={'block text-[10px] tracking-widest uppercase font-bold mb-1 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Min Price</label>
                  <input type="number" value={filters.min_price} onChange={(e) => setFilters((p) => ({ ...p, min_price: e.target.value }))} placeholder="$0" className={'w-20 text-xs px-3 py-2 rounded-xl border outline-none ' + (isLight ? 'bg-white border-nike-gray text-nike-black placeholder:text-nike-light' : 'bg-white/5 border-white/10 text-white placeholder:text-white/30')} />
                </div>
                <div>
                  <label className={'block text-[10px] tracking-widest uppercase font-bold mb-1 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Max Price</label>
                  <input type="number" value={filters.max_price} onChange={(e) => setFilters((p) => ({ ...p, max_price: e.target.value }))} placeholder="$999" className={'w-20 text-xs px-3 py-2 rounded-xl border outline-none ' + (isLight ? 'bg-white border-nike-gray text-nike-black placeholder:text-nike-light' : 'bg-white/5 border-white/10 text-white placeholder:text-white/30')} />
                </div>
                <label className={'flex items-center gap-2 cursor-pointer ' + (isLight ? 'text-nike-black' : 'text-white')}>
                  <input type="checkbox" checked={filters.featured} onChange={(e) => setFilters((p) => ({ ...p, featured: e.target.checked }))} className="accent-nike-red" />
                  <span className="text-xs">Featured</span>
                </label>
                <label className={'flex items-center gap-2 cursor-pointer ' + (isLight ? 'text-nike-black' : 'text-white')}>
                  <input type="checkbox" checked={filters.limited} onChange={(e) => setFilters((p) => ({ ...p, limited: e.target.checked }))} className="accent-nike-red" />
                  <span className="text-xs">Limited</span>
                </label>
                <button onClick={clearFilters} className={'text-xs tracking-widest uppercase font-bold px-3 py-2 rounded-xl border transition-colors ' + (isLight ? 'border-nike-gray text-nike-light hover:text-nike-black' : 'border-white/10 text-white/40 hover:text-white')}>
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : products.length === 0 ? (
            <div className={'text-center py-20 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
              <div className="text-5xl mb-4">🔍</div>
              <p className={'text-lg font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters.</p>
              <button onClick={clearFilters} className="mt-6 bg-nike-red text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold hover:bg-white hover:text-nike-black transition-all duration-300">Clear Filters</button>
            </div>
          ) : (
            <>
              <p className={'text-xs mb-6 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{total} product{total !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((p, i) => (
                  <Reveal key={p.id} delay={i * 50}>
                    <div className={'group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
                      <Link to={'/shop/' + p.id}>
                        <div className="aspect-square overflow-hidden bg-nike-gray/20">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🥊</div>
                          )}
                        </div>
                      </Link>
                      <button
                        onClick={() => toggleFav(p.id)}
                        className={'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:scale-110 ' + (p.is_favorited ? 'bg-nike-red text-white' : (isLight ? 'bg-white/80 text-nike-light' : 'bg-nike-black/60 text-white/40'))}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={p.is_favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      </button>
                      <div className="p-4">
                        {p.limited_edition && <span className="inline-block bg-nike-red/10 text-nike-red text-[9px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full mb-2">Limited</span>}
                        <p className={'text-xs tracking-widest uppercase ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{p.brand}</p>
                        <Link to={'/shop/' + p.id}>
                          <p className={'text-sm font-bold truncate mt-0.5 hover:text-nike-red transition-colors ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.name}</p>
                        </Link>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-base font-black text-nike-red">${parseFloat(p.price).toFixed(2)}</p>
                          <button
                            onClick={() => addItem(p.id)}
                            disabled={p.stock < 1}
                            className={'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ' + (p.stock > 0 ? (isLight ? 'bg-nike-gray/30 hover:bg-nike-red hover:text-white text-nike-light' : 'bg-white/10 hover:bg-nike-red text-white/40 hover:text-white') : 'opacity-30 cursor-not-allowed')}
                            title={p.stock > 0 ? 'Add to cart' : 'Out of stock'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              {total > 12 && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button disabled={page === 1} onClick={() => { playClick(); setPage((p) => p - 1) }} className={'px-5 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all disabled:opacity-30 ' + (isLight ? 'border-nike-gray text-nike-light hover:border-nike-black' : 'border-white/10 text-white/40 hover:border-white/40')}>← Prev</button>
                  <span className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Page {page} of {Math.ceil(total / 12)}</span>
                  <button disabled={page >= Math.ceil(total / 12)} onClick={() => { playClick(); setPage((p) => p + 1) }} className={'px-5 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all disabled:opacity-30 ' + (isLight ? 'border-nike-gray text-nike-light hover:border-nike-black' : 'border-white/10 text-white/40 hover:border-white/40')}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
