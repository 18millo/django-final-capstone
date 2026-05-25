import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import useScrollProgress from '../hooks/useScrollProgress'
import { mediaUrl } from '../utils/media'
import { playWhoosh, playClick, playSuccess } from '../utils/sounds'
import ToastContainer, { toast } from '../components/ui/Toast'
import PremiumBadge from '../components/ui/PremiumBadge'
import api, { getToken } from '../utils/api'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const SHOP_URL = import.meta.env.VITE_SHOP_URL || 'http://localhost:5174'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, appVersion } = useTheme()
  const isLight = theme === 'light'
  const navigate = useNavigate()
  const location = useLocation()
  const scrollProgress = useScrollProgress()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const notifWsRef = useRef(null)
  const [msgUnreadCount, setMsgUnreadCount] = useState(0)

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
    if (!user) return
    let stopped = false
    const pollRef = { interval: 15000, timer: null }
    const schedulePoll = () => {
      if (stopped) return
      pollRef.timer = setTimeout(() => {
        if (stopped) return
        api.get('/auth/notifications/unread-count/')
          .then((res) => setNotifCount(res.data.count))
          .catch((err) => {
            if (err.response?.status === 429) pollRef.interval = Math.min(pollRef.interval * 1.5, 60000)
          })
        api.get('/auth/conversations/')
          .then((res) => {
            const total = (res.data || []).reduce((sum, c) => sum + (c.unread || 0), 0)
            setMsgUnreadCount(total)
          })
          .catch((err) => {
            if (err.response?.status === 429) pollRef.interval = Math.min(pollRef.interval * 1.5, 60000)
          })
        schedulePoll()
      }, pollRef.interval)
    }
    schedulePoll()
    return () => { stopped = true; if (pollRef.timer) clearTimeout(pollRef.timer) }
  }, [user])

  useEffect(() => {
    if (!user) return

    let reconnectTimer = null
    let stopped = false
    let wsRetries = 0

    const connect = () => {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token')
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
        if (!stopped && notifWsRef.current === ws && wsRetries < 5) {
          wsRetries++
          reconnectTimer = setTimeout(connect, Math.min(5000 * wsRetries, 30000))
        }
      }

      ws.onerror = () => { ws.close() }
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
        try { notifWsRef.current.close() } catch {}
        notifWsRef.current = null
      }
    }
  }, [user])

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
                  {[
                    { to: '/', label: 'Home' },
                    { to: '/events', label: 'Events' },
                    ...(user?.role !== 'vendor' ? [{ to: '/community', label: 'Community' }] : []),
                    ...(user?.role !== 'vendor' ? [{ to: '/forum', label: 'Forum' }] : []),
                    { to: user.role === 'coach' ? '/coach' : user.role === 'gym_owner' ? '/gym-dashboard' : '/vendor', label: 'Dashboard' },
                    { to: '/gallery', label: 'Gallery' },
                    { to: '/about', label: 'About' },
                  ].map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => playWhoosh()} className={'relative text-sm tracking-widest uppercase font-medium px-3 xl:px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 group ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-black' : 'hover:bg-white/10')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-nike-red rounded-full group-hover:w-1/2 transition-all duration-300" />
                  </Link>
                ))}
                <a
                  href={`${SHOP_URL}?token=${getToken('access_token') || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playWhoosh()}
                  className={'relative text-sm tracking-widest uppercase font-medium px-3 xl:px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 group ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-black' : 'hover:bg-white/10')}
                  style={!isLight ? { color: 'var(--color-nike-light)' } : {}}
                >
                  Shop
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-nike-red rounded-full group-hover:w-1/2 transition-all duration-300" />
                </a>
              </>
            ) : (
              <>
                {[
                  { to: '/', label: 'Home' },
                  { to: '/events', label: 'Events' },
                  ...(user ? [{ to: '/community', label: 'Community' }] : []),
                  ...(user ? [{ to: '/forum', label: 'Forum' }] : []),
                  { to: '/gallery', label: 'Gallery' },
                  { to: '/about', label: 'About' },
                ].map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => playWhoosh()} className={'relative text-sm tracking-widest uppercase font-medium px-3 xl:px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 group ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-black' : 'hover:bg-white/10')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-nike-red rounded-full group-hover:w-1/2 transition-all duration-300" />
                  </Link>
                ))}
                <a
                  href={`${SHOP_URL}?token=${getToken('access_token') || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playWhoosh()}
                  className={'relative text-sm tracking-widest uppercase font-medium px-3 xl:px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 group ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-black' : 'hover:bg-white/10')}
                  style={!isLight ? { color: 'var(--color-nike-light)' } : {}}
                >
                  Shop
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-nike-red rounded-full group-hover:w-1/2 transition-all duration-300" />
                </a>
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
                {user?.role !== 'vendor' && (
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
                )}

                <button
                  onClick={() => { playClick(); navigate('/settings') }}
                  className={'relative p-2 rounded-xl transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}
                  style={{ color: 'var(--color-nike-light)' }}
                  title="Settings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
                <div className="relative">
                  <button
                    onClick={() => { playClick(); navigate('/profile') }}
                    className="flex items-center gap-2 cursor-pointer pl-1"
                  >
                    <div className={'w-8 h-8 rounded-full overflow-hidden ring-2 relative ' + (notifCount > 0 ? 'ring-nike-red shadow-lg shadow-nike-red/30 animate-pulse' : (isLight ? 'ring-nike-gray' : 'ring-white/20'))}>
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
              { to: '/events', label: 'Events', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
              ...(user?.role !== 'vendor' ? [{ to: '/community', label: 'Community', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' }] : []),

              ...(user?.role !== 'vendor' ? [{ to: '/forum', label: 'Forum', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' }] : []),
              { to: '/gallery', label: 'Gallery', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },

              ...(['vendor', 'coach', 'gym_owner'].includes(user.role) ? [{
                to: user.role === 'coach' ? '/coach' : user.role === 'gym_owner' ? '/gym-dashboard' : '/vendor',
                label: 'Dashboard',
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
              }] : []),
              ...(['coach', 'gym_owner'].includes(user.role) ? [{ to: '/my-events', label: 'My Events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }] : []),
              { to: '/about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { to: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
            ] : [
              { to: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { to: '/events', label: 'Events', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
              { to: '/about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
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
            <a
              href={`${SHOP_URL}?token=${getToken('access_token') || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { playWhoosh(); setMobileOpen(false) }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm tracking-widest uppercase font-bold transition-all duration-200 hover:bg-white/5"
              style={{ color: 'var(--color-nike-light)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              Shop
            </a>
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
                <a href={`${SHOP_URL}?token=${getToken('access_token') || ''}`} target="_blank" rel="noopener noreferrer" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Shop</a>
                {user?.role !== 'vendor' && <Link to="/forum" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Forum</Link>}
                <Link to="/gallery" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Gallery</Link>
                {user?.role !== 'vendor' && <Link to="/community" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Community</Link>}
              </div>
            </div>
            <div>
              <h4 className={'text-[10px] tracking-widest uppercase font-bold mb-3 ' + (isLight ? 'text-nike-light' : '')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Support</h4>
              <div className="space-y-2">
                <Link to="/about" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>About</Link>
                <Link to="/help" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Help Center</Link>
                <Link to="/contact" className={'block text-xs transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'hover:text-white')} style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>Contact Us</Link>
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
      <ToastContainer />
    </div>
  )
}
