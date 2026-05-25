import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

const getSportIcon = (sport) => {
  switch(sport) {
    case 'boxing':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    case 'bjj':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="9" r="4"/><path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
    case 'muay-thai':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8 2 4 6 4 10c0 3.5 2 6.5 4 8l4 4 4-4c2-1.5 4-4.5 4-8 0-4-4-8-8-8z"/></svg>
    case 'mma':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>
    case 'fitness':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5 17.5 17.5"/><path d="M17.5 6.5 6.5 17.5"/><circle cx="12" cy="12" r="10"/></svg>
    default:
      return null
  }
}

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSport, setActiveSport] = useState('all')

  useEffect(() => {
    Promise.all([
      api.get('/products/').then(({ data }) => setProducts(data.results || data)),
      api.get('/categories/').then(({ data }) => setCategories(data.results || data)),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const sports = [...new Set(categories.map((c) => c.sport_tag).filter(Boolean))]
  const heroProduct = products.find((p) => p.featured) || products[0]

  const filteredProducts = activeSport === 'all'
    ? products
    : products.filter((p) => p.sport_tags?.includes(activeSport))

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative h-[75vh] min-h-[520px] overflow-hidden">
        {heroProduct?.images?.[0] ? (
          <img src={heroProduct.images[0]} alt="" className="absolute inset-0 w-full h-full object-cover animate-slowZoom" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/70 to-transparent" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(229,16,29,0.08) 0%, transparent 60%)' }} />

        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-24">
          <div className="animate-slideUp">
            <p className="text-nike-red text-sm font-bold tracking-[0.25em] uppercase mb-3">Just In</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white">
              {heroProduct?.name || 'Combat Sport'}
              <br />
              <span className="text-zinc-500">Equipment</span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base mt-4 max-w-md leading-relaxed">
              {heroProduct?.brand || 'Premium gear for fighters, by fighters.'}
            </p>
            <div className="flex gap-3 mt-8">
              <Link
                to={heroProduct ? `/products/${heroProduct.id}` : '#'}
                className="inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-8 py-3 rounded-full text-sm font-bold tracking-wider transition-all duration-300"
              >
                Shop Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#categories"
                className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-8 py-3 rounded-full text-sm font-bold tracking-wider transition-all duration-300"
              >
                Explore
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sport Filter Pills ── */}
      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10 mb-14">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSport('all')}
            className={`px-6 py-3 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${
              activeSport === 'all'
                ? 'bg-nike-red text-white shadow-lg shadow-nike-red/20'
                : 'liquid-glass-card text-zinc-400 hover:text-white hover:border-zinc-600'
            }`}
          >
            All
          </button>
          {sports.map((sport, i) => (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={`px-6 py-3 rounded-full text-xs font-bold tracking-wider transition-all duration-300 animate-slideUp ${
                activeSport === sport
                  ? 'bg-nike-red text-white shadow-lg shadow-nike-red/20'
                  : 'liquid-glass-card text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="mr-1.5">{getSportIcon(sport) || <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>}</span>
              {sport.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </section>

      {/* ── Categories Grid ── */}
      <section id="categories" className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Shop by Category</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Find exactly what you need</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.filter((c) => c.sport_tag).slice(0, 12).map((cat, i) => {
            const catProducts = products.filter((p) => p.category === cat.id)
            const catImg = catProducts.find((p) => p.images?.[0])?.images?.[0]
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveSport(cat.sport_tag); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-transparent hover:border-nike-red/30 transition-all duration-500 animate-slideUp text-left"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {catImg ? (
                  <img src={catImg} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent group-hover:from-zinc-950/80 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="mb-1.5">{getSportIcon(cat.sport_tag) || <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>}</div>
                  <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest">{cat.sport_tag}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Featured ── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Featured</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Curated for peak performance</p>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-zinc-800 rounded-2xl" />
                <div className="mt-3 space-y-2 px-1"><div className="h-3 bg-zinc-800 rounded w-1/3" /><div className="h-4 bg-zinc-800 rounded w-3/4" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, 4).map((p, i) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="group animate-slideUp"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-nike-red/30 transition-all duration-500 liquid-glass-card">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg></div>
                  )}
                </div>
                <div className="mt-3 px-1">
                  {p.brand && <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-widest">{p.brand}</p>}
                  <h3 className="text-sm font-bold text-white mt-0.5">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {p.discount_active ? (
                      <>
                        <span className="text-sm font-black text-nike-red">${parseFloat(p.effective_price || p.price).toFixed(2)}</span>
                        <span className="text-xs text-zinc-600 line-through">${parseFloat(p.price).toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-black text-white">${parseFloat(p.price).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Sport Section ── */}
      {activeSport !== 'all' && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8">
            <img
              src={`https://images.unsplash.com/photo-${activeSport === 'boxing' ? '1549719386-74dfcbf7dbed' : activeSport === 'bjj' ? '1628359355624-855f2ae00344' : activeSport === 'muay-thai' ? '1591117207239-788bf8de6c3d' : '1560169897-fc0cdbdfa4d5'}?w=1200&q=80`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 to-transparent" />
            <div className="relative h-full flex flex-col justify-center px-8">
                  <div className="mb-2">{getSportIcon(activeSport) || <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>}</div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                {activeSport.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h2>
              <p className="text-zinc-400 text-sm mt-1">Premium gear for {activeSport} athletes</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredProducts.map((p, i) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="group animate-slideUp"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-nike-red/30 transition-all duration-500 liquid-glass-card">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg></div>
                  )}
                </div>
                <div className="mt-3 px-1">
                  {p.brand && <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-widest">{p.brand}</p>}
                  <h3 className="text-sm font-bold text-white mt-0.5">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {p.discount_active ? (
                      <>
                        <span className="text-sm font-black text-nike-red">${parseFloat(p.effective_price || p.price).toFixed(2)}</span>
                        <span className="text-xs text-zinc-600 line-through">${parseFloat(p.price).toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-black text-white">${parseFloat(p.price).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p, i) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="group animate-slideUp"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-nike-red/30 transition-all duration-500 liquid-glass-card">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg></div>
                  )}
                </div>
                <div className="mt-3 px-1">
                  {p.brand && <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-widest">{p.brand}</p>}
                  <h3 className="text-sm font-bold text-white mt-0.5">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {p.discount_active ? (
                      <>
                        <span className="text-sm font-black text-nike-red">${parseFloat(p.effective_price || p.price).toFixed(2)}</span>
                        <span className="text-xs text-zinc-600 line-through">${parseFloat(p.price).toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-black text-white">${parseFloat(p.price).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 py-16 liquid-glass">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">Shop</h4>
              <div className="space-y-2.5 text-xs text-zinc-500">
                {sports.map((s) => (
                  <button key={s} onClick={() => { setActiveSport(s); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="block hover:text-white transition-colors duration-300">
                    {s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">Support</h4>
              <div className="space-y-2.5 text-xs text-zinc-500">
                <Link to="/orders" className="block hover:text-white transition-colors duration-300">Order Status</Link>
                <span className="block hover:text-white transition-colors duration-300 cursor-pointer">Shipping</span>
                <span className="block hover:text-white transition-colors duration-300 cursor-pointer">Returns</span>
                <span className="block hover:text-white transition-colors duration-300 cursor-pointer">Contact</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">Company</h4>
              <div className="space-y-2.5 text-xs text-zinc-500">
                <span className="block hover:text-white transition-colors duration-300 cursor-pointer">About</span>
                <span className="block hover:text-white transition-colors duration-300 cursor-pointer">Careers</span>
                <span className="block hover:text-white transition-colors duration-300 cursor-pointer">Press</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">Follow</h4>
              <div className="space-y-2.5 text-xs text-zinc-500">
                <span className="block hover:text-white transition-colors duration-300 cursor-pointer">Instagram</span>
                <span className="block hover:text-white transition-colors duration-300 cursor-pointer">X / Twitter</span>
                <span className="block hover:text-white transition-colors duration-300 cursor-pointer">YouTube</span>
                <span className="block hover:text-white transition-colors duration-300 cursor-pointer">TikTok</span>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800 mt-10 pt-8 text-xs text-zinc-600 flex items-center justify-between">
            <p>© 2026 Combat Shop. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="cursor-pointer hover:text-zinc-400 transition-colors">Privacy</span>
              <span className="cursor-pointer hover:text-zinc-400 transition-colors">Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
