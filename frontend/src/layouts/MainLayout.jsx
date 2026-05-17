import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import useScrollProgress from '../hooks/useScrollProgress'
import { mediaUrl } from '../utils/media'
import { playWhoosh, playClick, playSuccess } from '../utils/sounds'
import ToastContainer, { toast } from '../components/ui/Toast'
import api from '../utils/api'

const WS_BASE = 'ws://localhost:8000'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const { theme, appVersion } = useTheme()
  const isLight = theme === 'light'
  const navigate = useNavigate()
  const scrollProgress = useScrollProgress()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [notifCount, setNotifCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef(null)
  const notifWsRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!user) return
    const fetch = () => {
      api.get('/auth/notifications/unread-count/')
        .then((res) => setNotifCount(res.data.count))
        .catch(() => {})
    }
    fetch()
    const interval = setInterval(fetch, 15000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('access_token')
    if (!token) return

    let reconnectTimer = null
    let stopped = false

    const connect = () => {
      const ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`)
      notifWsRef.current = ws

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'notify_message') {
            toast(`💬 ${data.sender_name}: ${data.content}`, 'info', 5000)
            setNotifCount((p) => p + 1)
            playSuccess()
          } else if (data.type === 'notify_follow') {
            toast(`👊 ${data.actor_name} started following you!`, 'success', 5000)
            setNotifCount((p) => p + 1)
            playSuccess()
          }
        } catch {}
      }

      ws.onclose = () => {
        if (!stopped && notifWsRef.current === ws) {
          reconnectTimer = setTimeout(connect, 5000)
        }
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      stopped = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (notifWsRef.current) {
        notifWsRef.current.onclose = null
        notifWsRef.current.close()
        notifWsRef.current = null
      }
    }
  }, [user])

  const openNotifs = () => {
    playClick()
    setShowNotifs((p) => !p)
    if (!showNotifs) {
      api.get('/auth/notifications/')
        .then((res) => setNotifications(res.data.results || res.data))
        .catch(() => {})
    }
  }

  const markRead = async (id) => {
    try {
      await api.post('/auth/notifications/' + id + '/read/')
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
      setNotifCount((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.post('/auth/notifications/read-all/')
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setNotifCount(0)
    } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col text-[var(--color-nike-white)]" style={{ backgroundColor: 'var(--color-nike-black)', color: 'var(--color-nike-white)' }}>
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5">
        <div
          className="h-full bg-gradient-to-r from-nike-red via-nike-amber to-nike-orange transition-all duration-100 ease-out"
          style={{ width: scrollProgress * 100 + '%' }}
        />
      </div>
      <nav className={'fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b ' + (isLight ? 'bg-white/95 border-nike-gray' : '')} style={!isLight ? { backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 95%, transparent)', borderColor: 'var(--color-nike-gray)' } : {}}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-nike-red rounded-full flex items-center justify-center font-black text-sm tracking-widest group-hover:scale-110 transition-transform">
                C
              </div>
              <span className={'font-black text-lg tracking-widest uppercase ' + (isLight ? 'text-nike-black' : '')} style={!isLight ? { color: 'var(--color-nike-white)' } : {}}>CombatHub</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {[
                { to: '/', label: 'Home' },
                ...(user ? [{ to: '/community', label: 'Community' }] : []),
                { to: '/about', label: 'About' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => playWhoosh()}
                  className={'relative text-sm tracking-widest uppercase font-medium px-4 py-2 rounded-full transition-all duration-300 group ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-black' : 'hover:bg-white/5')}
                  style={!isLight ? { color: 'var(--color-nike-light)' } : {}}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-nike-red rounded-full group-hover:w-1/2 transition-all duration-300" />
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <button
                      onClick={() => { playClick(); navigate('/messages') }}
                      className={'relative p-2 rounded-xl transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/5')}
                      style={{ color: 'var(--color-nike-light)' }}
                      title="Messages"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                  </div>
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => { playClick(); setShowNotifs((p) => !p); if (!showNotifs) { api.get('/auth/notifications/').then((res) => setNotifications(res.data.results || res.data)).catch(() => {}) } }}
                      className={'relative p-2 rounded-xl transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/5')}
                      style={{ color: 'var(--color-nike-light)' }}
                      title="Notifications"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      {notifCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-nike-red rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-lg shadow-nike-red/50">
                          {notifCount > 9 ? '9+' : notifCount}
                        </span>
                      )}
                    </button>
                    {showNotifs && (
                      <div className={'absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-xl overflow-hidden z-50 ' + (isLight ? 'bg-white border-nike-gray shadow-lg' : '')} style={!isLight ? { backgroundColor: 'var(--color-nike-dark)', borderColor: 'var(--color-nike-gray)' } : {}}>
                        <div className={'max-h-80 overflow-y-auto ' + (isLight ? '' : '')}>
                          {notifications.length === 0 ? (
                            <div className={'px-5 py-6 text-center text-xs ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                              <div className="text-2xl mb-1">🔔</div>
                              No notifications yet
                            </div>
                          ) : (
                            <>
                              {notifications.slice(0, 8).map((n) => (
                                <button
                                  key={n.id}
                                  onClick={() => { api.post('/auth/notifications/' + n.id + '/read/').catch(() => {}); setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x)); setNotifCount((prev) => Math.max(0, prev - 1)) }}
                                  className={'w-full text-left px-5 py-3 flex items-start gap-3 text-xs transition-colors ' + (n.read
                                    ? (isLight ? 'text-nike-light' : 'text-white/30')
                                    : (isLight ? 'text-nike-black bg-nike-red/5' : 'text-white bg-white/5')
                                  )}
                                >
                                  <span className="text-base shrink-0 mt-0.5">
                                    {n.notification_type === 'follow' ? '👊' : '🔔'}
                                  </span>
                                  <div className="min-w-0">
                                    <p className={n.read ? '' : 'font-bold'}>{n.message}</p>
                                    <p className={'mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/20')}>{new Date(n.created_at).toLocaleDateString()}</p>
                                  </div>
                                </button>
                              ))}
                              {notifications.length > 8 && (
                                <p className={'px-5 py-2 text-[10px] text-center ' + (isLight ? 'text-nike-light' : 'text-white/20')}>+{notifications.length - 8} more</p>
                              )}
                              {notifCount > 0 && (
                                <button
                                  onClick={() => { api.post('/auth/notifications/read-all/').then(() => { setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); setNotifCount(0) }).catch(() => {}) }}
                                  className={'w-full px-5 py-2.5 text-xs tracking-widest uppercase font-bold text-center transition-colors border-t ' + (isLight ? 'text-nike-red border-nike-gray hover:bg-nike-red/5' : 'text-nike-red border-white/5 hover:bg-nike-red/10')}
                                >
                                  Mark all as read
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((p) => !p)}
                    className="flex items-center gap-2.5 group cursor-pointer"
                  >
                    <div className={'w-8 h-8 rounded-full overflow-hidden ring-2 transition-all duration-300 relative ' + (notifCount > 0 ? 'shadow-lg shadow-nike-red/30 animate-pulse' : '')} style={{ ringColor: notifCount > 0 ? 'var(--color-nike-red)' : menuOpen ? 'var(--color-nike-red)' : 'var(--color-nike-gray)' }}>
                      {user.profile?.avatar ? (
                        <img src={mediaUrl(user.profile.avatar)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}>
                          {(user.username || user.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      {notifCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-nike-red rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-lg shadow-nike-red/50">
                          {notifCount > 9 ? '9+' : notifCount}
                        </div>
                      )}
                    </div>
                    <span className={'text-xs tracking-widest uppercase hidden sm:block transition-colors ' + (isLight ? 'text-nike-black' : '')} style={!isLight ? { color: menuOpen ? 'var(--color-nike-white)' : 'var(--color-nike-light)' } : {}}>{user.username || user.email}</span>
                  </button>

                  {menuOpen && (
                    <div className={'absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-xl overflow-hidden ' + (isLight ? 'bg-white border-nike-gray shadow-lg' : '')} style={!isLight ? { backgroundColor: 'var(--color-nike-dark)', borderColor: 'var(--color-nike-gray)' } : {}}>
                      <div className={'px-5 py-4 border-b ' + (isLight ? 'border-nike-gray' : '')} style={!isLight ? { borderColor: 'var(--color-nike-gray)' } : {}}>
                        <p className={'text-sm font-bold truncate ' + (isLight ? 'text-nike-black' : '')} style={!isLight ? { color: 'var(--color-nike-white)' } : {}}>{user.username || user.email}</p>
                        <p className={'text-xs mt-0.5 truncate ' + (isLight ? 'text-nike-light' : '')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>{user.email}</p>
                      </div>

                      {/* Notification bell */}
                      <div className="relative" ref={notifRef}>
                        <button
                          onClick={openNotifs}
                          className={'flex items-center gap-3 w-full px-5 py-3 text-sm transition-colors ' + (isLight ? 'text-nike-black hover:bg-nike-gray/30' : '')}
                          style={!isLight ? { color: 'var(--color-nike-light)' } : {}}
                        >
                          <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            {notifCount > 0 && <div className={'w-2 h-2 bg-nike-red rounded-full absolute -top-0.5 -right-0.5 ' + (showNotifs ? 'animate-ping' : '')} />}
                          </div>
                          Notifications
                          {notifCount > 0 && (
                            <span className="ml-auto bg-nike-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{notifCount}</span>
                          )}
                        </button>
                        {showNotifs && (
                          <div className={'border-t max-h-64 overflow-y-auto ' + (isLight ? 'border-nike-gray' : '')} style={!isLight ? { borderColor: 'var(--color-nike-gray)' } : {}}>
                            {notifications.length === 0 ? (
                              <div className={'px-5 py-6 text-center text-xs ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                                <div className="text-2xl mb-1">🔔</div>
                                No notifications yet
                              </div>
                            ) : (
                              <>
                                {notifications.slice(0, 8).map((n) => (
                                  <button
                                    key={n.id}
                                    onClick={() => markRead(n.id)}
                                    className={'w-full text-left px-5 py-3 flex items-start gap-3 text-xs transition-colors ' + (n.read
                                      ? (isLight ? 'text-nike-light' : 'text-white/30')
                                      : (isLight ? 'text-nike-black bg-nike-red/5' : 'text-white bg-white/5')
                                    )}
                                  >
                                    <span className="text-base shrink-0 mt-0.5">
                                      {n.notification_type === 'follow' ? '👊' : '🔔'}
                                    </span>
                                    <div className="min-w-0">
                                      <p className={n.read ? '' : 'font-bold'}>{n.message}</p>
                                      <p className={'mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/20')}>{new Date(n.created_at).toLocaleDateString()}</p>
                                    </div>
                                  </button>
                                ))}
                                {notifications.length > 8 && (
                                  <p className={'px-5 py-2 text-[10px] text-center ' + (isLight ? 'text-nike-light' : 'text-white/20')}>+{notifications.length - 8} more</p>
                                )}
                                {notifCount > 0 && (
                                  <button
                                    onClick={markAllRead}
                                    className={'w-full px-5 py-2.5 text-xs tracking-widest uppercase font-bold text-center transition-colors border-t ' + (isLight ? 'text-nike-red border-nike-gray hover:bg-nike-red/5' : 'text-nike-red border-white/5 hover:bg-nike-red/10')}
                                  >
                                    Mark all as read
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <Link
                        to="/messages"
                        onClick={() => setMenuOpen(false)}
                        className={'flex items-center gap-3 px-5 py-3 text-sm transition-colors ' + (isLight ? 'text-nike-black hover:bg-nike-gray/30' : '')}
                        style={!isLight ? { color: 'var(--color-nike-light)' } : {}}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Messages
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className={'flex items-center gap-3 px-5 py-3 text-sm transition-colors ' + (isLight ? 'text-nike-black hover:bg-nike-gray/30' : '')}
                        style={!isLight ? { color: 'var(--color-nike-light)' } : {}}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        View Profile
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setMenuOpen(false)}
                        className={'flex items-center gap-3 px-5 py-3 text-sm transition-colors ' + (isLight ? 'text-nike-black hover:bg-nike-gray/30' : '')}
                        style={!isLight ? { color: 'var(--color-nike-light)' } : {}}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                        Settings
                      </Link>

                      <div className={'px-5 py-3 border-t flex items-center gap-3 text-xs ' + (isLight ? 'border-nike-gray text-nike-light' : '')} style={!isLight ? { borderColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' } : {}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        v{appVersion}
                      </div>

                      <div className={'border-t ' + (isLight ? 'border-nike-gray' : '')} style={!isLight ? { borderColor: 'var(--color-nike-gray)' } : {}}>
                        <button
                          onClick={() => { setMenuOpen(false); logout() }}
                          className="flex items-center gap-3 w-full px-5 py-3 text-sm text-nike-red transition-colors hover:bg-nike-red/10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => { playClick(); navigate('/login') }} className="text-xs tracking-widest uppercase font-medium px-4 py-2 rounded-full transition-all duration-300" style={{ color: 'var(--color-nike-light)' }}>
                    Login
                  </button>
                  <button onClick={() => { playClick(); navigate('/register') }} className="text-xs tracking-widest uppercase font-bold bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-2 rounded-full transition-all duration-300">
                    Join Free
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <footer className={'border-t py-4 ' + (isLight ? 'bg-white border-nike-gray' : '')} style={!isLight ? { backgroundColor: 'var(--color-nike-dark)', borderColor: 'var(--color-nike-gray)' } : {}}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>
          <div className={'flex items-center gap-1 ' + (isLight ? 'text-nike-light' : '')}>
            <span>© 2026 CombatHub</span>
            <span className="hidden sm:inline">— Made by Millo</span>
          </div>
          <div className={'flex items-center gap-4 ' + (isLight ? 'text-nike-light' : '')}>
            <Link to="/about" className={'transition-colors ' + (isLight ? 'hover:text-nike-black' : 'hover:text-white')}>About</Link>
            <Link to="/about" className={'transition-colors ' + (isLight ? 'hover:text-nike-black' : 'hover:text-white')}>Privacy</Link>
            <Link to="/about" className={'transition-colors ' + (isLight ? 'hover:text-nike-black' : 'hover:text-white')}>Terms</Link>
          </div>
        </div>
      </footer>
      <ToastContainer />
    </div>
  )
}
