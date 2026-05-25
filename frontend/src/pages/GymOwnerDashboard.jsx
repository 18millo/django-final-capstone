import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { mediaUrl } from '../utils/media'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

export default function GymOwnerDashboard() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)
  const [blocking, setBlocking] = useState(null)
  const [followers, setFollowers] = useState([])

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'

  const blockUser = async (userId) => {
    if (!confirm('Block this user? They will be removed from your followers.')) return
    setBlocking(userId)
    try {
      await api.post('/auth/users/' + userId + '/block/')
      setFollowers((prev) => prev.filter((f) => f.id !== userId))
      playSuccess()
      toast('User blocked', 'success')
    } catch {
      toast('Failed to block user', 'error')
    } finally {
      setBlocking(null)
    }
  }

  const removeFollower = async (followerId) => {
    setRemoving(followerId)
    try {
      await api.post('/auth/users/' + followerId + '/remove-follower/')
      setFollowers((prev) => prev.filter((f) => f.id !== followerId))
      playSuccess()
      toast('Follower removed', 'success')
    } catch {
      toast('Failed to remove follower', 'error')
    } finally {
      setRemoving(null)
    }
  }

  useEffect(() => {
    setLoading(true)
    api.get('/auth/dashboard/gym/stats/')
      .then((res) => {
        setStats(res.data)
        setFollowers(res.data.recent_followers || [])
      })
      .catch(() => toast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className={'min-h-[calc(100vh-4rem)] flex items-center justify-center ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <Spinner />
    </div>
  )

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={'w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ' + (isLight ? 'bg-amber-500/20 text-amber-500' : 'bg-amber-500/10 text-amber-400')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
              </div>
              <div>
                <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Gym Dashboard</h1>
                <p className={'text-sm mt-0.5 ' + mutedClass}>Manage your gym's community</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/groups" className={'flex items-center gap-2 px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM6 10h.01M18 10h.01"/></svg>
                My Groups
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <Reveal delay={50}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Total Followers</div>
              <div className={'text-3xl font-black ' + textClass}>{stats?.total_followers || 0}</div>
            </div>
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Forum Posts</div>
              <div className={'text-3xl font-black ' + textClass}>{stats?.total_posts || 0}</div>
            </div>
            <Link to="/groups" className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg + ' hover:opacity-80 transition-opacity'}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Groups</div>
              <div className={'text-3xl font-black text-emerald-400 flex items-center gap-2'}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Manage
              </div>
            </Link>
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Premium</div>
              <div className={'text-3xl font-black ' + (user?.profile?.is_premium ? 'text-emerald-400' : textClass)}>
                {user?.profile?.is_premium ? 'Active' : 'Free'}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Quick Actions */}
        <Reveal delay={100}>
          <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className={'text-xs tracking-widest uppercase font-bold mb-4 ' + mutedClass}>Quick Actions</div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { playClick(); navigate('/groups') }}
                className="flex items-center gap-2 bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                Create Group
              </button>
              <button
                onClick={() => { playClick(); navigate('/events/new') }}
                className={'flex items-center gap-2 px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                New Event
              </button>
              <button
                onClick={() => { playClick(); navigate('/forum/new') }}
                className={'flex items-center gap-2 px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                New Post
              </button>
              <button
                onClick={() => { playClick(); navigate('/community') }}
                className={'flex items-center gap-2 px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Community
              </button>
            </div>
          </div>
        </Reveal>

        {/* Recent Followers */}
        <Reveal delay={120}>
          <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className="flex items-center justify-between mb-4">
              <div className={'text-xs tracking-widest uppercase font-bold ' + mutedClass}>
                Recent Followers
                <span className={'ml-2 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>({stats?.total_followers || 0})</span>
              </div>
            </div>
            {followers.length === 0 ? (
              <p className={'text-sm ' + mutedClass}>No followers yet.</p>
            ) : (
              <div className="grid gap-2">
                {followers.map((f) => (
                  <div key={f.id} className={'flex items-center justify-between p-3 rounded-xl flex-wrap gap-2 ' + (isLight ? 'bg-nike-gray/20' : 'bg-white/5')}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-nike-gray/30 flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-nike-light)' }}>
                        {f.profile?.avatar ? <img src={mediaUrl(f.profile.avatar)} className="w-full h-full object-cover" alt="" /> : (f.username || '?')[0].toUpperCase()}
                      </div>
                      <span className={'text-sm font-bold truncate ' + textClass}>{f.username || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFollower(f.id)}
                        disabled={removing === f.id}
                        className={'px-3 py-1.5 rounded-lg text-[10px] tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
                      >
                        {removing === f.id ? '...' : 'Remove'}
                      </button>
                      <button
                        onClick={() => blockUser(f.id)}
                        disabled={blocking === f.id}
                        className="px-3 py-1.5 rounded-lg text-[10px] tracking-widest uppercase font-bold border border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white transition-all"
                      >
                        {blocking === f.id ? '...' : 'Block'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  )
}