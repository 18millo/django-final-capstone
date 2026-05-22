import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { playClick } from '../utils/sounds'
import { mediaUrl } from '../utils/media'

export default function CoachDashboard() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const [followers, setFollowers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'

  useEffect(() => {
    Promise.all([
      api.get('/auth/me/followers/'),
      api.get('/auth/dashboard/coach/stats/'),
    ])
      .then(([fRes, sRes]) => {
        setFollowers(fRes.data?.results || fRes.data || [])
        setStats(sRes.data)
      })
      .catch(() => {})
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
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className={'w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ' + (isLight ? 'bg-nike-amber/20 text-nike-amber' : 'bg-nike-amber/10 text-nike-amber')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div>
              <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Coach Dashboard</h1>
              <p className={'text-sm mt-0.5 ' + mutedClass}>Connect with your athletes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stats Cards */}
        <Reveal delay={50}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Followers</div>
              <div className={'text-3xl font-black ' + textClass}>{stats?.total_followers || followers.length}</div>
            </div>
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Forum Posts</div>
              <div className={'text-3xl font-black ' + textClass}>{stats?.total_posts || 0}</div>
            </div>
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Engagement</div>
              <div className={'text-3xl font-black ' + textClass}>
                {followers.length > 0 ? Math.round((followers.reduce((s, f) => s + (f.follower_count || 0), 0) / followers.length) * 10) / 10 : 0}
              </div>
              <div className={'text-[10px] mt-1 ' + mutedClass}>avg followers per athlete</div>
            </div>
            <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-2 ' + mutedClass}>Growth</div>
              <div className={'text-3xl font-black ' + (followers.length > 5 ? 'text-emerald-400' : textClass)}>
                {followers.length > 5 ? '↑' : '—'}
              </div>
              <div className={'text-[10px] mt-1 ' + mutedClass}>{followers.length > 5 ? 'Growing strong' : 'Building momentum'}</div>
            </div>
          </div>
        </Reveal>

        {/* Quick Actions */}
        <Reveal delay={100}>
          <div className={'p-5 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className={'text-xs tracking-widest uppercase font-bold mb-4 ' + mutedClass}>Quick Actions</div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { playClick(); navigate('/forum/new') }}
                className="flex items-center gap-2 bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                New Post
              </button>
              <button
                onClick={() => { playClick(); navigate('/community') }}
                className={'flex items-center gap-2 px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all duration-300 ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Browse Athletes
              </button>
              <button
                onClick={() => { playClick(); navigate('/forum') }}
                className={'flex items-center gap-2 px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all duration-300 ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Forum
              </button>
            </div>
          </div>
        </Reveal>

        {/* Followers List */}
        <Reveal delay={150}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={'text-xs tracking-widest uppercase font-bold ' + mutedClass}>
                Your Athletes
                <span className={'ml-2 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>({followers.length})</span>
              </h2>
            </div>

            {followers.length === 0 ? (
              <div className={'text-center py-16 rounded-2xl border ' + borderClass + ' ' + cardBg}>
                <div className="text-6xl mb-4">🏋️</div>
                <p className={'text-lg font-bold ' + textClass}>No athletes yet</p>
                <p className={'text-sm mt-1 ' + mutedClass}>When athletes follow you, they'll appear here.</p>
                <button
                  onClick={() => { playClick(); navigate('/community') }}
                  className="mt-6 bg-nike-red text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase font-bold hover:bg-white hover:text-nike-black transition-all duration-300 shadow-lg shadow-nike-red/30"
                >
                  Find Athletes
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {followers.map((f, i) => (
                  <Reveal key={f.id} delay={i * 40}>
                    <div
                      className={'flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.002] cursor-pointer ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}
                      onClick={() => { playClick(); navigate('/messages?user=' + f.id) }}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-lg font-bold" style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>
                        {f.profile?.avatar ? (
                          <img src={mediaUrl(f.profile.avatar)} alt={''} className="w-full h-full object-cover" />
                        ) : (
                          (f.display_name || f.username || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={'text-sm font-bold truncate ' + textClass}>{f.display_name || f.username}</p>
                        <div className={'flex items-center gap-3 mt-0.5 ' + mutedClass}>
                          <span className="text-xs">{f.follower_count} follower{f.follower_count !== 1 ? 's' : ''}</span>
                          <span className="text-[10px]">·</span>
                          <span className={'text-[10px] capitalize ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{f.role || 'athlete'}</span>
                        </div>
                        {f.profile && (f.profile.weight_class || f.profile.height_ft || f.profile.height_in || f.profile.reach_in || f.profile.stance) && (
                          <div className={'flex items-center gap-2 mt-1 text-[10px] uppercase tracking-wider ' + mutedClass}>
                            {f.profile.weight_class && <span>{f.profile.weight_class}</span>}
                            {(f.profile.height_ft || f.profile.height_in) && (
                              <span>{f.profile.height_ft || 0}'{f.profile.height_in || 0}"</span>
                            )}
                            {f.profile.reach_in && <span>{f.profile.reach_in}" reach</span>}
                            {f.profile.stance && <span>{f.profile.stance}</span>}
                          </div>
                        )}
                      </div>
                      <div className={'text-xs font-bold px-4 py-2 rounded-xl border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-red hover:text-white hover:border-nike-red' : 'border-white/10 text-white/40 hover:bg-nike-red hover:text-white hover:border-nike-red')}>
                        Message
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </Reveal>

      </div>
    </div>
  )
}
