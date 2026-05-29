import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../providers/AuthProvider'
import { IconCamera } from '../components/Icons'

export default function Gallery() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [caption, setCaption] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

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
    if (caption.trim()) form.append('caption', caption)
    try {
      const res = await api.post('/auth/gallery/', form)
      setItems([res.data, ...items])
      setShowUpload(false)
      setCaption('')
      setImage(null)
      setPreview(null)
    } catch {}
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Gallery</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>All community gallery posts</p>
        </div>
        {user && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg tracking-wider transition-colors"
          >
            + Upload
          </button>
        )}
      </div>

      {showUpload && (
        <div className="mb-6 p-4 rounded-2xl" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--theme-text)' }}>New Gallery Post</h3>
          <div className="flex flex-col gap-3">
            {preview && (
              <img src={preview} alt="" className="w-full max-h-64 object-contain rounded-xl" style={{ background: 'var(--theme-surface)' }} />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="text-sm"
            />
            <input
              type="text"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
            />
            <button
              onClick={handleUpload}
              disabled={uploading || !image}
              className="self-start bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-xs tracking-wider transition-colors"
            >
              {uploading ? 'Uploading...' : 'Post to Gallery'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ background: 'var(--theme-surface)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--theme-text-secondary)' }}>
          <div className="mb-4"><IconCamera size={48} /></div>
          <p className="text-sm">No gallery posts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/vendor/gallery/${item.id}`}
              className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl block"
              style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={item.image_url || ''}
                  alt={item.caption || 'Gallery image'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0">
                    {item.user_avatar ? (
                      <img src={item.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-bold bg-nike-red/30 text-white">
                        {(item.user_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-white text-[10px] font-bold truncate flex items-center gap-1">
                    {item.user_name}
                    {item.user_is_premium && <span className="text-[8px] text-nike-red">✦</span>}
                  </span>
                </div>
                {item.caption && (
                  <p className="text-white/80 text-[10px] line-clamp-2 mb-2">{item.caption}</p>
                )}
                <div className="flex items-center gap-3" onClick={(e) => e.preventDefault()}>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(item.id); }}
                    className="flex items-center gap-1 text-white/60 text-[10px] hover:text-nike-red transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill={item.is_liked ? '#ef4444' : 'none'} stroke={item.is_liked ? '#ef4444' : 'currentColor'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {item.like_count || 0}
                  </button>
                  <span className="flex items-center gap-1 text-white/60 text-[10px]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {item.comment_count || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}