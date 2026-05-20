import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import Button from '../components/ui/Button'
import { playClick, playSuccess } from '../utils/sounds'
import { mediaUrl } from '../utils/media'
import { toast } from '../components/ui/Toast'

const BG = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80'

export default function PostDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardClass = isLight ? 'bg-white border-nike-gray liquid-glass-card' : 'bg-nike-dark border-white/5 liquid-glass-card'

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/auth/posts/' + id + '/'),
      api.get('/auth/posts/' + id + '/comments/list/'),
    ])
      .then(([pRes, cRes]) => {
        setPost(pRes.data)
        setComments(cRes.data.results || cRes.data)
      })
      .catch(() => navigate('/forum'))
      .finally(() => setLoading(false))
  }, [id])

  const syncPostVote = (data) => {
    setPost((prev) => ({ ...prev, is_liked: data.liked, is_disliked: data.disliked, like_count: data.like_count, dislike_count: data.dislike_count }))
  }

  const toggleLike = async () => {
    if (!post) return
    playClick()
    const wasLiked = post.is_liked
    setPost((prev) => ({ ...prev, is_liked: !wasLiked, is_disliked: false, like_count: prev.like_count + (wasLiked ? -1 : 1), dislike_count: prev.is_disliked ? prev.dislike_count - 1 : prev.dislike_count }))
    try {
      const { data } = await api.post('/auth/posts/' + id + '/like/', { vote_type: 'like' })
      syncPostVote(data)
    } catch {
      setPost((prev) => ({ ...prev, is_liked: wasLiked, is_disliked: false, like_count: prev.like_count + (wasLiked ? 1 : -1), dislike_count: prev.is_disliked ? prev.dislike_count - 1 : prev.dislike_count }))
    }
  }

  const toggleDislike = async () => {
    if (!post) return
    playClick()
    const wasDisliked = post.is_disliked
    setPost((prev) => ({ ...prev, is_disliked: !wasDisliked, is_liked: false, dislike_count: prev.dislike_count + (wasDisliked ? -1 : 1), like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count }))
    try {
      const { data } = await api.post('/auth/posts/' + id + '/like/', { vote_type: 'dislike' })
      syncPostVote(data)
    } catch {
      setPost((prev) => ({ ...prev, is_disliked: wasDisliked, is_liked: false, dislike_count: prev.dislike_count + (wasDisliked ? 1 : -1), like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count }))
    }
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      const res = await api.post('/auth/posts/' + id + '/comments/', { content: commentText })
      setComments((prev) => [...prev, res.data])
      setCommentText('')
      setPost((prev) => ({ ...prev, comment_count: prev.comment_count + 1 }))
      playSuccess()
    } catch {
      toast('Failed to post comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const submitReply = async (parentId) => {
    if (!replyText.trim()) return
    try {
      const res = await api.post('/auth/posts/' + id + '/comments/', { content: replyText, parent: parentId })
      setComments((prev) => prev.map((c) => c.id === parentId ? { ...c, replies: [...(c.replies || []), res.data] } : c))
      setReplyText('')
      setReplyingTo(null)
      playSuccess()
    } catch {
      toast('Failed to post reply', 'error')
    }
  }

  if (loading) return <div className={'min-h-screen flex items-center justify-center ' + (isLight ? 'bg-white' : 'bg-nike-black')}><Spinner /></div>
  if (!post) return null

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        <Link to="/forum" className={'text-xs tracking-widest uppercase font-bold transition-colors mb-6 inline-block ' + mutedClass + ' hover:text-nike-red'}>← Back to Forum</Link>

        <Reveal>
          <div className={'rounded-2xl border p-6 mb-6 ' + cardClass}>
            <div className="flex items-center gap-3 mb-4">
              <Link to={'/profile/' + post.author} className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-nike-gray/20">
                {post.author_avatar ? (
                  <img src={mediaUrl(post.author_avatar)} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ color: 'var(--color-nike-light)' }}>
                    {(post.author_name || '?')[0].toUpperCase()}
                  </div>
                )}
              </Link>
              <div>
                <p className={'text-sm font-bold ' + textClass}>{post.author_name}</p>
                <p className={'text-xs ' + mutedClass}>{new Date(post.created_at).toLocaleString()} · {post.author_role.replace('_', ' ')}{post.view_count !== null && post.view_count !== undefined ? ` · ${post.view_count} views` : ''}</p>
              </div>
            </div>
            <p className={'text-sm leading-relaxed whitespace-pre-wrap ' + textClass}>{post.content}</p>
            {post.file_url && (
              /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(post.file_url) ? (
                <video src={post.file_url} controls className="mt-4 rounded-xl max-h-96 w-full" />
              ) : (
                <img src={post.file_url} alt="" className="mt-4 rounded-xl max-h-96 w-full object-cover" />
              )
            )}
            <div className={'flex items-center gap-4 mt-4 pt-4 border-t ' + borderClass}>
              <button
                onClick={toggleLike}
                className={'flex items-center gap-1.5 text-sm font-bold transition-colors ' + (post.is_liked ? 'text-nike-red' : mutedClass + ' hover:text-nike-red')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={post.is_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                {post.like_count} {post.like_count === 1 ? 'like' : 'likes'}
              </button>
              <button
                onClick={toggleDislike}
                className={'flex items-center gap-1.5 text-sm font-bold transition-colors ' + (post.is_disliked ? 'text-red-400' : mutedClass + ' hover:text-red-400')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={post.is_disliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
                {post.dislike_count} {post.dislike_count === 1 ? 'dislike' : 'dislikes'}
              </button>
              <span className={'flex items-center gap-1.5 text-sm font-bold ' + mutedClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className={'rounded-2xl border p-6 mb-6 ' + cardClass}>
            <h3 className={'text-sm font-bold mb-4 ' + textClass}>Leave a Comment</h3>
            <form onSubmit={submitComment} className="space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className={'w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-300 resize-none ' +
                  (isLight ? 'bg-nike-gray/10 border border-nike-gray text-nike-black placeholder:text-nike-light focus:border-nike-red/50' : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/40')}
              />
              <Button type="submit" loading={submitting} disabled={!commentText.trim()}>Post Comment</Button>
            </form>
          </div>
        </Reveal>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className={'text-center py-8 ' + mutedClass}>
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : comments.map((c) => (
            <Reveal key={c.id}>
              <div className={'rounded-2xl border p-4 ' + cardClass}>
                <div className="flex items-center gap-2 mb-2">
                  <Link to={'/profile/' + c.author} className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-nike-gray/20">
                    {c.author_avatar ? (
                      <img src={mediaUrl(c.author_avatar)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--color-nike-light)' }}>
                        {(c.author_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <p className={'text-xs font-bold ' + textClass}>{c.author_name}</p>
                  <p className={'text-[10px] ' + mutedClass}>{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <p className={'text-sm leading-relaxed sm:ml-9 ' + textClass}>{c.content}</p>
                <button
                  onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                  className={'text-[10px] tracking-widest uppercase font-bold sm:ml-9 mt-1 ' + mutedClass + ' hover:text-nike-red transition-colors'}
                >
                  Reply
                </button>

                {replyingTo === c.id && (
                  <div className="sm:ml-9 mt-3 space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className={'w-full rounded-xl px-3 py-2 text-xs outline-none transition-all duration-300 resize-none ' +
                        (isLight ? 'bg-nike-gray/10 border border-nike-gray text-nike-black placeholder:text-nike-light focus:border-nike-red/50' : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/40')}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => submitReply(c.id)}
                        disabled={!replyText.trim()}
                        className="bg-nike-red text-white text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-xl hover:bg-white hover:text-nike-black transition-all duration-300 disabled:opacity-50"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText('') }}
                        className={'text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-xl border ' + borderClass + ' ' + mutedClass + ' hover:text-nike-red transition-colors'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {c.replies?.length > 0 && (
                  <div className="sm:ml-9 mt-3 space-y-3 border-l-2 pl-3 sm:pl-4" style={{ borderColor: 'var(--color-nike-gray)' }}>
                    {c.replies.map((r) => (
                      <div key={r.id}>
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={'/profile/' + r.author} className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-nike-gray/20">
                            {r.author_avatar ? (
                              <img src={mediaUrl(r.author_avatar)} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold" style={{ color: 'var(--color-nike-light)' }}>
                                {(r.author_name || '?')[0].toUpperCase()}
                              </div>
                            )}
                          </Link>
                          <p className={'text-[11px] font-bold ' + textClass}>{r.author_name}</p>
                          <p className={'text-[9px] ' + mutedClass}>{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className={'text-xs leading-relaxed sm:ml-7 ' + textClass}>{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}