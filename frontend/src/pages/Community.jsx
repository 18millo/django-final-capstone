import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Skeleton from '../components/ui/Skeleton'
import Reveal from '../components/ui/Reveal'
import { mediaUrl } from '../utils/media'
import { playClick, playSuccess } from '../utils/sounds'
import { burstConfetti } from '../utils/confetti'
import { ROLE_ICONS, ROLE_LABELS, ROLE_COLORS } from '../utils/roles'
import ReportModal from '../components/ui/ReportModal'
import { toast } from '../components/ui/Toast'

const BG = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80'

const QUOTES = [
  'The fight is won or lost far away from witnesses — in the gym, on the road, late at night.',
  'It\'s not about being the best. It\'s about being better than you were yesterday.',
  'Champions keep playing until they get it right.',
  'The only easy day was yesterday.',
  'Your training partner\'s success is your success.',
  'Iron sharpens iron. One fighter sharpens another.',
]

const ROLE_TABS = [
  { key: '', label: 'All Warriors', icon: null },
  { key: 'athlete', label: 'Athletes', icon: ROLE_ICONS.athlete },
  { key: 'gym_owner', label: 'Gyms', icon: ROLE_ICONS.gym_owner },
  { key: 'coach', label: 'Coaches', icon: ROLE_ICONS.coach },
  { key: 'vendor', label: 'Vendors', icon: ROLE_ICONS.vendor },
]

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

