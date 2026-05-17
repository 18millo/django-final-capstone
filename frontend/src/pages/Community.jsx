import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Skeleton from '../components/ui/Skeleton'
import Reveal from '../components/ui/Reveal'
import { mediaUrl } from '../utils/media'
import { playClick } from '../utils/sounds'
import { burstConfetti } from '../utils/confetti'
import { ROLE_ICONS, ROLE_LABELS, ROLE_COLORS } from '../utils/roles'

const BG = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80'

function AnimatedNumber({ n }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let i = 0
    const step = Math.ceil(n / 30)
    const t = setInterval(() => {
      i += step
      if (i >= n) { setV(n); clearInterval(t) }
      else setV(i)
    }, 40)
    return () => clearInterval(t)
  }, [n])
  return v
}

const QUOTES = [
  'The fight is won or lost far away from witnesses — in the gym, on the road, late at night.',
  'It\'s not about being the best. It\'s about being better than you were yesterday.',
  'Champions keep playing until they get it right.',
  'The only easy day was yesterday.',
  'Your training partner\'s success is your success.',
  'Iron sharpens iron. One fighter sharpens another.',
]

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.athlete
  return (
    <div className={'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] tracking-widest uppercase font-bold border ' + c.bg + ' ' + c.text + ' ' + c.border}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
        <path d={ROLE_ICONS[role] || ROLE_ICONS.athlete} />
      </svg>
      {ROLE_LABELS[role] || role}
    </div>
  )
}

