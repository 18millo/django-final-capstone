import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useTheme } from '../providers/ThemeProvider'
import { useAuth } from '../providers/AuthProvider'
import LoadingScreen from '../components/LoadingScreen'
import logo from '../images/logo.svg'
import { IconPackage } from '../components/Icons'

const getSportIcon = (sport) => {
  switch(sport) {
    case 'boxing':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    case 'bjj':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="9" r="4"/><path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
    case 'muay-thai':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8 2 4 6 4 10c0 3.5 2 6.5 4 8l4 4 4-4c2-1.5 4-4.5 4-8 0-4-4-8-8-8z"/></svg>
    case 'mma':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>
    case 'fitness':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5 17.5 17.5"/><path d="M17.5 6.5 6.5 17.5"/><circle cx="12" cy="12" r="10"/></svg>
    default:
      return null
  }
}

const videoGlob = import.meta.glob('/videos/*.{mp4,webm,mov,avi,mkv}', { eager: true, query: '?url' })
const videos = Object.values(videoGlob).map((m) => m.default)

function AutoScrollCarousel({ products }) {
  const [index, setIndex] = useState(0)
  const intervalRef = useRef(null)
  const [paused, setPaused] = useState(false)

  const start = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % products.length)
    }, 3500)
  }, [products.length])

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (!paused && products.length > 1) start()
    return stop
  }, [paused, products.length, start, stop])

  if (!products.length) return null

  const p = products[index]
  if (!p) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => { setPaused(true); stop() }}
      onMouseLeave={() => { setPaused(false) }}
    >
      <Link
        to="/shop"
        className="group block relative aspect-video md:aspect-[21/9] overflow-hidden border-y border-zinc-800 hover:border-nike-red/30 transition-all duration-500"
      >
        {p.images?.[0] ? (
          <img src={p.images[0]} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-zinc-700"><IconPackage size={48} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 max-w-7xl mx-auto px-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{p.brand || 'Combat Shop'}</p>
          <h3 className="text-xl md:text-3xl font-black text-white mt-1">{p.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            {p.discount_active ? (
              <><span className="text-lg font-black text-nike-red">${parseFloat(p.effective_price || p.price).toFixed(2)}</span><span className="text-sm line-through text-zinc-500">${parseFloat(p.price).toFixed(2)}</span></>
            ) : (
              <span className="text-lg font-black text-white">${parseFloat(p.price).toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Dots */}
      {products.length > 1 && (
        <div className="flex justify-center gap-2 mt-4 max-w-7xl mx-auto px-4">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === index ? 'bg-nike-red w-6' : 'bg-zinc-600 hover:bg-zinc-400'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickVideos(count) {
  if (!videos.length) return []
  return shuffle(videos).slice(0, Math.min(count, videos.length))
}

const initialVideos = pickVideos(2)
const adVideos = pickVideos(3)

export default function Landing() {
  const { theme, toggleTheme } = useTheme()
  const { user, loading } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)
  const [heroVideo, statsVideo] = initialVideos
  const videoRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.get('/products/').then(({ data }) => setProducts(data.results || data)),
      api.get('/categories/').then(({ data }) => setCategories(data.results || data)),
    ]).catch(() => {})
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.volume = 0.15
  }, [heroVideo])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.animate-reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [products, categories])

  const sports = [...new Set(categories.map((c) => c.sport_tag).filter(Boolean))]
  const justIn = products.slice(0, 8)

  return (
    <div style={{ background: 'var(--theme-bg)' }}>
      {loading && <LoadingScreen text="Signing you in" />}

      {/* ═══ NAVBAR ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 liquid-glass" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="Combat Shop" className="h-6 group-hover:opacity-80 transition-opacity" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/" className="text-xs font-bold uppercase tracking-wider transition-all duration-300" style={{ color: 'var(--theme-text)' }}>
              Home
            </Link>
            <Link to="/shop" className="text-xs font-bold uppercase tracking-wider transition-all duration-300" style={{ color: 'var(--theme-text-secondary)' }}>
              Shop
            </Link>
            <Link to="/shop/categories" className="text-xs font-bold uppercase tracking-wider transition-all duration-300" style={{ color: 'var(--theme-text-secondary)' }}>
              Categories
            </Link>
            <Link to="/shop/contact" className="text-xs font-bold uppercase tracking-wider transition-all duration-300" style={{ color: 'var(--theme-text-secondary)' }}>
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button onClick={toggleTheme} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] transition-colors duration-300 p-2" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Auth */}
            {user && (
              <div className="hidden md:flex items-center gap-3 border-l pl-4" style={{ borderColor: 'var(--theme-border)' }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-nike-red/40" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-nike-red/20 flex items-center justify-center text-xs font-bold text-nike-red ring-2 ring-nike-red/40">
                    {(user.display_name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold" style={{ color: 'var(--theme-text)' }}>{user.display_name || user.email?.split('@')[0]}</span>
              </div>
            )}

            {/* Mobile toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2" style={{ color: 'var(--theme-text-secondary)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-4 space-y-3 animate-slideUp" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-secondary)' }}>
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm py-1 uppercase tracking-wider font-bold text-xs" style={{ color: 'var(--theme-text)' }}>
              Home
            </Link>
            <Link to="/shop" onClick={() => setMenuOpen(false)} className="block text-sm py-1 uppercase tracking-wider font-bold text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              Shop
            </Link>
            <Link to="/shop/categories" onClick={() => setMenuOpen(false)} className="block text-sm py-1 uppercase tracking-wider font-bold text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              Categories
            </Link>
            <Link to="/shop/contact" onClick={() => setMenuOpen(false)} className="block text-sm py-1 uppercase tracking-wider font-bold text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              Contact
            </Link>
            {user && (
              <div className="pt-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-nike-red/40" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-nike-red/20 flex items-center justify-center text-xs font-bold text-nike-red ring-2 ring-nike-red/40">
                    {(user.display_name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold" style={{ color: 'var(--theme-text)' }}>{user.display_name || user.email?.split('@')[0]}</span>
                <Link to={user.role === 'vendor' ? '/vendor/dashboard' : '/shop'} onClick={() => setMenuOpen(false)} className="text-xs text-nike-red uppercase tracking-wider font-bold">
                  {user.role === 'vendor' ? 'Dashboard' : 'Shop'}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <video
          ref={videoRef}
          autoPlay loop playsInline
          muted
          preload="auto"
          poster="https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover animate-slowZoom"
          style={{ objectFit: 'cover' }}
        >
          {heroVideo ? (
            <source src={heroVideo} type="video/mp4" />
          ) : (
            <>
              <source src="https://videos.pexels.com/video-files/5596327/5596327-uhd_2560_1440_24fps.mp4" type="video/mp4" />
              <source src="https://videos.pexels.com/video-files/5596327/5596327-hd_1920_1080_24fps.mp4" type="video/mp4" />
            </>
          )}
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(229,16,29,0.15) 0%, transparent 60%)' }} />

        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center">
          <div className="max-w-2xl animate-slideUp">
            <p className="text-nike-red text-sm font-bold tracking-[0.3em] uppercase mb-4">Combat Shop</p>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none text-white">
              Gear Up.
              <br />
              <span className="text-zinc-500">Fight Ready.</span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg mt-6 max-w-lg leading-relaxed">
              Premium combat sports equipment worn by champions. From gloves to gear — train like the best.
            </p>
            <div className="flex gap-3 mt-10">
              <Link to="/shop" className="inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-8 py-4 rounded-full text-sm font-bold tracking-wider transition-all duration-300">
                Shop Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link to="/shop/categories" className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 hover:bg-zinc-800/50 px-8 py-4 rounded-full text-sm font-bold tracking-wider transition-all duration-300">
                Explore Sports
              </Link>
            </div>
          </div>
        </div>

        {/* Mute toggle */}
        <button
          onClick={() => {
            const el = videoRef.current
            if (!el) return
            if (el.muted) {
              el.muted = false
              el.volume = 0.15
            } else {
              el.muted = true
            }
            setVideoMuted(el.muted)
          }}
          className="absolute bottom-8 right-8 z-10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all hover:scale-110"
          style={{
            background: 'rgba(0,0,0,0.5)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-secondary)',
          }}
          title={videoMuted ? 'Unmute video' : 'Mute video'}
        >
          {videoMuted ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-floatUp">
          <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-zinc-600 to-transparent" />
        </div>
      </section>

      {/* ═══ AUTO-SCROLLING PRODUCT CAROUSEL ═══ */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-10">
          <p className="text-nike-red text-xs font-bold tracking-[0.25em] uppercase mb-3">Just In</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Newest Gear</h2>
        </div>

        <AutoScrollCarousel products={justIn} />
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-12 animate-reveal">
          <p className="text-nike-red text-xs font-bold tracking-[0.25em] uppercase mb-3">Categories</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Shop by Sport</h2>
          <p className="text-sm mt-3 max-w-md mx-auto" style={{ color: 'var(--theme-text-secondary)' }}>Find gear for your discipline</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.filter((c) => c.sport_tag).slice(0, 6).map((cat, i) => (
            <Link
              key={cat.id}
              to={`/shop?sport=${cat.sport_tag}`}
              className="group relative aspect-square rounded-2xl overflow-hidden border hover:border-nike-red/30 transition-all duration-500 hover:scale-[1.02] animate-slideUp"
              style={{ borderColor: 'var(--theme-border)', animationDelay: `${i * 0.08}s` }}
            >
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(229,16,29,0.1) 0%, transparent 50%)' }} />
              <div className="relative h-full flex flex-col items-center justify-center p-4">
                <div className="mb-3">{getSportIcon(cat.sport_tag) || <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>}</div>
                <h3 className="text-sm font-bold text-center" style={{ color: 'var(--theme-text)' }}>{cat.name}</h3>
                <p className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: 'var(--theme-text-muted)' }}>{cat.sport_tag}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ WHY US ═══ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(229,16,29,0.05) 0%, transparent 60%)' }} />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 animate-reveal">
            <p className="text-nike-red text-xs font-bold tracking-[0.25em] uppercase mb-3">Why Combat Shop</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Built for Fighters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5 17.5 17.5"/><path d="M17.5 6.5 6.5 17.5"/><circle cx="12" cy="12" r="10"/></svg>, title: 'Premium Quality', desc: 'Gear tested by professional fighters and coaches.' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, title: 'Fast Shipping', desc: 'Free delivery on orders over $100. Track your package in real time.' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, title: '100% Authentic', desc: 'All products sourced directly from official brands and manufacturers.' },
            ].map((item, i) => (
              <div key={item.title} className="liquid-glass-card rounded-2xl p-8 text-center animate-slideUp" style={{ animationDelay: `${i * 0.1}s`, borderColor: 'var(--theme-border)' }}>
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>{item.title}</h3>
                <p className="text-sm mt-2" style={{ color: 'var(--theme-text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase mb-5 text-nike-red">Shop</h3>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                <li><Link to="/shop" className="hover:text-nike-red transition-colors">All Products</Link></li>
                <li><Link to="/shop?sport=boxing" className="hover:text-nike-red transition-colors">Boxing</Link></li>
                <li><Link to="/shop?sport=bjj" className="hover:text-nike-red transition-colors">BJJ</Link></li>
                <li><Link to="/shop?sport=muay-thai" className="hover:text-nike-red transition-colors">Muay Thai</Link></li>
                <li><Link to="/shop?sport=mma" className="hover:text-nike-red transition-colors">MMA</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase mb-5 text-nike-red">Support</h3>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                <li><span className="hover:text-nike-red transition-colors cursor-pointer">Contact</span></li>
                <li><span className="hover:text-nike-red transition-colors cursor-pointer">Shipping</span></li>
                <li><span className="hover:text-nike-red transition-colors cursor-pointer">Returns</span></li>
                <li><span className="hover:text-nike-red transition-colors cursor-pointer">FAQ</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase mb-5 text-nike-red">Company</h3>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                <li><span className="hover:text-nike-red transition-colors cursor-pointer">About</span></li>
                <li><span className="hover:text-nike-red transition-colors cursor-pointer">Careers</span></li>
                <li><span className="hover:text-nike-red transition-colors cursor-pointer">Press</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase mb-5 text-nike-red">Connect</h3>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                <li><span className="hover:text-nike-red transition-colors cursor-pointer">Instagram</span></li>
                <li><span className="hover:text-nike-red transition-colors cursor-pointer">YouTube</span></li>
                <li><span className="hover:text-nike-red transition-colors cursor-pointer">Twitter / X</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--theme-border)' }}>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>&copy; {new Date().getFullYear()} Combat Shop. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              <span className="hover:text-nike-red transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-nike-red transition-colors cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
