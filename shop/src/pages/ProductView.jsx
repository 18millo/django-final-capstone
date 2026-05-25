import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useCart } from '../providers/CartProvider'
import { IconPackage } from '../components/Icons'

export default function ProductView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const [imgPaused, setImgPaused] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/products/${id}/`)
      .then(({ data }) => setProduct(data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const images = product?.images?.filter(Boolean) || []

  useEffect(() => {
    if (images.length > 1 && !imgPaused) {
      const timeout = setTimeout(() => setImgIndex((i) => (i + 1) % images.length), 3000)
      return () => clearTimeout(timeout)
    }
  }, [images.length, imgIndex, imgPaused])

  const handleAddToCart = async () => {
    setAdding(true)
    try {
      await addItem(parseInt(id), qty)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-xl" style={{ background: 'var(--theme-surface)' }} />
          <div className="space-y-4">
            <div className="h-6 rounded w-3/4" style={{ background: 'var(--theme-surface)' }} />
            <div className="h-4 rounded w-1/3" style={{ background: 'var(--theme-surface)' }} />
            <div className="h-20 rounded" style={{ background: 'var(--theme-surface)' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-slideUp">
        <Link to="/" className="text-xs mb-6 inline-block transition-colors hover:[color:var(--theme-text)]" style={{ color: 'var(--theme-text-secondary)' }}>
          ← Back to Shop
        </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div
            className="aspect-square rounded-xl overflow-hidden mb-3 shadow-lg shadow-nike-red/5 relative"
            style={{ background: 'var(--theme-surface)' }}
            onMouseEnter={() => setImgPaused(true)}
            onMouseLeave={() => setImgPaused(false)}
          >
            {images.length > 0 ? (
              images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.name} view ${i + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === imgIndex % images.length ? 'opacity-100' : 'opacity-0'}`}
                />
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--theme-text-muted)' }}><IconPackage size={48} /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setImgIndex(i); setImgPaused(true); setTimeout(() => setImgPaused(false), 5000) }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIndex % images.length ? 'border-red-500' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>{product.brand}</p>}
          <h1 className="text-2xl font-black tracking-tight mt-1 animate-slideUp animate-delay-100" style={{ color: 'var(--theme-text)' }}>{product.name}</h1>
          {product.serial_number && <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>SKU: {product.serial_number}</p>}

          <div className="flex items-baseline gap-3 mt-4">
            {product.discount_active ? (
              <>
                <span className="text-3xl font-black text-red-400">${parseFloat(product.effective_price || product.price).toFixed(2)}</span>
                <span className="text-lg line-through" style={{ color: 'var(--theme-text-muted)' }}>${parseFloat(product.price).toFixed(2)}</span>
                <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold">-{product.discount_percent}%</span>
              </>
            ) : (
              <span className="text-3xl font-black" style={{ color: 'var(--theme-text)' }}>${parseFloat(product.price).toFixed(2)}</span>
            )}
          </div>

          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>Stock: {product.stock > 0 ? product.stock : 'Out of stock'}</p>

          {product.description && (
            <p className="text-sm mt-6 leading-relaxed animate-slideUp animate-delay-200" style={{ color: 'var(--theme-text-secondary)' }}>{product.description}</p>
          )}

          {product.sport_tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {product.sport_tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded font-semibold uppercase" style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Add to cart */}
          <div className="flex items-center gap-3 mt-8">
            <div className="flex items-center rounded-lg" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 transition-colors hover:[color:var(--theme-text)]" style={{ color: 'var(--theme-text-secondary)' }}>−</button>
              <span className="px-3 py-2 text-sm font-medium min-w-[2rem] text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2 transition-colors hover:[color:var(--theme-text)]" style={{ color: 'var(--theme-text-secondary)' }}>+</button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock < 1}
              className={`flex-1 font-bold py-2.5 rounded-lg text-sm tracking-wider transition-all duration-300 hover:scale-[1.02] ${
                added
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white'
              }`}
            >
              {added ? '✓ Added to Cart' : adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