function GroupPreviewList() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/auth/groups/')
      .then((res) => setGroups((res.data.results || res.data || []).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <Skeleton count={2} />
  if (groups.length === 0) return <p className={'text-sm ' + mutedClass}>No groups yet — be the first to create one!</p>
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {groups.map((g) => (
        <Link
          key={g.id}
          to={'/groups/' + g.id}
          className={'group flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5 hover:border-white/20')}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-nike-light)' }}>
            {g.avatar ? <img src={mediaUrl(g.avatar)} className="w-full h-full object-cover" alt="" /> : (g.name || 'G')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className={'text-sm font-bold truncate ' + textClass}>{g.name}</p>
            <p className={'text-[10px] ' + mutedClass}>{g.member_count} member{(g.member_count || 0) !== 1 ? 's' : ''}{g.is_private ? ' · Private' : ' · Public'}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

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
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('followers')
  const [roleFilter, setRoleFilter] = useState('')
  const [animatingId, setAnimatingId] = useState(null)
  const [blockingId, setBlockingId] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])
  const firstFollow = useRef(false)
  const sentinelRef = useRef(null)
  const searchTimeout = useRef(null)
  const totalCount = useRef(0)

  const buildParams = useCallback((pageNum, searchTerm, sortBy, role) => {
    const params = { page: pageNum, page_size: 20 }
    if (searchTerm) params.search = searchTerm
    if (sortBy === 'followers') params.ordering = '-follower_count'
    else if (sortBy === 'newest') params.ordering = '-created_at'
    else if (sortBy === 'az') params.ordering = 'username'
    if (role) params.role = role
    return params
  }, [])

  const fetchUsers = useCallback(async (pageNum, append = false) => {
    const params = buildParams(pageNum, search, sort, roleFilter)
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const res = await api.get('/auth/users/', { params })
      const results = res.data.results || []
      totalCount.current = res.data.count || results.length
      if (append) {
        setUsers((prev) => [...prev, ...results])
      } else {
        setUsers(results)
      }
      setHasMore(!!res.data.next)
    } catch {}
    if (append) setLoadingMore(false)
    else setLoading(false)
  }, [search, sort, roleFilter, buildParams])

  useEffect(() => {
    setUsers([])
    setHasMore(true)
    fetchUsers(1, false)
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [search, sort, roleFilter, fetchUsers])

  useEffect(() => {
    if (page <= 1) return
    fetchUsers(page, true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [page, fetchUsers])

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage((p) => p + 1)
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore])

  const handleSearch = (value) => {
    setSearch(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearch(value)
    }, 300)
  }

  const handleRoleFilter = (role) => {
    playClick()
    setRoleFilter(role)
    setPage(1)
  }

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

  const blockUser = async (userId) => {
    if (!confirm('Block this user? They will not be able to interact with you.')) return
    setBlockingId(userId)
    try {
      await api.post('/auth/users/' + userId + '/block/')
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      playSuccess()
      toast('User blocked', 'success')
    } catch {
      toast('Failed to block user', 'error')
    } finally {
      setBlockingId(null)
    }
  }

  const filtered = useMemo(() => users.filter((u) => u.id !== user?.id), [users, user])

  const gymOwners = useMemo(() => users.filter((u) => u.role === 'gym_owner' && u.id !== user?.id), [users, user])

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
              <div className="flex justify-center gap-6 md:gap-12">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black">{loading ? '—' : <AnimatedNumber n={totalCount.current} />}</div>
                  <div className={'text-xs tracking-widest uppercase mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Warriors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black">{loading ? '—' : <AnimatedNumber n={users.reduce((s, u) => s + u.follower_count, 0)} />}</div>
                  <div className={'text-xs tracking-widest uppercase mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black">{loading ? '—' : <AnimatedNumber n={users.filter((u) => u.role === 'gym_owner').length} />}</div>
                  <div className={'text-xs tracking-widest uppercase mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Gyms</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Search + Sort bar */}
        <div className="max-w-5xl mx-auto px-6 mb-6">
          <Reveal delay={150}>
            <div className={'flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border backdrop-blur-md ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search fighters by name or role…"
                  defaultValue={search}
                  onChange={(e) => handleSearch(e.target.value)}
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
                    onClick={() => { playClick(); setSort(s.key); setPage(1) }}
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

        {/* Role filter tabs */}
        <div className="max-w-5xl mx-auto px-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleRoleFilter(tab.key)}
                className={'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300 border ' + (roleFilter === tab.key
                  ? 'bg-nike-red text-white border-nike-red shadow-lg shadow-nike-red/30'
                  : (isLight ? 'bg-white/80 text-nike-light border-nike-gray/50 hover:border-nike-red/50 hover:text-nike-red' : 'bg-nike-dark/80 text-white/40 border-white/10 hover:border-white/30')
                )}
              >
                {tab.icon && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <path d={tab.icon} />
                  </svg>
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gym owners highlight section */}
        {!roleFilter && gymOwners.length > 0 && !loading && (
          <div className="max-w-5xl mx-auto px-6 mb-10">
            <Reveal delay={100}>
              <div className="mb-4 flex items-center gap-3">
                <div className={'flex items-center gap-2 text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d={ROLE_ICONS.gym_owner}/></svg>
                  Featured Gyms
                </div>
                <div className={'h-px flex-1 ' + (isLight ? 'bg-nike-gray/50' : 'bg-white/10')} />
                <span className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{gymOwners.length} gyms</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {gymOwners.slice(0, 8).map((gym) => (
                  <Link
                    key={gym.id}
                    to={'/profile/' + gym.id}
                    className={'group relative rounded-xl overflow-hidden border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ' + (isLight ? 'bg-white/90 border-nike-gray shadow-sm' : 'bg-nike-dark/80 border-white/5 hover:border-white/20')}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      {gym.profile?.avatar ? (
                        <img src={mediaUrl(gym.profile.avatar)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-nike-gray/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={'w-10 h-10 ' + (isLight ? 'text-nike-light' : 'text-white/20')}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className={'text-xs font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{gym.display_name || gym.username}</p>
                      {gym.profile?.business_location && (
                        <p className={'text-[10px] mt-0.5 flex items-center gap-1 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {gym.profile.business_location}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        )}

        {/* Groups section */}
        <div className="max-w-5xl mx-auto px-6 mb-10">
          <Reveal delay={100}>
            <div className="mb-4 flex items-center gap-3">
              <div className={'flex items-center gap-2 text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM6 10h.01M18 10h.01"/></svg>
                Training Groups
              </div>
              <div className={'h-px flex-1 ' + (isLight ? 'bg-nike-gray/50' : 'bg-white/10')} />
              <button onClick={() => { playClick(); navigate('/groups') }} className={'text-[10px] tracking-widest uppercase font-bold hover:underline ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')}>
                View all
              </button>
            </div>
            <GroupPreviewList />
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
            <>
              <div className={'text-xs mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                Showing {filtered.length} of {totalCount.current} warriors
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((u, i) => (
                  <Reveal key={u.id} delay={(i % 20) * 60}>
                    <div className={'group relative rounded-2xl p-5 border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ' + (isLight ? 'bg-white/90 border-nike-gray shadow-sm' : 'bg-nike-dark/80 border-white/5 hover:border-white/20')}>
                      {i === 0 && !roleFilter && <div className="absolute -top-2 -right-2 w-8 h-8 bg-nike-amber rounded-full flex items-center justify-center text-xs font-black shadow-lg">👑</div>}
                      {i === 1 && !roleFilter && <div className="absolute -top-2 -right-2 w-8 h-8 bg-nike-gray rounded-full flex items-center justify-center text-xs font-black shadow-lg">🥈</div>}
                      {i === 2 && !roleFilter && <div className="absolute -top-2 -right-2 w-8 h-8 bg-nike-orange/60 rounded-full flex items-center justify-center text-xs font-black shadow-lg">🥉</div>}

                      <div className="flex items-center gap-4 mb-4">
                        <Link to={'/profile/' + u.id} className="w-12 h-12 rounded-full overflow-hidden ring-2 shrink-0 transition-all duration-300 group-hover:ring-nike-red/50">
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
                            {u.display_name || u.username || 'Anonymous'}
                          </Link>
                          <div className="mt-1 flex items-center gap-2">
                            <RoleBadge role={u.role} />
                            {u.profile?.business_location && u.role === 'gym_owner' && (
                              <span className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{u.profile.business_location}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex gap-3 text-xs" style={{ color: 'var(--color-nike-light)' }}>
                          <span><strong className={'font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{u.follower_count}</strong> <span className="hidden sm:inline">followers</span></span>
                          <span><strong className={'font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{u.following_count}</strong> <span className="hidden sm:inline">following</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          {user && user.id !== u.id && (
                            <>
                              <Link
                                to={'/messages?user=' + u.id}
                                className={'text-xs font-bold px-3 py-2 rounded-full border transition-all duration-200 ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
                                onClick={playClick}
                              >
                                💬
                              </Link>
                              <button
                                onClick={() => { playClick(); setReportTarget({ type: 'user', id: u.id }) }}
                                className={'text-xs px-2.5 py-2 rounded-full border transition-all duration-200 ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
                                title="Report"
                              >
                                🚩
                              </button>
                              <button
                                onClick={() => blockUser(u.id)}
                                disabled={blockingId === u.id}
                                className={'text-xs px-2.5 py-2 rounded-full border transition-all duration-200 ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-red/20 hover:text-nike-red' : 'border-white/10 text-white/40 hover:bg-nike-red/20 hover:text-nike-red')}
                                title="Block"
                              >
                                {blockingId === u.id ? '…' : '🚫'}
                              </button>
                            </>
                          )}
                          {user && user.role === 'athlete' && user.id !== u.id && (
                            <button
                              onClick={() => toggleFollow(u.id, u.is_following)}
                              className={'shrink-0 text-xs tracking-widest uppercase font-bold px-4 py-2 rounded-full transition-all duration-300 ' + (u.is_following
                                ? (isLight ? 'bg-nike-gray text-nike-light hover:bg-nike-red hover:text-white' : 'bg-white/10 text-white/60 hover:bg-nike-red hover:text-white')
                                : 'bg-nike-red text-white hover:bg-white hover:text-nike-black'
                              ) + ' ' + (animatingId === u.id ? 'animate-followPop' : '')}
                            >
                              {u.is_following ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                      </div>

                      {u.profile?.bio && (
                        <p className={'text-xs mt-3 leading-relaxed line-clamp-2 border-t pt-3 ' + (isLight ? 'text-nike-light border-nike-gray/50' : 'text-white/40 border-white/5')}>{u.profile.bio}</p>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-20 flex items-center justify-center">
                {loadingMore && <Spinner />}
                {!hasMore && filtered.length > 0 && (
                  <p className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/30')}>You've seen all warriors</p>
                )}
              </div>
            </>
          )}
        </div>

      </div>

      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        targetType={reportTarget?.type}
        targetId={reportTarget?.id}
      />
    </div>
  )
}
