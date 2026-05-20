import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import { useCart } from '../providers/CartProvider'
import useScrollProgress from '../hooks/useScrollProgress'
import { mediaUrl } from '../utils/media'
import { playWhoosh, playClick, playSuccess } from '../utils/sounds'
import { isAmbientEnabled, toggleAmbient as toggleAmbientSound, playAmbient, stopAmbient } from '../utils/sounds'
import ToastContainer, { toast } from '../components/ui/Toast'
import PremiumBadge from '../components/ui/PremiumBadge'
import api from '../utils/api'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, appVersion } = useTheme()
  const { itemCount } = useCart()
  const isLight = theme === 'light'
  const navigate = useNavigate()
  const location = useLocation()
  const scrollProgress = useScrollProgress()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)
  const [notifCount, setNotifCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef(null)
  const notifWsRef = useRef(null)
  const [msgUnreadCount, setMsgUnreadCount] = useState(0)
  const [soundOn, setSoundOn] = useState(isAmbientEnabled())

  useEffect(() => {
    if (isAmbientEnabled()) playAmbient()
    return () => stopAmbient()
  }, [])

  const toggleSound = () => {
    const on = toggleAmbientSound()
    setSoundOn(on)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const handler = () => {
      setMsgUnreadCount(0)
      setNotifications((prev) => prev.filter((n) => typeof n.id !== 'string' || (!n.id.startsWith('msg_') && !n.id.startsWith('follow_'))))
    }
    window.addEventListener('chat-opened', handler)
    return () => window.removeEventListener('chat-opened', handler)
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
    let stopped = false
    const fetchNotifs = () => {
      if (stopped) return
      api.get('/auth/notifications/unread-count/')
        .then((res) => setNotifCount(res.data.count))
        .catch(() => {})
    }
    const fetchMsgs = () => {
      if (stopped) return
      api.get('/auth/conversations/')
        .then((res) => {
          const total = (res.data || []).reduce((sum, c) => sum + (c.unread || 0), 0)
          setMsgUnreadCount(total)
        })
        .catch(() => {})
    }
    fetchNotifs()
    fetchMsgs()
    const interval = setInterval(() => { fetchNotifs(); fetchMsgs() }, 5000)
    return () => { stopped = true; clearInterval(interval) }
  }, [user])

  useEffect(() => {
    if (!user) return

    let reconnectTimer = null
    let stopped = false

    const connect = () => {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${encodeURIComponent(token)}`)
      notifWsRef.current = ws

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'pong') return
          if (data.type === 'notify_message') {
            toast(`💬 ${data.sender_name}: ${data.content}`, 'info', 5000)
            setNotifCount((p) => p + 1)
            setMsgUnreadCount((p) => p + 1)
            setNotifications((prev) => [
              { id: 'msg_' + Date.now(), notification_type: 'message', message: `💬 ${data.sender_name}: ${data.content}`, read: false, created_at: new Date().toISOString() },
              ...prev,
            ])
            window.dispatchEvent(new CustomEvent('new-message', { detail: { sender: data.sender, sender_name: data.sender_name, content: data.content, created_at: data.created_at } }))
            playSuccess()
          } else if (data.type === 'notify_follow') {
            toast(`👊 ${data.actor_name} started following you!`, 'success', 5000)
            setNotifCount((p) => p + 1)
            setNotifications((prev) => [
              { id: 'follow_' + Date.now(), notification_type: 'follow', message: `👊 ${data.actor_name} started following you.`, read: false, created_at: new Date().toISOString() },
              ...prev,
            ])
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

    const pingInterval = setInterval(() => {
      if (notifWsRef.current?.readyState === WebSocket.OPEN) {
        notifWsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    return () => {
      stopped = true
      clearInterval(pingInterval)
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
        .then((res) => {
          const serverNotifs = res.data.results || res.data
          setNotifications((prev) => {
            const wsNotifs = prev.filter((n) => typeof n.id === 'string' && (n.id.startsWith('msg_') || n.id.startsWith('follow_')))
            const ids = new Set(wsNotifs.map((n) => n.id))
            const merged = [...wsNotifs, ...serverNotifs.filter((n) => !ids.has('msg_' + n.id) && !ids.has('follow_' + n.id))]
            return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          })
          api.post('/auth/notifications/read-all/').then(() => {
            setNotifCount(0)
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }).catch(() => {})
        })
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
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-0.5">
        <div
          className="h-full bg-gradient-to-r from-nike-red via-nike-amber to-nike-orange transition-all duration-100 ease-out"
          style={{ width: scrollProgress * 100 + '%' }}
        />
      </div>

      {/* Floating navbar */}
      <nav
        className={
          'fixed top-3 z-50 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] md:w-[calc(100vw-4rem)] lg:w-full max-w-7xl border shadow-2xl rounded-2xl transition-all duration-300 liquid-glass ' +
          (scrollProgress > 0.02 ? (isLight ? 'shadow-lg' : 'shadow-2xl') : 'shadow-xl')
        }
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-8 h-8 bg-nike-red rounded-full flex items-center justify-center font-black text-sm tracking-widest group-hover:scale-110 transition-transform">
              C
            </div>
            <span className={'font-black text-lg tracking-widest uppercase hidden sm:block ' + (isLight ? 'text-nike-black' : '')} style={!isLight ? { color: 'var(--color-nike-white)' } : {}}>CombatHub</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 justify-center mx-4">
            {['vendor', 'coach', 'gym_owner'].includes(user?.role) ? (
              <>
                {[{ to: '/', label: 'Home' }, { to: user.role === 'coach' ? '/coach' : user.role === 'gym_owner' ? '/gym-dashboard' : '/vendor', label: 'Dashboard' }, { to: '/groups', label: 'Groups' }, { to: '/premium', label: 'Premium' }, ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : [])].map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => playWhoosh()} className={'relative text-sm tracking-widest uppercase font-medium px-3 xl:px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 group ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-black' : 'hover:bg-white/10')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-nike-red rounded-full group-hover:w-1/2 transition-all duration-300" />
                  </Link>
                ))}
              </>
            ) : (
              <>
                {[
                  { to: '/', label: 'Home' },
                  ...(user ? [{ to: '/community', label: 'Community' }] : []),
                  ...(user ? [{ to: '/groups', label: 'Groups' }] : []),
                  ...(user ? [{ to: '/forum', label: 'Forum' }] : []),
                  ...(user ? [{ to: '/gallery', label: 'Gallery' }] : []),
                  { to: '/shop', label: 'Shop' },
                  ...(user?.role === 'coach' ? [{ to: '/coach', label: 'Coach' }] : []),
                  { to: '/about', label: 'About' },
                  { to: '/premium', label: 'Premium' },
                ].map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => playWhoosh()} className={'relative text-sm tracking-widest uppercase font-medium px-3 xl:px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 group ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-black' : 'hover:bg-white/10')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-nike-red rounded-full group-hover:w-1/2 transition-all duration-300" />
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Hamburger - mobile only */}
            <button
              onClick={() => { playClick(); setMobileOpen(!mobileOpen) }}
              className={'lg:hidden relative p-2 rounded-xl transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}
              style={{ color: 'var(--color-nike-light)' }}
              title="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                {mobileOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className={'relative p-2 rounded-xl transition-all duration-200 hidden sm:flex ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}
              style={{ color: soundOn ? 'var(--color-nike-red)' : 'var(--color-nike-light)' }}
              title={soundOn ? 'Sound on' : 'Sound off'}
            >
              {soundOn ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              )}
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => { playClick(); toggleTheme() }}
              className={'relative p-2 rounded-xl transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}
              style={{ color: 'var(--color-nike-light)' }}
              title={isLight ? 'Dark mode' : 'Light mode'}
            >
              {isLight ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>

            {user ? (
              <>
                <button
                  onClick={() => { playClick(); navigate('/messages') }}
                  className={'relative p-2 rounded-xl transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}
                  style={{ color: 'var(--color-nike-light)' }}
                  title="Messages"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  {msgUnreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-nike-red rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-lg shadow-nike-red/50">{msgUnreadCount}</span>
                  )}
                </button>
                {user?.role === 'athlete' && (
                <button
                  onClick={() => { playClick(); navigate('/cart') }}
                  className={'relative p-2 rounded-xl transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}
                  style={{ color: 'var(--color-nike-light)' }}
                  title="Cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-nike-red rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-lg shadow-nike-red/50">{itemCount > 9 ? '9+' : itemCount}</span>
                  )}
                </button>
                )}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { playClick(); setShowNotifs((p) => !p); if (!showNotifs) { api.get('/auth/notifications/').then((res) => setNotifications(res.data.results || res.data)).catch(() => {}) } }}
                    className={'relative p-2 rounded-xl transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}
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
                    <div className={'absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-xl overflow-hidden z-50 liquid-glass '}>
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
                                onClick={() => { setMsgUnreadCount(0); api.post('/auth/notifications/read-all/').then(() => { setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); setNotifCount(0) }).catch(() => {}) }}
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
                    className="flex items-center gap-2 group cursor-pointer pl-1"
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
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[18px] h-[18px] bg-nike-red rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg shadow-nike-red/50 ring-[2px] ring-[var(--color-nike-dark)]">
                          {notifCount > 9 ? '9+' : notifCount}
                        </div>
                      )}
                    </div>
                    {user?.profile?.is_premium && (
                      <PremiumBadge size={12} animate={false} />
                    )}
                  </button>

                  {menuOpen && (
                    <div className={'absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-xl overflow-hidden liquid-glass '}>
                      <div className={'px-5 py-4 border-b ' + (isLight ? 'border-nike-gray' : '')} style={!isLight ? { borderBottomColor: 'rgba(255,255,255,0.05)' } : {}}>
                        <p className={'text-sm font-bold truncate flex items-center gap-1.5 ' + (isLight ? 'text-nike-black' : '')} style={!isLight ? { color: 'var(--color-nike-white)' } : {}}>{user.username || user.email}{user?.profile?.is_premium && <PremiumBadge size={12} animate={false} />}</p>
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
                          <div className={'border-t max-h-64 overflow-y-auto ' + (isLight ? 'border-nike-gray' : '')} style={!isLight ? { borderTopColor: 'rgba(255,255,255,0.05)' } : {}}>
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
                                    {n.notification_type === 'follow' ? '👊' : n.notification_type === 'message' ? '💬' : '🔔'}
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
 className={'w-full px-5 py-2.5 text-xs tracking-widest uppercase font-bold text-center transition-colors border-t ' + (isLight ? 'text-nike-red border-nike-gray hover:bg-nike-red/5' : 'text-nike-red hover:bg-nike-red/10')} style={!isLight ? { borderTopColor: 'rgba(255,255,255,0.05)' } : {}}
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
                        to="/shop"
                        onClick={() => setMenuOpen(false)}
                        className={'flex items-center gap-3 px-5 py-3 text-sm transition-colors ' + (isLight ? 'text-nike-black hover:bg-nike-gray/30' : '')}
                        style={!isLight ? { color: 'var(--color-nike-light)' } : {}}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        Shop
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setMenuOpen(false)}
                        className={'flex items-center gap-3 px-5 py-3 text-sm transition-colors ' + (isLight ? 'text-nike-black hover:bg-nike-gray/30' : '')}
                        style={!isLight ? { color: 'var(--color-nike-light)' } : {}}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        Orders
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

                      <div className={'px-5 py-3 border-t flex items-center gap-3 text-xs ' + (isLight ? 'border-nike-gray text-nike-light' : '')} style={!isLight ? { borderColor: 'rgba(255,255,255,0.08)', color: 'var(--color-nike-light)' } : {}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        v{appVersion}
                      </div>

                      <div className={'border-t ' + (isLight ? 'border-nike-gray' : '')} style={!isLight ? { borderColor: 'rgba(255,255,255,0.08)' } : {}}>
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
              </>
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
      </nav>

      {/* Mobile drawer */}
      <div className={'fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ' + (mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}>
        <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
        <div className={'absolute top-20 left-0 w-72 h-[calc(100vh-5rem)] overflow-y-auto border-r transition-transform duration-300 rounded-r-2xl liquid-glass ' + (mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
          <div className="p-4 space-y-1">
            {(user ? [
              { to: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { to: '/community', label: 'Community', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
              { to: '/groups', label: 'Groups', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM6 10h.01M18 10h.01' },
              { to: '/forum', label: 'Forum', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
              { to: '/gallery', label: 'Gallery', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { to: '/shop', label: 'Shop', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
              { to: '/messages', label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
              ...(['vendor', 'coach', 'gym_owner'].includes(user.role) ? [{
                to: user.role === 'coach' ? '/coach' : user.role === 'gym_owner' ? '/gym-dashboard' : '/vendor',
                label: 'Dashboard',
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
              }] : []),
              { to: '/about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { to: '/premium', label: 'Premium', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
              { to: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
            ] : [
              { to: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { to: '/shop', label: 'Shop', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
              { to: '/about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { to: '/premium', label: 'Premium', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
            ]).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => { playWhoosh(); setMobileOpen(false) }}
                className={'flex items-center gap-3 px-4 py-3 rounded-xl text-sm tracking-widest uppercase font-bold transition-all duration-200 ' + (location.pathname === link.to ? 'bg-nike-red text-white' : 'hover:bg-white/5')}
                style={location.pathname !== link.to ? { color: 'var(--color-nike-light)' } : {}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d={link.icon} /></svg>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!location.pathname.startsWith('/messages') && (
      <footer className={'border-t ' + (isLight ? 'bg-white border-nike-gray' : '')} style={!isLight ? { backgroundColor: 'var(--color-nike-dark)', borderColor: 'var(--color-nike-gray)' } : {}}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-sm font-black tracking-tight mb-3" style={!isLight ? { color: 'var(--color-nike-white)' } : {}}>COMBATHUB</h3>
              <p className={'text-xs leading-relaxed ' + (isLight ? 'text-nike-light' : '')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>The complete combat sports ecosystem. Premium gear, elite coaches, world-class gyms, and a thriving community — one platform.</p>
            </div>
            <div>
              <h4 className={'text-[10px] tracking-widest uppercase font-bold mb-3 ' + (isLight ? 'text-nike-light' : '')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Platform</h4>
              <div className="space-y-2">
                <Link to="/shop" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Shop</Link>
                <Link to="/forum" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Forum</Link>
                <Link to="/gallery" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Gallery</Link>
                <Link to="/community" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Community</Link>
              </div>
            </div>
            <div>
              <h4 className={'text-[10px] tracking-widest uppercase font-bold mb-3 ' + (isLight ? 'text-nike-light' : '')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Support</h4>
              <div className="space-y-2">
                <Link to="/about" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>About</Link>
                <Link to="/guidelines" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Guidelines</Link>
                <Link to="/terms" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Terms</Link>
              </div>
            </div>
            <div>
              <h4 className={'text-[10px] tracking-widest uppercase font-bold mb-3 ' + (isLight ? 'text-nike-light' : '')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Connect</h4>
              <div className="space-y-2">
                <Link to="/newsletter" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Newsletter</Link>
                <a href="#" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Instagram</a>
                <a href="#" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>X / Twitter</a>
                <a href="#" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>YouTube</a>
              </div>
            </div>
          </div>
          <div className={'border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs ' + (isLight ? 'border-nike-gray text-nike-light' : '')} style={!isLight ? { borderColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' } : {}}>
            <div className="flex items-center gap-1">
              <span>© 2026 CombatHub</span>
              <span className="hidden sm:inline">— Made by Millo. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/terms" className={'transition-colors ' + (isLight ? 'hover:text-nike-black' : 'hover:text-white')}>Terms</Link>
              <Link to="/guidelines" className={'transition-colors ' + (isLight ? 'hover:text-nike-black' : 'hover:text-white')}>Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
      )}
      <ToastContainer />
    </div>
  )
}
