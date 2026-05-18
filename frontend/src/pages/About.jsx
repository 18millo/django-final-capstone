import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import GSAP from 'gsap'
import Reveal from '../components/ui/Reveal'
import { useTheme } from '../providers/ThemeProvider'

const IMAGES = {
  dark: {
    hero: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=80',
    mission: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80',
  },
  light: {
    hero: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1920&q=80',
    mission: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  },
}

const stats = [
  { value: '15+', label: 'Coaches' },
  { value: '13+', label: 'Gyms' },
  { value: '60+', label: 'Products' },
  { value: '47+', label: 'Forum Posts' },
]

const features = [
  {
    icon: '🥊',
    title: 'Premium Marketplace',
    desc: 'Shop gloves, wraps, apparel, and equipment from top brands like Hayabusa, Venum, Fairtex, and Everlast. Discounted and limited-edition drops available.',
  },
  {
    icon: '💬',
    title: 'Real-Time Chat',
    desc: 'Direct messaging with real-time WebSocket delivery. Typing indicators, read receipts, and message editing. Connect instantly with coaches, gyms, and athletes.',
  },
  {
    icon: '📸',
    title: 'Community Gallery',
    desc: 'Share training moments with the combat sports community. Premium users can upload images. Like, comment, and engage with other fighters\' content.',
  },
  {
    icon: '📝',
    title: 'Community Forum',
    desc: 'Post text and media, upvote/downvote content, and engage in threaded discussions. Share techniques, training tips, and fight analysis with the community.',
  },
  {
    icon: '🏪',
    title: 'Vendor Dashboard',
    desc: 'Full product management for vendors, coaches, and gym owners. Manage inventory, toggle discounts, upload product images, and track sales.',
  },
  {
    icon: '📊',
    title: 'Fighter Profiles',
    desc: 'Detailed fighter profiles with weight class, stance, reach, and stats. Track followers, following, and activity. Public profile pages for networking.',
  },
  {
    icon: '🔐',
    title: 'Two-Factor Authentication',
    desc: 'Secure your account with authenticator app TOTP 2FA. Google OAuth login supported. Vendor and coach accounts use access codes for extra security.',
  },
  {
    icon: '👑',
    title: 'Premium Membership',
    desc: 'Verified blue badge, exclusive gallery upload access, priority messaging, and advanced analytics. Stand out from the crowd with a premium account.',
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    desc: 'Real-time push notifications for follows and messages via WebSocket. Unread counts on navbar, notification drawer, and email alerts.',
  },
  {
    icon: '🌙',
    title: 'Dark & Light Themes',
    desc: 'Full dark mode with custom Nike-inspired color tokens. Light theme for daytime training. Ambient gym sounds for the full experience.',
  },
  {
    icon: '📱',
    title: 'Mobile Responsive',
    desc: 'Fully responsive design built with Tailwind CSS v4. Works seamlessly on desktop, tablet, and mobile. Optimized for training on the go.',
  },
  {
    icon: '📦',
    title: 'Shopping Cart & Orders',
    desc: 'Full cart system with quantity controls. Order history with status tracking (pending, paid, shipped, delivered). M-Pesa and card payment ready.',
  },
]