export default function Community() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('followers')
  const [animatingId, setAnimatingId] = useState(null)
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])
  const firstFollow = useRef(false)

  const fetchUsers = () => {
    setLoading(true)
    api.get('/auth/users/')
      .then((res) => setUsers(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const sorted = useMemo(() => {
    let list = [...users]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((u) => (u.username || '').toLowerCase().includes(q) || (u.display_name || '').toLowerCase().includes(q) || u.role.includes(q))
    }
    if (sort === 'followers') list.sort((a, b) => b.follower_count - a.follower_count)
    else if (sort === 'az') list.sort((a, b) => (a.username || 'zzz').localeCompare(b.username || 'zzz'))
    else if (sort === 'newest') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return list
  }, [users, search, sort])

  const toggleFollow = async (targetId, isFollowing) => {
    playClick()
    setAnimatingId(targetId)
    setTimeout(() => setAnimatingId(null), 300)
    const endpoint = isFollowing ? '/auth/users/' + targetId + '/unfollow/' : '/auth/users/' + targetId + '/follow/'
    try {
      await api.post(endpoint)
      setUsers((prev) => prev.map((u) => u.id === targetId ? { ...u, is_following: !isFollowing, follower_count: u.follower_count + (isFollowing ? -1 : 1) } : u))
      if (!isFollowing && !firstFollow.current) {
        firstFollow.current = true
        burstConfetti()
      }
    } catch {}
  }

  const totalUsers = users.length
  const totalFollowers = users.reduce((s, u) => s + u.follower_count, 0)
  const filtered = sorted.filter((u) => u.id !== user?.id)

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10">

        {/* HERO */}
        <div className="relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-nike-red/10 backdrop-blur-sm text-nike-red text-xs tracking-widest uppercase font-bold px-4 py-2 rounded-full border border-nike-red/20 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d={ROLE_ICONS.athlete}/></svg>
                Fighter's Circle
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">THE SQUAD</h1>
              <p className={'max-w-lg mx-auto text-sm leading-relaxed mb-8 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>"{quote}"</p>
            </Reveal>
            <Reveal delay={100}>
              <div className="flex justify-center gap-10 md:gap-20">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black">{loading ? '—' : <AnimatedNumber n={totalUsers} />}</div>
                  <div className={'text-xs tracking-widest uppercase mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Warriors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black">{loading ? '—' : <AnimatedNumber n={totalFollowers} />}</div>
                  <div className={'text-xs tracking-widest uppercase mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black">∞</div>
                  <div className={'text-xs tracking-widest uppercase mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Potential</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Search + Sort bar */}
        <div className="max-w-5xl mx-auto px-6 mb-10">
          <Reveal delay={150}>
            <div className={'flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border backdrop-blur-md ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search fighters by name or role…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={'w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 ' + (isLight
                    ? 'bg-nike-gray/30 text-nike-black placeholder:text-nike-light border border-nike-gray focus:border-nike-red/50'
                    : 'bg-white/5 text-white placeholder:text-white/30 border border-white/10 focus:border-white/40'
                  )}
                />
              </div>
              <div className="flex gap-2">
                {[
                  { key: 'followers', label: 'Top' },
                  { key: 'newest', label: 'New' },
                  { key: 'az', label: 'A-Z' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => { playClick(); setSort(s.key) }}
                    className={'px-4 py-2 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 ' + (sort === s.key
                      ? 'bg-nike-red text-white'
                      : (isLight ? 'bg-nike-gray/30 text-nike-light hover:bg-nike-gray/50' : 'bg-white/5 text-white/40 hover:bg-white/10')
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* User grid */}
        <div className="max-w-5xl mx-auto px-6 pb-20">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              <Skeleton count={6} />
            </div>
          ) : filtered.length === 0 ? (
            <Reveal>
              <div className={'text-center py-20 rounded-2xl border backdrop-blur-md ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
                <div className="text-5xl mb-4">🥊</div>
                <p className={'text-sm font-bold mb-1 ' + (isLight ? 'text-nike-black' : 'text-white')}>{search ? 'No fighters match your search' : 'The squad is empty'}</p>
                <p className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{search ? 'Try a different name or role.' : 'Invite your crew to join CombatHub!'}</p>
              </div>
            </Reveal>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((u, i) => (
                <Reveal key={u.id} delay={i * 60}>
                  <div className={'group relative rounded-2xl p-5 border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ' + (isLight ? 'bg-white/90 border-nike-gray shadow-sm' : 'bg-nike-dark/80 border-white/5 hover:border-white/20')}>
                    {i === 0 && <div className="absolute -top-2 -right-2 w-8 h-8 bg-nike-amber rounded-full flex items-center justify-center text-xs font-black shadow-lg">👑</div>}
                    {i === 1 && <div className="absolute -top-2 -right-2 w-8 h-8 bg-nike-gray rounded-full flex items-center justify-center text-xs font-black shadow-lg">🥈</div>}
                    {i === 2 && <div className="absolute -top-2 -right-2 w-8 h-8 bg-nike-orange/60 rounded-full flex items-center justify-center text-xs font-black shadow-lg">🥉</div>}

                    <div className="flex items-center gap-4 mb-4">
                      <Link to={'/profile/' + u.id} className="w-12 h-12 rounded-full overflow-hidden ring-2 shrink-0 transition-all duration-300 group-hover:ring-nike-red/50" style={{ '--tw-ring-color': 'var(--color-nike-gray)' }}>
                        {u.profile?.avatar ? (
                          <img src={mediaUrl(u.profile.avatar)} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}>
                            {(u.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={'/profile/' + u.id} className={'text-sm font-bold truncate block hover:underline ' + (isLight ? 'text-nike-black' : 'text-white')}>
                          {u.username || 'Anonymous'}
                        </Link>
                        <div className="mt-1"><RoleBadge role={u.role} /></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-3 text-xs" style={{ color: 'var(--color-nike-light)' }}>
                        <span><strong className={'font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{u.follower_count}</strong> <span className="hidden sm:inline">followers</span></span>
                        <span><strong className={'font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{u.following_count}</strong> <span className="hidden sm:inline">following</span></span>
                      </div>
                      <button
                        onClick={() => toggleFollow(u.id, u.is_following)}
                        className={'shrink-0 text-xs tracking-widest uppercase font-bold px-4 py-2 rounded-full transition-all duration-300 ' + (u.is_following
                          ? (isLight ? 'bg-nike-gray text-nike-light hover:bg-nike-red hover:text-white' : 'bg-white/10 text-white/60 hover:bg-nike-red hover:text-white')
                          : 'bg-nike-red text-white hover:bg-white hover:text-nike-black'
                        ) + ' ' + (animatingId === u.id ? 'animate-followPop' : '')}
                      >
                        {u.is_following ? 'Following' : 'Follow'}
                      </button>
                    </div>

                    {u.profile?.bio && (
                      <p className={'text-xs mt-3 leading-relaxed line-clamp-2 border-t pt-3 ' + (isLight ? 'text-nike-light border-nike-gray/50' : 'text-white/40 border-white/5')}>{u.profile.bio}</p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
