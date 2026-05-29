import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'

export default function GalleryDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/auth/gallery/${id}/`),
      api.get(`/auth/gallery/${id}/comments/list/`),
    ])
      .then(([itemRes, commentsRes]) => {
        setItem(itemRes.data)
        setComments(commentsRes.data?.results || commentsRes.data || [])
      })
      .catch((err) => {
        setError(err.response?.status === 404 ? 'Gallery item not found.' : 'Failed to load gallery item.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleLike = async () => {
    const res = await api.post(`/auth/gallery/${id}/like/`)
    setItem((prev) => ({ ...prev, is_liked: res.data.liked, like_count: res.data.like_count }))
  }

  const handleComment = async (parentId = null) => {
    if (!commentText.trim()) return
    const payload = { content: commentText }
    if (parentId) payload.parent = parentId
    const res = await api.post(`/auth/gallery/${id}/comments/`, payload)
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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="aspect-video rounded-2xl animate-pulse" style={{ background: 'var(--theme-surface)' }} />
      </div>
    )
  }
  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-secondary)' }}>{error || 'Gallery item not found.'}</p>
        <Link to="/vendor/gallery" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: 'var(--theme-text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Gallery
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/vendor/gallery"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition-colors"
        style={{ color: 'var(--theme-text-secondary)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Gallery
      </Link>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
        <div className="aspect-video overflow-hidden flex items-center justify-center" style={{ background: 'var(--theme-surface)' }}>
          {item.image_url && !imgError ? (
            <img
              src={item.image_url}
              alt={item.caption || 'Gallery image'}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{ color: 'var(--theme-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
              {imgError ? 'Image unavailable' : 'No image available'}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: '2px solid var(--theme-border)' }}>
                {item.user_avatar ? (
                  <img src={item.user_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-muted)' }}>
                    {(item.user_name || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>{item.user_name}</p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</p>
              </div>
            </div>
            <button
              onClick={handleLike}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-colors"
              style={{
                background: item.is_liked ? 'rgba(229,16,29,0.1)' : 'var(--theme-surface)',
                color: item.is_liked ? '#e5101d' : 'var(--theme-text-secondary)',
                border: `1px solid ${item.is_liked ? 'rgba(229,16,29,0.2)' : 'var(--theme-border)'}`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={item.is_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {item.like_count || 0}
            </button>
          </div>

          {item.caption && (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{item.caption}</p>
          )}
        </div>
      </div>

      <div className="mt-6 p-6 rounded-2xl" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--theme-text)' }}>Comments ({item.comment_count || 0})</h3>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder={replyTo ? 'Reply...' : 'Add a comment...'}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment(replyTo?.id || null)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
          />
          {replyTo && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Replying to {replyTo.user_name}</span>
              <button onClick={() => { setReplyTo(null); setCommentText('') }} className="text-xs" style={{ color: '#e5101d' }}>Cancel</button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: 'var(--theme-text-muted)' }}>No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id}>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0" style={{ border: '1px solid var(--theme-border)' }}>
                    {c.user_avatar ? (
                      <img src={c.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-bold" style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-muted)' }}>
                        {(c.user_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: 'var(--theme-text)' }}>{c.user_name}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>{c.content}</p>
                    <button
                      onClick={() => setReplyTo(c)}
                      className="text-xs mt-1 hover:underline" style={{ color: 'var(--theme-text-muted)' }}
                    >
                      Reply
                    </button>
                  </div>
                </div>
                {c.replies?.length > 0 && (
                  <div className="ml-10 mt-3 space-y-3">
                    {c.replies.map((r) => (
                      <div key={r.id} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0" style={{ border: '1px solid var(--theme-border)' }}>
                          {r.user_avatar ? (
                            <img src={r.user_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[7px] font-bold" style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-muted)' }}>
                              {(r.user_name || '?')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold" style={{ color: 'var(--theme-text)' }}>{r.user_name}</p>
                          <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>{r.content}</p>
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
  )
}