export default function About() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const img = IMAGES[theme]

  return (
    <div>
      <section className="relative flex items-center overflow-hidden" style={{ minHeight: '70vh' }}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slowZoom" style={{ backgroundImage: 'url(' + img.hero + ')' }} />
        <div className={'absolute inset-0 ' + (isLight ? 'bg-white/80' : 'bg-gradient-to-r from-nike-black/95 via-nike-black/80 to-nike-black/60')} />
        {!isLight && <div className="absolute inset-0 bg-gradient-to-t from-nike-black via-transparent to-nike-black/30" />}
        <div className="relative max-w-5xl mx-auto px-6 py-24 w-full">
          <Reveal gsap>
            <div className="inline-block mb-6">
              <span className="bg-nike-red/20 backdrop-blur-sm text-nike-red text-xs tracking-widest uppercase font-bold px-5 py-2 rounded-full border border-nike-red/30">Our Story</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
              BUILT BY<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-nike-red via-nike-amber to-nike-orange">FIGHTERS</span><br />
              FOR FIGHTERS
            </h1>
            <p className={'text-lg md:text-xl max-w-xl leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/50')}>
              One platform uniting athletes, coaches, gyms, and brands. The combat sports ecosystem.
            </p>
          </Reveal>
        </div>
      </section>

      <section className={'border-t ' + (isLight ? 'bg-white border-nike-gray' : 'bg-nike-black border-white/5')}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
            {stats.map((s) => (
              <Reveal key={s.label} gsap>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-nike-red">{s.value}</div>
                  <div className={'text-xs tracking-widest uppercase mt-1 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Mission */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <Reveal gsap>
              <div>
                <span className="text-nike-red text-xs tracking-widest uppercase font-bold">Our Mission</span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-3 mb-6">
                  EMPOWERING EVERY<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-nike-red to-nike-amber">FIGHTER'S JOURNEY</span>
                </h2>
                <p className={'leading-relaxed mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/50')}>
                  CombatHub was born in the gym, not a boardroom. We saw how fragmented the combat sports world was — athletes struggling to find quality coaching, coaches wasting time on scheduling, gyms lacking modern tools, and fighters hunting for reliable gear.
                </p>
                <p className={'leading-relaxed mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/50')}>
                  We built the ecosystem we wished existed: one platform where every piece of your fighting journey connects. Whether you're stepping into the ring for the first time or preparing for a title shot, CombatHub gives you the tools, community, and resources to push further.
                </p>
                <p className={'leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/50')}>
                  No more jumping between apps. No more dead ends. Everything you need — gear, coaching, gyms, and community — integrated and accessible from one combat sports hub.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200} gsap>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-nike-red/20 via-nike-amber/10 to-transparent rounded-2xl blur-2xl" />
                <img src={img.mission} alt="Training" className={'relative w-full h-80 md:h-96 object-cover rounded-2xl ' + (isLight ? 'border border-nike-gray' : 'border border-white/5')} />
              </div>
            </Reveal>
          </div>

          {/* Values */}
          <Reveal gsap>
            <div className="text-center mb-16">
              <span className="text-nike-red text-xs tracking-widest uppercase font-bold">What We Stand For</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-3">CORE VALUES</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 mb-24">
            {[
              { icon: '🥊', title: 'Authenticity', desc: 'Every product, coach, and gym on our platform is vetted. We only work with those who share our commitment to quality and integrity in combat sports.' },
              { icon: '🤝', title: 'Community First', desc: 'We believe fighters grow faster together. Our platform is built to foster real connections — between athletes, coaches, and the wider combat sports family.' },
              { icon: '🔥', title: 'Relentless Improvement', desc: 'Just like every fighter in the gym, we never stop evolving. We constantly refine the platform based on what our community needs to succeed.' },
            ].map((val, i) => (
              <Reveal key={val.title} delay={i * 150} gsap>
                <div className={'group rounded-2xl p-8 transition-all duration-500 ' + (isLight ? 'bg-nike-dark border border-nike-gray shadow-sm hover:shadow-md hover:border-nike-red/30' : 'bg-nike-dark border border-white/5 hover:border-nike-red/30 hover:shadow-lg hover:shadow-nike-red/5')}>
                  <div className="w-14 h-14 bg-nike-red/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:bg-nike-red/20 transition-all duration-300">{val.icon}</div>
                  <h3 className={'text-xl font-bold mb-3 ' + (isLight ? 'text-nike-black' : 'text-white')}>{val.title}</h3>
                  <p className={'text-sm leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{val.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* All Features */}
          <Reveal gsap>
            <div className="text-center mb-16">
              <span className="text-nike-red text-xs tracking-widest uppercase font-bold">The Platform</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-3">EVERYTHING YOU NEED</h2>
              <p className={'mt-3 max-w-xl mx-auto text-sm ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Twelve core features — one combat sports ecosystem.</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5 mb-24">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60} gsap>
                <div className={'group rounded-2xl p-6 transition-all duration-500 ' + (isLight ? 'bg-nike-dark border border-nike-gray shadow-sm hover:shadow-md hover:border-nike-red/30' : 'bg-nike-dark border border-white/5 hover:border-white/20')}>
                  <div className="w-12 h-12 bg-nike-red/10 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 group-hover:bg-nike-red/20 transition-all duration-300">{f.icon}</div>
                  <h3 className={'text-base font-bold mb-2 ' + (isLight ? 'text-nike-black' : 'text-white')}>{f.title}</h3>
                  <p className={'text-sm leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* CTA */}
          <Reveal delay={200} gsap>
            <div className={'relative overflow-hidden rounded-2xl p-8 md:p-12 text-center ' + (isLight ? 'bg-gradient-to-br from-nike-red/5 via-nike-amber/5 to-white border border-nike-gray' : 'bg-gradient-to-br from-nike-red/10 via-nike-amber/5 to-nike-dark border border-white/5')}>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">READY TO STEP INSIDE?</h2>
                <p className={'max-w-md mx-auto mb-8 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Join thousands of athletes, coaches, and gyms already on the platform. Free to start.</p>
                <Link to="/register" className="inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300">
                  Join the Movement <span>→</span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
