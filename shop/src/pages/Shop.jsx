import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api'
import { useCart } from '../providers/CartProvider'

const sportIcons = { boxing: '🥊', bjj: '🤼', 'muay-thai': '🦵', mma: '⚔️', fitness: '💪' }

function ProductCard({ product, delay }) {
  const { addItem } = useCart()
  const images = product.images?.filter(Boolean) || []
  const [imgIndex, setImgIndex] = useState(0)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const intervalRef = useRef(null)

  const startCycle = useCallback(() => {
    if (images.length < 2) return
    intervalRef.current = setInterval(() => {
      setImgIndex((i) => (i + 1) % images.length)
    }, 1200)
  }, [images.length])

  const stopCycle = useCallback(() => {
    clearInterval(intervalRef.current)
    setImgIndex(0)
  }, [])

  useEffect(() => {
    return stopCycle
  }, [stopCycle])

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    try {
      await addItem(product.id, 1)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch {}
    setAdding(false)
  }

  return (
    <div
      className="group animate-slideUp"
      style={{ animationDelay: `${delay * 0.03}s` }}
    >
      <Link
        to={`/shop/products/${product.id}`}
        className="block relative aspect-square rounded-2xl overflow-hidden liquid-glass-card group-hover:border-nike-red/30 hover:scale-[1.02] transition-all duration-500"
        style={{ border: '1px solid var(--theme-border)' }}
        onMouseEnter={startCycle}
        onMouseLeave={stopCycle}
      >
        {images.length > 0 ? (
          images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${product.name} ${i + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === imgIndex % images.length ? 'opacity-100' : 'opacity-0'}`}
            />
          ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl" style={{ color: 'var(--theme-text-muted)' }}>📦</div>
        )}
        {product.stock < 1 && (
          <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">Out of Stock</div>
        )}
      </Link>
      <div className="mt-3 px-1">
        {product.brand && <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{product.brand}</p>}
        <Link to={`/shop/products/${product.id}`} className="block">
          <h3 className="text-sm font-bold mt-0.5 hover:underline" style={{ color: 'var(--theme-text)' }}>{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mt-1">
          {product.discount_active ? (
            <><span className="text-sm font-black text-nike-red">${parseFloat(product.effective_price || product.price).toFixed(2)}</span><span className="text-xs line-through" style={{ color: 'var(--theme-text-muted)' }}>${parseFloat(product.price).toFixed(2)}</span></>
          ) : (
            <span className="text-sm font-black" style={{ color: 'var(--theme-text)' }}>${parseFloat(product.price).toFixed(2)}</span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={adding || product.stock < 1}
          className={`mt-2 w-full py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 ${
            added
              ? 'bg-emerald-500 text-white'
              : 'bg-nike-red text-white hover:bg-white hover:text-nike-black shadow-sm shadow-nike-red/20'
          } ${product.stock < 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {added ? '✓ Added' : adding ? '' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

export default function Shop() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSport = searchParams.get('sport') || 'all'

  useEffect(() => {
    Promise.all([
      api.get('/products/').then(({ data }) => setProducts(data.results || data)),
      api.get('/categories/').then(({ data }) => setCategories(data.results || data)),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const sports = [...new Set(categories.map((c) => c.sport_tag).filter(Boolean))]
  const filtered = activeSport === 'all' ? products : products.filter((p) => p.sport_tags?.includes(activeSport))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(229,16,29,0.06) 0%, transparent 60%)' }}>
      {/* Header */}
      <div className="mb-8 animate-slideUp">
        <p className="text-nike-red text-xs font-bold tracking-[0.25em] uppercase mb-2">Shop</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>
          {activeSport === 'all' ? 'All Products' : activeSport.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>{filtered.length} items</p>
      </div>

      {/* Sport filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['all', ...sports].map((sport) => (
          <button
            key={sport}
            onClick={() => setSearchParams(sport === 'all' ? {} : { sport })}
            className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${
              activeSport === sport
                ? 'bg-nike-red text-white shadow-lg shadow-nike-red/20'
                : 'liquid-glass-card text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]'
            }`}
          >
            {sport !== 'all' && <span className="mr-1.5">{sportIcons[sport] || '🏆'}</span>}
            {sport === 'all' ? 'All' : sport.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-zinc-800 rounded-2xl" />
              <div className="mt-3 space-y-2 px-1"><div className="h-3 bg-zinc-800 rounded w-1/3" /><div className="h-4 bg-zinc-800 rounded w-3/4" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <p className="font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>No products found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Try a different category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i} />
          ))}
        </div>
      )}
    </div>
  )
}