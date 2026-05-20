import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import Reveal from '../components/ui/Reveal'
import { useTheme } from '../providers/ThemeProvider'
import { useAuth } from '../providers/AuthProvider'
import api from '../utils/api'
import { mediaUrl } from '../utils/media'
import { playBell } from '../utils/sounds'
import { ROLE_ICONS, ROLE_LABELS, ROLE_COLORS } from '../utils/roles'
import { useGsapReveal, useCountUp, useGsapParallax } from '../hooks/useGsapReveal'

const IMAGES = {
  dark: {
    hero: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1920&q=80',
    gear: 'https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?auto=format&fit=crop&w=800&q=80',
    coach: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&w=800&q=80',
    gym: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=800&q=80',
    cta: 'https://images.unsplash.com/photo-1613567144281-5e8d8b5a2b6d?auto=format&fit=crop&w=1920&q=80',
    stats: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80',
  },
  light: {
    hero: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1920&q=80',
    gear: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    coach: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80',
    gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    cta: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=80',
    stats: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1920&q=80',
  },
}

const TESTIMONIALS = [
  { name: 'Alex "The Axe" M.', role: 'Pro MMA Fighter', quote: 'CombatHub changed how I prepare for fights. The gear quality is unmatched, and I found my coach here.', avatar: 'A' },
  { name: 'Sarah K.', role: 'BJJ Black Belt', quote: 'Booking gym sessions and coaching has never been easier. This is exactly what the combat sports community needed.', avatar: 'S' },
  { name: 'Marcus D.', role: 'Boxing Coach', quote: 'I\'ve built my entire online coaching business through this platform. The tools are incredible for trainers.', avatar: 'M' },
]

const BRANDS = ['Venum', 'Hayabusa', 'Everlast', 'Nike', 'Fairtex', 'Twins', 'Rival', 'Cleto Reyes']

