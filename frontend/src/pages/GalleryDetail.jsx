import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import { mediaUrl } from '../utils/media'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import PremiumBadge from '../components/ui/PremiumBadge'
import { useGsapReveal } from '../hooks/useGsapReveal'

export default function GalleryDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [item, setItem] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState(null)
  const heroRef = useGsapReveal()
  const commentsRef = useGsapReveal({ threshold: 0.1 })

  useEffect(() => {
    Promise.all([
      api.get('/auth/gallery/' + id + '/'),
      api.get('/auth/gallery/' + id + '/comments/list/'),
    ])
      .then(([itemRes, commentsRes]) => {
        setItem(itemRes.data)
        setComments(commentsRes.data?.results || commentsRes.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleLike = async () => {
    const res = await api.post('/auth/gallery/' + id + '/like/')
    setItem((prev) => ({ ...prev, is_liked: res.data.liked, like_count: res.data.like_count }))
  }

  const handleComment = async (parentId = null) => {
    if (!commentText.trim()) return
    const payload = { content: commentText }
    if (parentId) payload.parent = parentId
    const res = await api.post('/auth/gallery/' + id + '/comments/', payload)
    setComments((prev) =>
      parentId
        ? prev.map((c) =>
            c.id === parentId ? { ...c, replies: [...(c.replies || []), res.data] } : c
          )
        : [...prev, res.data]
    )
    setCommentText('')
    setReplyTo(null)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className={'aspect-video rounded-2xl animate-pulse ' + (isLight ? 'bg-nike-gray/30' : 'bg-white/5')} />
      </div>
    )
  }
  if (!item) return null

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link
          to="/gallery"
          className={'inline-flex items-center gap-2 text-xs tracking-widest uppercase font-bold mb-6 transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Gallery
        </Link>

        <div ref={heroRef} style={{ opacity: 0 }} className={'rounded-3xl overflow-hidden border backdrop-blur-sm ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
          <div className="aspect-video overflow-hidden bg-nike-black/20">
            <img src={mediaUrl(item.image_url)} alt={item.caption || ''} className="w-full h-full object-contain" />
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-nike-red/30">
                  {item.user_avatar ? (
                    <img src={mediaUrl(item.user_avatar)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-sm bg-nike-red/20 text-nike-red">
                      {(item.user_name || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <Link to={'/profile/' + item.user} className={'flex items-center gap-1 text-sm font-bold hover:underline ' + (isLight ? 'text-nike-black' : 'text-white')}>
                    {item.user_name}
                    {item.user_is_premium && <PremiumBadge size={12} animate={false} />}
                  </Link>
                  <p className={'text-[10px] tracking-wider ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={handleLike}
                className={'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase border transition-all duration-300 ' + (item.is_liked
                  ? 'bg-nike-red/10 text-nike-red border-nike-red/20'
                  : (isLight ? 'border-nike-gray text-nike-light hover:border-nike-red/30 hover:text-nike-red' : 'border-white/10 text-white/40 hover:text-nike-red hover:border-nike-red/30')
                )}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={item.is_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {item.like_count}
              </button>
            </div>

            {item.caption && (
              <p className={'mt-4 text-sm leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/60')}>{item.caption}</p>
            )}
          </div>
        </div>

        <div ref={commentsRef} style={{ opacity: 0 }} className={'mt-8 p-6 md:p-8 rounded-2xl border backdrop-blur-sm liquid-glass-card ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
          <h3 className="text-xs tracking-widest uppercase font-bold mb-6">Comments ({item.comment_count})</h3>

          <div className="flex gap-3 mb-8">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-nike-gray/30">
              {user?.profile?.avatar ? (
                <img src={mediaUrl(user.profile.avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-nike-red/20 text-nike-red">
                  {(user?.username || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder={replyTo ? 'Reply...' : 'Add a comment...'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment(replyTo?.id || null)}
                className={'w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ' + (isLight ? 'bg-white border-nike-gray text-nike-black focus:border-nike-red' : 'bg-nike-black/60 border-white/10 text-white focus:border-nike-red')}
              />
              {replyTo && (
                <div className="flex items-center gap-2 mt-2">
                  <span className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Replying to {replyTo.user_name}</span>
                  <button onClick={() => { setReplyTo(null); setCommentText('') }} className="text-[10px] text-nike-red hover:underline">Cancel</button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {comments.length === 0 ? (
              <p className={'text-center py-8 text-sm ' + (isLight ? 'text-nike-light' : 'text-white/30')}>No comments yet. Be the first!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id}>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-2 ring-nike-gray/30">
                      {c.user_avatar ? (
                        <img src={mediaUrl(c.user_avatar)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold bg-nike-gray/20 text-nike-light">
                          {(c.user_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={'text-xs font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{c.user_name}</span>
                        {c.user_is_premium && <PremiumBadge size={10} animate={false} />}
                      </div>
                      <p className={'text-sm mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/60')}>{c.content}</p>
                      <button
                        onClick={() => setReplyTo(c)}
                        className={'text-[10px] tracking-wider mt-1 hover:underline ' + (isLight ? 'text-nike-light' : 'text-white/30')}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                  {c.replies?.length > 0 && (
                    <div className="ml-10 mt-3 space-y-3">
                      {c.replies.map((r) => (
                        <div key={r.id} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 ring-2 ring-nike-gray/30">
                            {r.user_avatar ? (
                              <img src={mediaUrl(r.user_avatar)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[7px] font-bold bg-nike-gray/20 text-nike-light">
                                {(r.user_name || '?')[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={'text-xs font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{r.user_name}</span>
                              {r.user_is_premium && <PremiumBadge size={10} animate={false} />}
                            </div>
                            <p className={'text-sm mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/60')}>{r.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
