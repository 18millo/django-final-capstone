import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { playClick, playSuccess } from '../utils/sounds'
import { mediaUrl } from '../utils/media'
import { toast } from '../components/ui/Toast'

const BG = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80'

export default function Forum() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardClass = isLight ? 'bg-white border-nike-gray' : 'bg-nike-dark border-white/5'

  const fetchPosts = () => {
    setLoading(true)
    api.get('/auth/posts/')
      .then((res) => setPosts(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPosts() }, [])

  const toggleLike = async (postId) => {
    playClick()
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, is_liked: !p.is_liked, like_count: p.like_count + (p.is_liked ? -1 : 1) } : p))
    try {
      await api.post('/auth/posts/' + postId + '/like/')
    } catch {
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, is_liked: !p.is_liked, like_count: p.like_count + (p.is_liked ? -1 : 1) } : p))
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Forum</h1>
            <p className={'text-sm mt-1 ' + mutedClass}>Discuss combat sports with the community</p>
          </div>
          <Link
            to="/forum/new"
            onClick={() => playClick()}
            className="self-start sm:self-auto bg-nike-red text-white hover:bg-white hover:text-nike-black px-6 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
          >
            + New Post
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : posts.length === 0 ? (
          <Reveal>
            <div className={'p-12 rounded-2xl border text-center ' + cardClass}>
              <div className="text-5xl mb-4">📢</div>
              <p className={'text-lg font-bold mb-1 ' + textClass}>No posts yet</p>
              <p className={'text-sm mb-6 ' + mutedClass}>Be the first to start a discussion!</p>
              <Link to="/forum/new" className="bg-nike-red text-white px-6 py-3 rounded-xl text-xs tracking-widest uppercase font-bold inline-block hover:bg-white hover:text-nike-black transition-all duration-300">
                Create Post
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="space-y-4">
            {posts.map((p, i) => (
              <Reveal key={p.id} delay={i * 50}>
                <div className={'rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.005] ' + cardClass}>
                  <div className="flex items-center gap-3 mb-3">
                    <Link to={'/profile/' + p.author} className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-nike-gray/20">
                      {p.author_avatar ? (
                        <img src={mediaUrl(p.author_avatar)} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-nike-light)' }}>
                          {(p.author_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className={'text-sm font-bold truncate ' + textClass}>{p.author_name}</p>
                      <p className={'text-[10px] ' + mutedClass}>{new Date(p.created_at).toLocaleDateString()} · {p.author_role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Link to={'/forum/' + p.id} className="block">
                    <p className={'text-sm leading-relaxed whitespace-pre-wrap ' + textClass}>{p.content}</p>
                    {p.file_url && (
                      /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(p.file_url) ? (
                        <video src={p.file_url} controls className="mt-3 rounded-xl max-h-80 w-full" />
                      ) : (
                        <img src={p.file_url} alt="" className="mt-3 rounded-xl max-h-80 w-full object-cover" />
                      )
                    )}
                  </Link>
                  <div className={'flex items-center gap-4 mt-4 pt-3 border-t ' + borderClass}>
                    <button
                      onClick={() => toggleLike(p.id)}
                      className={'flex items-center gap-1.5 text-xs font-bold transition-colors ' + (p.is_liked ? 'text-nike-red' : mutedClass + ' hover:text-nike-red')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={p.is_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                      {p.like_count || ''}
                    </button>
                    <Link to={'/forum/' + p.id} className={'flex items-center gap-1.5 text-xs font-bold ' + mutedClass + ' hover:text-nike-red transition-colors'}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {p.comment_count || ''}
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}