const FEATURED_GEAR = [
  { id: 1, name: 'Pro Gloves', brand: 'Venum', price: 60, images: ['https://images.pexels.com/photos/4752858/pexels-photo-4752858.jpeg?auto=compress&cs=tinysrgb&w=600'], limited_edition: false },
  { id: 2, name: 'Thai Shorts', brand: 'Fairtex', price: 45, images: ['https://images.pexels.com/photos/6456142/pexels-photo-6456142.jpeg?auto=compress&cs=tinysrgb&w=600'], limited_edition: true },
  { id: 3, name: 'Speed Rope', brand: 'Everlast', price: 20, images: ['https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=600&q=80'], limited_edition: false },
  { id: 4, name: 'Mouthguard', brand: 'Nike', price: 15, images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80'], limited_edition: false },
]

function HomeMarketing() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const img = IMAGES[theme]
  const [featuredProducts, setFeaturedProducts] = useState([])
  const heroTextRef = useRef(null)
  const statsRef = useRef(null)
  const tiltRefs = useRef([])

  useEffect(() => {
    if (heroTextRef.current) {
      const words = heroTextRef.current.querySelectorAll('.hero-word')
      gsap.fromTo(words, { opacity: 0, y: 80, rotateX: -40 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' })
    }
  }, [])

  useEffect(() => {
    tiltRefs.current.forEach((el) => {
      if (!el) return
      const onMove = (e) => {
        const rect = el.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        gsap.to(el, { rotateY: x * 12, rotateX: -y * 8, duration: 0.4, ease: 'power2.out' })
      }
      const onLeave = () => {
        gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power2.out' })
      }
      el.addEventListener('mousemove', onMove)
      el.addEventListener('mouseleave', onLeave)
      return () => {
        el.removeEventListener('mousemove', onMove)
        el.removeEventListener('mouseleave', onLeave)
      }
    })
  }, [])

  useEffect(() => {
    api.get('/products/?limit=4').then((res) => {
      setFeaturedProducts(res.data.results || res.data || [])
    }).catch(() => {})
  }, [])

  return (
    <div>
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: 'url(' + img.hero + ')' }}
        />
        <div className={'absolute inset-0 ' + (isLight ? 'bg-white/80' : 'bg-gradient-to-r from-nike-black/95 via-nike-black/70 to-nike-black/40')} />
        {!isLight && <div className="absolute inset-0 bg-gradient-to-t from-nike-black via-transparent to-nike-black/20" />}
        <div className={'absolute top-20 right-[-10%] w-[60%] h-[80%] rounded-full blur-3xl ' + (isLight ? 'bg-gradient-to-bl from-nike-red/10 via-nike-amber/5 to-transparent' : 'bg-gradient-to-bl from-nike-red/15 via-nike-amber/5 to-transparent')} />
        <div className={'absolute bottom-20 left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl ' + (isLight ? 'bg-gradient-to-tr from-nike-orange/10 to-transparent' : 'bg-gradient-to-tr from-nike-orange/10 to-transparent')} />
        <div className="relative max-w-7xl mx-auto px-6 py-24 w-full">
          <Reveal className="max-w-3xl" gsap>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="bg-nike-red/20 backdrop-blur-sm text-nike-red text-xs tracking-widest uppercase font-bold px-4 py-2 rounded-full border border-nike-red/20">
                Now Live — Beta Access
              </span>
            </div>
            <h1 ref={heroTextRef} className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6 perspective-[800px]">
              <span className="hero-word inline-block">YOUR</span><br />
              <span className="hero-word inline-block text-transparent bg-clip-text bg-gradient-to-r from-nike-red via-nike-amber to-nike-orange">FIGHT</span><br />
              <span className="hero-word inline-block">STARTS</span>{' '}
              <span className="hero-word inline-block">HERE</span>
            </h1>
            <p className={'text-lg md:text-xl max-w-xl mb-10 leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
              Premium gear. Elite coaches. World-class gyms. The only ecosystem built for combat sports athletes.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/register"
                className="group relative inline-flex items-center gap-2 bg-nike-red text-white hover:bg-white hover:text-nike-black px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300"
              >
                Join the Movement
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/about"
                className={'inline-flex items-center gap-2 border px-8 py-4 rounded-full text-sm tracking-widest uppercase font-medium transition-all duration-300 ' + (isLight
                  ? 'border-nike-gray text-nike-light hover:border-nike-black hover:text-nike-black'
                  : 'border-white/20 text-white/60 hover:border-white/60 hover:text-white'
                )}
              >
                Learn More
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className={'w-6 h-10 border-2 rounded-full flex justify-center pt-2 ' + (isLight ? 'border-nike-gray' : 'border-white/20')}>
            <div className={'w-1 h-3 rounded-full ' + (isLight ? 'bg-nike-gray' : 'bg-white/40')} />
          </div>
        </div>
      </section>

      <section ref={statsRef} className="relative py-14 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: 'url(' + img.stats + ')' }}
        />
        <div className={'absolute inset-0 backdrop-blur-sm ' + (isLight ? 'bg-white/90' : 'bg-nike-black/90')} />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { id: 5000, label: 'Athletes' },
              { id: 500, label: 'Coaches' },
              { id: 200, label: 'Gyms' },
              { id: 10000, label: 'Products' },
            ].map((stat) => (
              <Reveal key={stat.label} delay={100} gsap>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-white">{stat.id.toLocaleString()}+</div>
                  <div className={'text-xs tracking-widest uppercase mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal gsap>
            <div className="text-center mb-12">
              <span className="text-nike-red text-xs tracking-widest uppercase font-bold">The Ecosystem</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-2">Everything. One Platform.</h2>
              <p className={'mt-3 max-w-xl mx-auto text-sm ' + (isLight ? 'text-nike-light' : 'text-white/40')}>From the gym to the octagon, we've got you covered at every step of your journey.</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Premium Gear',
                desc: "Shop the latest gloves, wraps, apparel, and equipment from the world's top brands.",
                image: img.gear,
                badge: 'bg-nike-red',
                icon: '⚡',
              },
              {
                title: 'Elite Coaches',
                desc: 'Connect with certified coaches across every discipline. Book sessions online or in-person.',
                image: img.coach,
                badge: 'bg-nike-amber',
                icon: '🔥',
              },
              {
                title: 'World-Class Gyms',
                desc: 'Discover the best combat sports gyms near you. Browse amenities, schedules, and membership options.',
                image: img.gym,
                badge: 'bg-nike-orange',
                icon: '💪',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 150} gsap>
                <div ref={(el) => (tiltRefs.current[i] = el)} className={'group relative rounded-2xl overflow-hidden transition-all duration-500 perspective-[1200px] liquid-glass-card ' + (isLight ? 'bg-nike-dark border-nike-gray shadow-sm hover:shadow-md border hover:border-nike-red/30' : 'bg-nike-dark border-white/5 hover:border-white/20 border')}>
                  <div className="h-40 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6">
                    <div className={'w-10 h-10 ' + item.badge + ' rounded-xl flex items-center justify-center text-lg mb-4'}>
                      {item.icon}
                    </div>
                    <h3 className={'text-lg font-bold mb-2 ' + (isLight ? 'text-nike-black' : 'text-white')}>{item.title}</h3>
                    <p className={'text-sm leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{item.desc}</p>
                    <div className={'mt-4 flex items-center gap-2 text-xs tracking-widest uppercase font-bold transition-colors ' + (isLight ? 'text-nike-light group-hover:text-nike-red' : 'text-white/20 group-hover:text-nike-red')}>
                      Explore <span>→</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={'py-16 md:py-20 ' + (isLight ? 'bg-white' : 'bg-nike-black')}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal gsap>
            <div className="text-center mb-10">
              <span className="text-nike-red text-xs tracking-widest uppercase font-bold">Testimonials</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-2">Trusted by Fighters</h2>
              <p className={'mt-2 max-w-xl mx-auto text-sm ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Hear from athletes and coaches who level up with CombatHub every day.</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 150} gsap>
                <div className={'relative p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] liquid-glass-card ' + (isLight
                  ? 'bg-white border-nike-gray shadow-sm'
                  : 'bg-nike-dark border-white/5'
                )}>
                  <div className={'text-3xl mb-3 ' + (isLight ? 'text-nike-red/20' : 'text-nike-red/20')}>❝</div>
                  <p className={'text-sm leading-relaxed mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/50')}>"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-nike-red/20 flex items-center justify-center text-sm font-bold text-nike-red">{t.avatar}</div>
                    <div>
                      <p className={'text-xs font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{t.name}</p>
                      <p className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Gear */}
      <section className={'py-16 md:py-20 border-t ' + (isLight ? 'bg-nike-gray/20 border-nike-gray' : 'bg-nike-dark/50 border-white/5')}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal gsap>
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-nike-red text-xs tracking-widest uppercase font-bold">Featured Gear</span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-1">Top Rated Equipment</h2>
              </div>
              <Link to="/shop" className={'hidden md:flex items-center gap-2 text-xs tracking-widest uppercase font-bold transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')}>
                View All <span>→</span>
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {featuredProducts.map((p, i) => (
              <Reveal key={p.id} delay={i * 100} gsap>
                <Link to={'/shop/' + p.id} className={'group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] liquid-glass-card ' + (isLight
                  ? 'bg-white border-nike-gray shadow-sm'
                  : 'bg-nike-dark border-white/5'
                )}>
                  <div className="aspect-[4/3] overflow-hidden bg-nike-gray/20">
                    <img src={p.images?.[0] || ''} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-3">
                    {p.limited_edition && (
                      <span className="inline-block bg-nike-red/10 text-nike-red text-[9px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full mb-1.5">Limited</span>
                    )}
                    <p className={'text-xs font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.name}</p>
                    <p className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{p.brand}</p>
                    <p className="text-sm font-black text-nike-red mt-1">${parseFloat(p.price).toFixed(2)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/shop" className="inline-flex items-center gap-2 bg-nike-red text-white hover:bg-white hover:text-nike-black px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
              View All Gear <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trusted Brands */}
      <section className={'py-10 border-t ' + (isLight ? 'border-nike-gray bg-white' : 'border-white/5 bg-nike-black')}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal gsap>
            <p className={'text-center text-[10px] tracking-widest uppercase font-bold mb-6 ' + (isLight ? 'text-nike-light' : 'text-white/20')}>Trusted by Leading Brands</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {BRANDS.map((brand) => (
                <span key={brand} className={'text-lg md:text-xl font-black tracking-tight transition-colors hover:text-nike-red ' + (isLight ? 'text-nike-gray/60' : 'text-white/10')}>
                  {brand}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className={'relative py-20 overflow-hidden border-t ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: 'url(' + img.cta + ')' }}
        />
        <div className={'absolute inset-0 ' + (isLight ? 'bg-white/80' : 'bg-gradient-to-r from-nike-black/95 via-nike-black/80 to-nike-black/70')} />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <Reveal>
            <span className="text-nike-red text-xs tracking-widest uppercase font-bold">Don't Wait</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mt-4 mb-6">
              READY TO<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-nike-red to-nike-amber">LEVEL UP</span>?
            </h2>
            <p className={'max-w-md mx-auto mb-10 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
              Join thousands of athletes, coaches, and gyms already on the platform. Free to start.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-10 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300"
            >
              Get Started Free
              <span>→</span>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

function HomeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { theme, appVersion } = useTheme()
  const isLight = theme === 'light'
  const p = user?.profile || {}
  const img = IMAGES[theme]
  const [bellRung, setBellRung] = useState(false)
  const [conversations, setConversations] = useState([])
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [postCount, setPostCount] = useState(0)
  const [premiumInfo, setPremiumInfo] = useState(null)
  const isVendor = user?.role === 'vendor'

  useEffect(() => {
    api.get('/auth/conversations/')
      .then((res) => setConversations((res.data || []).slice(0, 3)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/auth/posts/')
      .then((res) => {
        if (res.data.results) {
          const myPosts = res.data.results.filter((post) => post.author?.id === user?.id)
          setPostCount(myPosts.length)
        }
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    setLoadingProducts(true)
    const url = isVendor ? '/vendor/products/' : '/products/?limit=4'
    api.get(url)
      .then((res) => setProducts(res.data.results || res.data || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [isVendor])

  useEffect(() => {
    api.get('/auth/premium/check/')
      .then((res) => setPremiumInfo(res.data))
      .catch(() => {})
  }, [])

  
  useEffect(() => {
    if (!bellRung) {
      const t = setTimeout(() => { playBell(); setBellRung(true) }, 600)
      return () => clearTimeout(t)
    }
  }, [bellRung])

  const quickActions = [
    { to: '/profile', label: 'View Profile', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z' },
    { to: '/community', label: 'Community', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    { to: '/settings', label: 'Settings', icon: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
    { to: '/about', label: 'Explore', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
  ]

   const rc = ROLE_COLORS[user.role] || ROLE_COLORS.athlete

  const calcProfilePercent = (p) => {
    const fields = [
      p.bio, p.avatar, p.phone, p.weight_class,
      p.height_ft, p.height_in, p.reach_in, p.stance,
    ]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }

  const calcDaysActive = (createdAt) => {
    if (!createdAt) return 0
    const start = new Date(createdAt)
    const now = new Date()
    return Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)))
  }

  const profilePercent = calcProfilePercent(p)
  const daysActive = calcDaysActive(user.created_at)

  const achievements = [
    { icon: '🏆', label: 'Profile Complete', value: profilePercent + '%', sub: profilePercent < 100 ? 'Fill in your stats to reach 100%' : 'Fully complete!', progress: profilePercent },
    { icon: '💪', label: 'Days Active', value: String(daysActive), sub: daysActive > 0 ? 'Since joining CombatHub' : 'Just joined!' },
    { icon: '📝', label: 'Forum Posts', value: String(postCount), sub: postCount > 0 ? 'Contributions to the community' : 'Start a discussion' },
    { icon: '👥', label: 'Followers', value: String(user.follower_count ?? 0), sub: user.follower_count > 0 ? 'Connections in your network' : 'Follow others to grow' },
    { icon: '🏅', label: 'Premium', value: p.is_premium ? 'ACTIVE' : 'STANDARD', sub: p.is_premium ? 'All premium features unlocked' : profilePercent >= 100 ? 'Click to start your free month' : 'Complete your profile first' },
  ]

  const TIPS = [
    'Complete your fighter profile to stand out in the community.',
    'Follow other fighters to build your network.',
    'Add your weight class and stance so coaches can find you.',
    'Set a profile picture to show your face to the squad.',
    'Check out the Community page to discover new training partners.',
    'Your bio is your first impression — make it count.',
  ]
  const tip = TIPS[new Date().getDate() % TIPS.length]

  const activityFeed = [
    ...(user.created_at ? [{ icon: '🎉', text: 'Joined CombatHub', time: new Date(user.created_at).toLocaleDateString() }] : []),
    ...(postCount > 0 ? [{ icon: '📝', text: 'Posted ' + postCount + ' forum ' + (postCount === 1 ? 'discussion' : 'discussions'), time: 'Active member' }] : []),
    ...(user.follower_count > 0 ? [{ icon: '👥', text: user.follower_count + ' follower' + (user.follower_count !== 1 ? 's' : ''), time: 'Building network' }] : []),
    ...(p.is_premium ? [{ icon: '🏅', text: 'Premium member', time: 'Verified account' }] : []),
  ]

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slowZoom" style={{ backgroundImage: 'url(' + img.hero + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-gradient-to-br from-nike-black/90 via-nike-black/80 to-nike-black/85')} />
      <div className={'fixed inset-0 bg-gradient-to-t from-nike-black/30 via-transparent to-nike-black/10 pointer-events-none ' + (isLight ? 'hidden' : '')} />

      <div className="relative z-10 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className={'relative overflow-hidden rounded-3xl border p-8 md:p-12 mb-12 backdrop-blur-sm ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-black/60 border-white/5')}>
              <div className={'absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none ' + (isLight ? 'from-nike-red/5 via-nike-amber/5 to-transparent' : 'from-nike-red/10 via-nike-amber/5 to-transparent')} />
              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-nike-red/50 shrink-0">
                  {user.profile?.avatar ? (
                    <img src={mediaUrl(user.profile.avatar)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black bg-nike-red/20 text-nike-red">
                      {(user.username || user.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left">
                  <div className="inline-block bg-nike-red/10 backdrop-blur-sm text-nike-red text-xs tracking-widest uppercase font-bold px-3 py-1 rounded-full border border-nike-red/20 mb-3">
                    Dashboard
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight">WELCOME BACK{user.username ? ', ' + user.username.toUpperCase() : ''}</h1>
                  <p className={'mt-2 text-sm ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{user.email} · {user.role.replace('_', ' ')}</p>
                   <div className={'flex gap-4 mt-3 text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                     <span><strong className={'font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{user.follower_count ?? 0}</strong> followers</span>
                     {user.role === 'athlete' && (
                       <span><strong className={'font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{user.following_count ?? 0}</strong> following</span>
                     )}
                   </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Daily tip */}
          <Reveal delay={50}>
            <div className={'flex items-center gap-3 p-4 mb-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] liquid-glass-card ' + (isLight
              ? 'bg-gradient-to-r from-nike-amber/5 to-transparent border-nike-amber/20'
              : 'bg-gradient-to-r from-nike-amber/5 to-transparent border-nike-amber/10'
            )}>
              <div className="w-10 h-10 bg-nike-amber/10 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg">💡</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-amber' : 'text-nike-amber')}>Fighter's Tip</p>
                <p className={'text-xs mt-0.5 leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/50')}>{tip}</p>
              </div>
              <div className={'text-4xl opacity-10 select-none shrink-0 ' + (isLight ? 'text-nike-amber' : 'text-nike-amber')}>🥊</div>
            </div>
          </Reveal>

          {/* Quick actions */}
          <div className="grid md:grid-cols-4 gap-5 mb-12">
            {quickActions.map((action, i) => (
              <Reveal key={action.label} delay={i * 100}>
                <Link
                  to={action.to}
                  className={'flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 group backdrop-blur-sm liquid-glass-card ' + (isLight
                    ? 'bg-white/90 border border-nike-gray shadow-sm hover:shadow-md hover:border-nike-red/30'
                    : 'bg-nike-dark/80 border border-white/5 hover:border-white/20'
                  )}
                >
                  <div className="w-12 h-12 bg-nike-red/10 rounded-xl flex items-center justify-center group-hover:bg-nike-red/20 group-hover:scale-110 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-nike-red">
                      <path d={action.icon} />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{action.label}</p>
                    <p className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Quick access</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* Messages Preview */}
          {conversations.length > 0 && (
            <Reveal delay={150}>
              <div className={'mb-8 p-6 rounded-2xl border backdrop-blur-sm liquid-glass-card ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs tracking-widest uppercase font-bold">Recent Messages</h2>
                  <Link to="/messages" className={'text-[10px] tracking-widest uppercase font-bold transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')}>
                    View All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {conversations.map((c) => (
                    <Link key={c.user_id} to="/messages" className={'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] ' + (isLight ? 'hover:bg-nike-gray/20' : 'hover:bg-white/5')}>
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-nike-gray/30">
                        {c.avatar ? (
                          <img src={mediaUrl(c.avatar)} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-nike-gray/20" style={{ color: 'var(--color-nike-light)' }}>
                            {(c.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={'text-xs font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{c.username}</p>
                          {c.unread > 0 && <span className="w-2 h-2 bg-nike-red rounded-full shrink-0" />}
                        </div>
                        <p className={'text-[10px] truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{c.last_message || 'No messages yet'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* Trending Gear / Vendor Products */}
          <Reveal delay={175}>
            <div className={'mb-12 p-6 rounded-2xl border backdrop-blur-sm liquid-glass-card ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs tracking-widest uppercase font-bold">{isVendor ? 'My Products' : 'Trending Gear'}</h2>
                <Link to={isVendor ? '/vendor/products/new' : '/shop'} className={'text-[10px] tracking-widest uppercase font-bold transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')}>
                  {isVendor ? 'Add New →' : 'Shop All →'}
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {loadingProducts ? (
                  <p className={'col-span-4 text-center py-8 text-sm ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Loading...</p>
                ) : products.length === 0 ? (
                  <p className={'col-span-4 text-center py-8 text-sm ' + (isLight ? 'text-nike-light' : 'text-white/40')}>No products yet.</p>
                ) : products.map((p) => (
                    <div
                    key={p.id}
                    onClick={() => navigate('/shop/' + p.id)}
                    className={'cursor-pointer group relative rounded-xl overflow-hidden border transition-all duration-200 hover:scale-[1.02] liquid-glass-card ' + (isLight ? 'bg-white border-nike-gray' : 'bg-nike-black/60 border-white/5')}
                  >
                    {isVendor && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/vendor/products/' + p.id + '/edit') }}
                        className={'absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ' + (isLight ? 'bg-white/90 text-nike-black shadow-sm' : 'bg-nike-dark/90 text-white')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    )}
                    <div className="aspect-square overflow-hidden bg-nike-gray/20">
                      <img src={p.images?.[0] || ''} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-3">
                      <p className={'text-[10px] font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.name}</p>
                      <p className="text-xs font-black text-nike-red mt-1">${parseFloat(p.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Stats - full width */}
          <Reveal delay={200}>
            <div className={'p-8 rounded-2xl border backdrop-blur-sm liquid-glass-card mb-8 ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black tracking-tight">YOUR STATS</h2>
                <Link to="/settings" className={'text-xs tracking-widest uppercase font-bold transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')}>
                  Edit →
                </Link>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {user.role === 'athlete' && (
                  <>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-nike-red/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-nike-red"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Weight Class</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.weight_class ? p.weight_class.replace('_', ' ') : '—'}</p>
                      </div>
                    </div>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-nike-red/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-nike-red"><path d="M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Stance</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.stance ? p.stance.charAt(0).toUpperCase() + p.stance.slice(1) : '—'}</p>
                      </div>
                    </div>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className={'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ' + (rc ? rc.bg : 'bg-nike-red/10')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={'w-5 h-5 ' + (rc ? rc.text : 'text-nike-red')}><path d={ROLE_ICONS[user.role] || ROLE_ICONS.athlete} /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Role</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{ROLE_LABELS[user.role] || user.role?.replace('_', ' ') || '—'}</p>
                      </div>
                    </div>
                  </>
                )}
                {user.role === 'vendor' && (
                  <>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-nike-red/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-nike-red"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Products</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{products.length} listed</p>
                      </div>
                    </div>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-nike-red/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-nike-red"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Brand</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.business_name || '—'}</p>
                      </div>
                    </div>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className={'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ' + (rc ? rc.bg : 'bg-nike-red/10')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={'w-5 h-5 ' + (rc ? rc.text : 'text-nike-red')}><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Role</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{ROLE_LABELS[user.role] || user.role?.replace('_', ' ') || '—'}</p>
                      </div>
                    </div>
                  </>
                )}
                {user.role === 'gym_owner' && (
                  <>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-nike-red/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-nike-red"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Business</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.business_name || '—'}</p>
                      </div>
                    </div>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-nike-red/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-nike-red"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Location</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.business_location || '—'}</p>
                      </div>
                    </div>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className={'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ' + (rc ? rc.bg : 'bg-nike-red/10')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={'w-5 h-5 ' + (rc ? rc.text : 'text-nike-red')}><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Role</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{ROLE_LABELS[user.role] || user.role?.replace('_', ' ') || '—'}</p>
                      </div>
                    </div>
                  </>
                )}
                {user.role === 'coach' && (
                  <>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-nike-red/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-nike-red"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Business</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.business_name || '—'}</p>
                      </div>
                    </div>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-nike-red/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-nike-red"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Specialty</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.business_description || '—'}</p>
                      </div>
                    </div>
                    <div className={'flex items-center gap-4 p-4 rounded-xl liquid-glass-card ' + (isLight ? 'bg-white border border-nike-gray' : 'bg-nike-black/60 border border-white/5')}>
                      <div className={'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ' + (rc ? rc.bg : 'bg-nike-red/10')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={'w-5 h-5 ' + (rc ? rc.text : 'text-nike-red')}><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className={'text-xs tracking-widest uppercase truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Role</p>
                        <p className={'text-sm font-bold mt-0.5 truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{ROLE_LABELS[user.role] || user.role?.replace('_', ' ') || '—'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Reveal>

          {/* Achievements & Activity - side by side */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Reveal delay={250}>
              <div className={'p-8 rounded-2xl border backdrop-blur-sm liquid-glass-card ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
                <h2 className="text-lg font-black tracking-tight mb-6">ACHIEVEMENTS</h2>
                <div className="space-y-4">
                  {achievements.map((a) => (
                    <div key={a.label} className={'flex items-center gap-3 p-3 rounded-xl ' + (isLight ? 'bg-nike-gray/20' : 'bg-white/5')}>
                      <span className="text-xl shrink-0">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={'text-xs font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{a.label}</p>
                          <p className="text-xs font-black text-nike-red">{a.value}</p>
                        </div>
                        <p className={'text-[10px] tracking-wider mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{a.sub}</p>
                        {a.progress !== undefined && (
                          <div className={'mt-2 h-1.5 rounded-full overflow-hidden ' + (isLight ? 'bg-nike-gray/50' : 'bg-white/10')}>
                            <div className="h-full rounded-full bg-gradient-to-r from-nike-red to-nike-amber" style={{ width: a.progress + '%' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className={'p-6 rounded-2xl border backdrop-blur-sm liquid-glass-card ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
                <h3 className="text-xs tracking-widest uppercase font-bold mb-4" style={{ color: 'var(--color-nike-light)' }}>Recent Activity</h3>
                <div className="space-y-3">
                  {activityFeed.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={'text-xs truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{item.text}</p>
                        <p className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

           <Reveal delay={350}>
             <div className={'p-6 rounded-2xl border backdrop-blur-sm liquid-glass-card ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
                {profilePercent < 100 ? (
                 <p className={'text-sm text-center ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                   CombatHub <strong>v{appVersion}</strong> — Complete your{' '}
                   <Link to="/settings" className="text-nike-red hover:underline font-bold">profile</Link>
                   {' to unlock all features.'}
                 </p>
               ) : premiumInfo?.is_premium ? (
                 <div>
                   <div className="flex items-center gap-2 mb-4">
                     <span className="text-lg">💎</span>
                     <h3 className={'text-sm font-bold tracking-wider ' + (isLight ? 'text-nike-black' : 'text-white')}>PREMIUM FEATURES</h3>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     {premiumInfo.premium_features.map((f) => (
                       <div key={f.title} className={'flex items-start gap-2 p-2 rounded-lg ' + (isLight ? 'bg-white/60' : 'bg-white/5')}>
                         <span className="text-lg shrink-0">{f.icon}</span>
                         <div className="min-w-0">
                           <p className={'text-[11px] font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{f.title}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                   {premiumInfo.premium_expires_at && (
                      <p className={'text-xs mt-3 text-center ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                        {premiumInfo.in_grace_period ? (
                          <span className="text-nike-amber font-bold">⏳ Grace period ends {new Date(premiumInfo.premium_grace_end).toLocaleDateString()}</span>
                        ) : (
                          <>Premium expires {new Date(premiumInfo.premium_expires_at).toLocaleDateString()} · <span className="text-nike-amber">7-day grace after expiry</span></>
                        )}
                      </p>
                    )}
                  </div>
                ) : profilePercent >= 100 ? (
                  <div className="text-center">
                    <p className={'text-sm ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                      Ready for the full experience?
                    </p>
                    <button
                      onClick={() => navigate('/premium/setup')}
                      className="mt-3 inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300"
                    >
                      ⚡ Start Your Free Month of Premium
                    </button>
                    <p className={'text-[10px] mt-2 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                      No credit card required. 7-day grace period after expiry.
                    </p>
                  </div>
               ) : (
                 <p className={'text-sm text-center ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                   CombatHub <strong>v{appVersion}</strong>
                 </p>
               )}
             </div>
           </Reveal>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  if (user) return <HomeDashboard />
  return <HomeMarketing />
}
