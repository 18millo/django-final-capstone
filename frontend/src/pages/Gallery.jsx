import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { mediaUrl } from '../utils/media'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import PremiumBadge from '../components/ui/PremiumBadge'
import { toast } from '../components/ui/Toast'
import { useGsapStagger, useGsapReveal } from '../hooks/useGsapReveal'

export default function Gallery() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [caption, setCaption] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const staggerRef = useGsapStagger({ stagger: 0.06 })
  const titleRef = useGsapReveal()

  useEffect(() => {
    api.get('/auth/gallery/')
      .then((res) => setItems(res.data?.results || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!image) return
    setUploading(true)
    const form = new FormData()
    form.append('image', image)
    form.append('caption', caption)
    try {
      const res = await api.post('/auth/gallery/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setItems([res.data, ...items])
      setShowUpload(false)
      setCaption('')
      setImage(null)
      setPreview(null)
    } catch (err) {
      const msg = err.response?.data?.detail || ''
      if (msg.toLowerCase().includes('premium')) {
        navigate('/premium')
        return
      }
      toast(msg || 'Upload failed', 'error')
    }
    setUploading(false)
  }

  const handleLike = async (id) => {
    const res = await api.post(`/auth/gallery/${id}/like/`)
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_liked: res.data.liked, like_count: res.data.like_count } : item
      )
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div ref={titleRef} style={{ opacity: 0 }} className="flex items-end justify-between mb-10">
          <div>
            <span className="text-nike-red text-xs tracking-widest uppercase font-bold">Media</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">Combat Gallery</h1>
            <p className={'text-sm mt-2 max-w-lg ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
              Training moments, fight highlights, and gym culture from the community.
            </p>
          </div>
          {user && user?.profile?.is_premium && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-5 py-2.5 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Upload
            </button>
          )}
          {user && !user?.profile?.is_premium && (
            <Link
              to="/premium"
              className="flex items-center gap-2 bg-nike-gray hover:bg-nike-red text-white/60 hover:text-white px-5 py-2.5 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Premium Required
            </Link>
          )}
        </div>

        {showUpload && user?.profile?.is_premium && (
          <div className={'mb-10 p-6 rounded-2xl border backdrop-blur-sm liquid-glass-card ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
            <h3 className="text-xs tracking-widest uppercase font-bold mb-4">New Gallery Post</h3>
            <div className="flex flex-col gap-4">
              {preview && (
                <img src={preview} alt="" className="w-full max-h-64 object-contain rounded-xl bg-nike-black/20" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className={'text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:text-xs file:tracking-widest file:uppercase file:font-bold file:border-0 ' + (isLight ? 'file:bg-nike-gray file:text-nike-black' : 'file:bg-white/10 file:text-white')}
              />
              <input
                type="text"
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className={'w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors ' + (isLight ? 'bg-white border-nike-gray text-nike-black focus:border-nike-red' : 'bg-nike-black/60 border-white/10 text-white focus:border-nike-red')}
              />
              <button
                onClick={handleUpload}
                disabled={uploading || !image}
                className="self-start bg-nike-red hover:bg-white hover:text-nike-black text-white px-6 py-2.5 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300 disabled:opacity-40"
              >
                {uploading ? 'Uploading...' : 'Post to Gallery'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={'aspect-square rounded-2xl animate-pulse ' + (isLight ? 'bg-nike-gray/30' : 'bg-white/5')} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={'text-center py-20 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
            <div className="text-5xl mb-4">📸</div>
            <p className="text-sm">No gallery posts yet.</p>
          {user?.profile?.is_premium && (
              <button onClick={() => setShowUpload(true)} className="mt-4 text-nike-red text-xs tracking-widest uppercase font-bold hover:underline">
                Be the first to upload
              </button>
            )}
          </div>
        ) : (
          <div ref={staggerRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                to={'/gallery/' + item.id}
                className={'group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl liquid-glass-card ' + (isLight ? 'bg-white border-nike-gray' : 'bg-nike-dark border-white/5')}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image_url ? mediaUrl(item.image_url) : ''}
                    alt={item.caption || 'Gallery image'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0">
                      {item.user_avatar ? (
                        <img src={mediaUrl(item.user_avatar)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold bg-nike-red/30 text-white">
                          {(item.user_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-white text-[10px] font-bold truncate flex items-center gap-1">
                      {item.user_name}
                      {item.user_is_premium && <PremiumBadge size={10} animate={false} />}
                    </span>
                  </div>
                  {item.caption && (
                    <p className="text-white/80 text-[10px] line-clamp-2 mb-2">{item.caption}</p>
                  )}
                  <div className="flex items-center gap-3 text-white/60 text-[10px]">
                    <span className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill={item.is_liked ? '#ef4444' : 'none'} stroke={item.is_liked ? '#ef4444' : 'currentColor'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      {item.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {item.comment_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
