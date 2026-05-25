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

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/categories/').then(({ data }) => setCategories(data.results || data)),
      api.get('/products/').then(({ data }) => setProducts(data.results || data)),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const sports = [...new Set(categories.map((c) => c.sport_tag).filter(Boolean))]

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Loading categories...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(229,16,29,0.06) 0%, transparent 60%)' }}>
      <div className="mb-10">
        <p className="text-nike-red text-xs font-bold tracking-[0.25em] uppercase mb-2">Categories</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Shop by Sport</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>Find gear for your discipline</p>
      </div>

      {/* Sports */}
      <div className="space-y-16">
        {sports.map((sport, si) => {
          const sportCategories = categories.filter((c) => c.sport_tag === sport)
          return (
            <section key={sport} className="animate-slideUp" style={{ animationDelay: `${si * 0.1}s` }}>
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center justify-center w-8 h-8">{getSportIcon(sport) || <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>}</span>
                <div>
                  <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>
                    {sport.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>{sportCategories.length} categories</p>
                </div>
                <Link to={`/shop?sport=${sport}`} className="ml-auto text-xs tracking-wider uppercase font-bold transition-colors duration-300" style={{ color: 'var(--theme-text-secondary)' }}>
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {sportCategories.map((cat, i) => {
                  const catProducts = products.filter((p) => p.category === cat.id)
                  const catImg = catProducts.find((p) => p.images?.[0])?.images?.[0]
                  return (
                    <Link
                      key={cat.id}
                      to={`/shop?sport=${sport}`}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border hover:border-nike-red/30 hover:scale-[1.03] transition-all duration-500"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      {catImg ? (
                        <img src={catImg} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{catProducts.length} items</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* All categories flat grid */}
      <section className="mt-16 pt-16" style={{ borderTop: '1px solid var(--theme-border)' }}>
        <h2 className="text-xl font-black tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>All Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const catProducts = products.filter((p) => p.category === cat.id)
            const catImg = catProducts.find((p) => p.images?.[0])?.images?.[0]
            return (
              <Link
                key={cat.id}
                to={`/shop?sport=${cat.sport_tag || 'boxing'}`}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden border hover:border-nike-red/30 hover:scale-[1.02] transition-all duration-500"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                {catImg ? (
                  <img src={catImg} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <span className="inline-flex items-center justify-center w-10 h-10">{getSportIcon(cat.sport_tag) || <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2H2v10l9.29 9.29a2 2 0 0 0 2.83 0l6.17-6.17a2 2 0 0 0 0-2.83L12 2Z"/><path d="M7 7h.01"/></svg>}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{catProducts.length} items</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
