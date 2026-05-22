import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import { useAuth } from '../providers/AuthProvider'
import { useCart } from '../providers/CartProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

const BG = 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1920&q=80'

export default function ProductDetail() {
  const { id } = useParams()
  const { theme } = useTheme()
  const { user } = useAuth()
  const { addItem } = useCart()
  const isLight = theme === 'light'
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty, setQty] = useState(1)
  const [favorited, setFavorited] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isVendor = user?.role === 'vendor'

  const fetchProduct = () => {
    setLoading(true)
    api.get('/products/' + id + '/')
      .then((res) => { setProduct(res.data); setFavorited(res.data.is_favorited) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProduct() }, [id])

  const handleAddComment = async () => {
    if (!user) return toast('Sign in to comment', 'error')
    if (!commentText.trim()) return
    setSubmitting(true)
    playClick()
    try {
      await api.post('/products/' + id + '/comments/', { content: commentText })
      setCommentText('')
      playSuccess()
      toast('Comment added', 'success')
      fetchProduct()
    } catch {
      toast('Failed to add comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return
    setSubmitting(true)
    playClick()
    try {
      await api.post('/products/' + id + '/comments/', { content: replyText, parent: commentId })
      setReplyText('')
      setReplyTo(null)
      playSuccess()
      toast('Reply added', 'success')
      fetchProduct()
    } catch {
      toast('Failed to reply', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className={'min-h-screen flex items-center justify-center ' + (isLight ? 'bg-white' : 'bg-nike-black')}><Spinner /></div>
  if (!product) return <div className={'min-h-screen flex items-center justify-center ' + (isLight ? 'bg-white' : 'bg-nike-black')}><p className={'text-sm ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Product not found</p></div>

  const images = product.images?.length ? product.images : []
  const hasVariants = product.variants?.length > 0
  const currentPrice = selectedVariant?.price_override || product.price
  const inStock = hasVariants
    ? selectedVariant ? selectedVariant.stock > 0 : product.variants.some((v) => v.stock > 0)
    : product.stock > 0

  const effectivePrice = product.discount_active && product.discount_percent
    ? currentPrice * (1 - product.discount_percent / 100)
    : null

  const toggleFav = async () => {
    if (!user) return toast('Sign in to favorite', 'error')
    playClick()
    setFavorited((p) => !p)
    try { await api.post('/products/' + product.id + '/favorite/') } catch { setFavorited((p) => !p) }
  }

  const handleAdd = () => {
    if (!inStock) return toast('Out of stock', 'error')
    playClick()
    addItem(product.id, selectedVariant?.id, qty)
  }

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const inputClass = 'w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ' + (isLight
    ? 'bg-white border-nike-gray text-nike-black placeholder:text-nike-light focus:border-nike-red/50'
    : 'bg-nike-dark border-white/10 text-white placeholder:text-white/30 focus:border-white/30')

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <Reveal>
          <Link to="/shop" className={'inline-flex items-center gap-1 text-xs tracking-widest uppercase font-bold mb-6 transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Shop
          </Link>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <Reveal delay={100}>
            <div className="space-y-4">
              <div className={'aspect-square rounded-2xl overflow-hidden border group relative liquid-glass-card ' + (isLight ? 'border-nike-gray bg-white' : 'border-white/5 bg-nike-dark')}>
                {images[selectedImage] ? (
                  <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">🥊</div>
                )}
                {product.discount_active && product.discount_percent && (
                  <div className="absolute top-4 left-4 bg-nike-red text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-nike-red/50 animate-pulse">
                    {product.discount_percent}% OFF
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => { playClick(); setSelectedImage(i) }}
                      className={'shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ' + (i === selectedImage ? 'border-nike-red scale-105' : (isLight ? 'border-nike-gray opacity-60 hover:opacity-100' : 'border-white/10 opacity-60 hover:opacity-100'))}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              </div>

              {product.vendor_info && (
                <Reveal delay={550}>
                  <div className={'mt-6 p-4 rounded-xl border ' + (isLight ? 'bg-nike-gray/10 border-nike-gray' : 'bg-white/[0.02] border-white/5')}>
                    <p className={'text-[10px] tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Sold by</p>
                    <Link to={'/vendor/' + product.vendor_info.id} className={'flex items-center gap-3 group'}>
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-nike-gray/20 shrink-0">
                        {product.vendor_info.business_name ? (
                          <div className="w-full h-full flex items-center justify-center text-lg font-black" style={{ color: 'var(--color-nike-light)' }}>
                            {product.vendor_info.business_name[0]}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">🏪</div>
                        )}
                      </div>
                      <div>
                        <p className={'text-sm font-bold group-hover:text-nike-red transition-colors ' + textClass}>{product.vendor_info.business_name || product.vendor_info.username}</p>
                        {product.vendor_info.business_location && (
                          <p className={'text-xs ' + mutedClass}>{product.vendor_info.business_location}</p>
                        )}
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform ' + mutedClass}><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>
                </Reveal>
              )}

            </Reveal>
          <div>
            <Reveal delay={200}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {product.brand && <p className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{product.brand}</p>}
                  <h1 className={'text-2xl md:text-3xl font-black tracking-tight mt-1 ' + textClass}>{product.name}</h1>
                  {product.limited_edition && <span className="inline-block mt-2 bg-nike-red/10 text-nike-red text-[10px] tracking-widest uppercase font-bold px-3 py-1 rounded-full border border-nike-red/20">Limited Edition</span>}
                </div>
                <button
                  onClick={toggleFav}
                  className={'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 ' + (favorited ? 'bg-nike-red text-white shadow-lg shadow-nike-red/30' : (isLight ? 'bg-nike-gray/30 text-nike-light' : 'bg-white/10 text-white/40'))}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="flex items-baseline gap-3 mt-6">
                {effectivePrice ? (
                  <>
                    <p className="text-3xl font-black text-nike-red">${effectivePrice.toFixed(2)}</p>
                    <p className={'text-lg line-through ' + (isLight ? 'text-nike-light' : 'text-white/30')}>${parseFloat(currentPrice).toFixed(2)}</p>
                  </>
                ) : (
                  <p className="text-3xl font-black text-nike-red">${parseFloat(currentPrice).toFixed(2)}</p>
                )}
                {product.limited_edition && product.serial_number && (
                  <p className={'text-xs ' + mutedClass}># {product.serial_number}</p>
                )}
              </div>
            </Reveal>

            <Reveal delay={400}>
              {hasVariants && (
                <div className="mt-6 space-y-4">
                  {product.variants.some((v) => v.size) && (
                    <div>
                      <p className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Size</p>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => { playClick(); setSelectedVariant(v) }}
                            disabled={v.stock < 1}
                            className={'px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 hover:scale-105 ' + (selectedVariant?.id === v.id
                              ? 'bg-nike-red text-white border-nike-red shadow-lg shadow-nike-red/30'
                              : v.stock > 0
                                ? (isLight ? 'border-nike-gray text-nike-black hover:border-nike-red/50' : 'border-white/10 text-white hover:border-white/40')
                                : (isLight ? 'border-nike-gray text-nike-light/40 line-through' : 'border-white/5 text-white/20 line-through')
                            )}
                          >
                            {v.size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.variants.some((v) => v.color) && (
                    <div>
                      <p className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Color</p>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => { playClick(); setSelectedVariant(v) }}
                            disabled={v.stock < 1}
                            className={'px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 hover:scale-105 ' + (selectedVariant?.id === v.id
                              ? 'bg-nike-red text-white border-nike-red shadow-lg shadow-nike-red/30'
                              : v.stock > 0
                                ? (isLight ? 'border-nike-gray text-nike-black hover:border-nike-red/50' : 'border-white/10 text-white hover:border-white/40')
                                : (isLight ? 'border-nike-gray text-nike-light/40 line-through' : 'border-white/5 text-white/20 line-through')
                            )}
                          >
                            {v.color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Reveal>

            <Reveal delay={500}>
              <div className="flex items-center gap-4 mt-6 flex-wrap">
                {!isVendor && (
                  <>
                    <div className={'flex items-center rounded-xl border overflow-hidden ' + (isLight ? 'border-nike-gray' : 'border-white/10')}>
                      <button onClick={() => setQty((p) => Math.max(1, p - 1))} className={'w-10 h-10 flex items-center justify-center text-sm font-bold transition-all hover:scale-110 ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}>−</button>
                      <span className={'w-12 text-center text-sm font-bold ' + textClass}>{qty}</span>
                      <button onClick={() => setQty((p) => p + 1)} className={'w-10 h-10 flex items-center justify-center text-sm font-bold transition-all hover:scale-110 ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}>+</button>
                    </div>
                    {user?.role === 'athlete' ? (
                    <button
                      onClick={handleAdd}
                      disabled={!inStock}
                      className={'flex-1 px-6 py-3 rounded-xl text-sm tracking-widest uppercase font-bold transition-all duration-300 hover:scale-[1.02] ' + (inStock
                        ? 'bg-nike-red text-white hover:bg-white hover:text-nike-black shadow-lg shadow-nike-red/30 hover:shadow-none'
                        : (isLight ? 'bg-nike-gray/50 text-nike-light cursor-not-allowed' : 'bg-white/5 text-white/20 cursor-not-allowed')
                      )}
                    >
                      {inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    ) : !!user && (
                    <div className={'flex-1 px-6 py-3 rounded-xl text-sm tracking-widest uppercase font-bold text-center ' + (isLight ? 'bg-nike-gray/30 text-nike-light' : 'bg-white/5 text-white/30')}>
                      Browse Only
                    </div>
                    )}
                  </>
                )}
                {isVendor && (
                  <Link to={'/vendor/products/' + product.id + '/edit'} className="flex-1 px-6 py-3 rounded-xl text-sm tracking-widest uppercase font-bold text-center bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-none">
                    Manage Product
                  </Link>
                )}
              </div>
            </Reveal>

            <Reveal delay={600}>
              {product.description && (
                <div className="mt-8">
                  <h3 className={'text-xs tracking-widest uppercase font-bold mb-3 ' + mutedClass}>Description</h3>
                  <p className={'text-sm leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/50')}>{product.description}</p>
                </div>
              )}
            </Reveal>

            <Reveal delay={700}>
              {product.sport_tags?.length > 0 && (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2">
                    {product.sport_tags.map((tag) => (
                      <span key={tag} className={'text-[10px] tracking-widest uppercase font-bold px-3 py-1 rounded-full border ' + (isLight ? 'bg-nike-gray/20 border-nike-gray text-nike-light' : 'bg-white/5 border-white/10 text-white/40')}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </div>

        <Reveal delay={300}>
          <div className={'mt-16 border-t pt-10 ' + borderClass}>
            <h2 className={'text-xl font-black tracking-tight mb-8 flex items-center gap-2 ' + textClass}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Comments
            </h2>

            {user && (
              <div className={'flex gap-3 mb-8 p-4 rounded-2xl border ' + (isLight ? 'bg-nike-gray/10 border-nike-gray' : 'bg-white/5 border-white/10')}>
                <div className={'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ' + (isLight ? 'bg-nike-red/10 text-nike-red' : 'bg-nike-red/20 text-nike-red')}>
                  {(user.display_name || user.username || user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={2} className={inputClass + ' resize-none'} placeholder="Ask a question or leave a comment..." />
                  <div className="flex justify-end mt-2">
                    <button onClick={handleAddComment} disabled={submitting || !commentText.trim()} className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-2 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 disabled:opacity-50 shadow-lg shadow-nike-red/30">
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {(product.comments || []).length === 0 ? (
                <div className={'text-center py-10 ' + mutedClass}>
                  <div className="text-4xl mb-3">💬</div>
                  <p className={'text-sm font-bold ' + textClass}>No comments yet</p>
                  <p className="text-xs mt-1">Be the first to ask a question.</p>
                </div>
              ) : (
                product.comments.map((comment) => (
                  <div key={comment.id} className={'p-4 rounded-2xl border transition-all hover:scale-[1.002] liquid-glass-card ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
                    <div className="flex items-start gap-3">
                      <div className={'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ' + (comment.user_role === 'vendor' ? 'bg-emerald-500/20 text-emerald-400' : (isLight ? 'bg-nike-red/10 text-nike-red' : 'bg-nike-red/20 text-nike-red'))}>
                        {comment.user_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={'text-xs font-bold ' + textClass}>{comment.user_name}</span>
                          {comment.user_role === 'vendor' && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded">Vendor</span>}
                          <span className={'text-[10px] ' + mutedClass}>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className={'text-sm mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/60')}>{comment.content}</p>
                        {user && comment.user_role === 'vendor' && (
                          <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className={'text-xs font-bold mt-2 transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-red' : 'text-white/40 hover:text-nike-red')}>
                            {replyTo === comment.id ? 'Cancel' : 'Reply'}
                          </button>
                        )}
                        {replyTo === comment.id && (
                          <div className="mt-3 flex gap-2">
                            <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className={inputClass + ' flex-1'} />
                            <button onClick={() => handleReply(comment.id)} disabled={submitting || !replyText.trim()} className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-4 py-2 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 disabled:opacity-50">
                              {submitting ? '...' : 'Reply'}
                            </button>
                          </div>
                        )}
                        {comment.replies?.length > 0 && (
                          <div className={'mt-3 pt-3 border-t space-y-3 ' + borderClass}>
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-3 pl-4">
                                <div className={'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ' + (reply.user_role === 'vendor' ? 'bg-emerald-500/20 text-emerald-400' : (isLight ? 'bg-nike-gray/30 text-nike-light' : 'bg-white/10 text-white/40'))}>
                                  {reply.user_name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={'text-xs font-bold ' + textClass}>{reply.user_name}</span>
                                    {reply.user_role === 'vendor' && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded">Vendor</span>}
                                    <span className={'text-[10px] ' + mutedClass}>{new Date(reply.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className={'text-sm mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/60')}>{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
