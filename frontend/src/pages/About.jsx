import { Link } from 'react-router-dom'
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

export default function About() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const img = IMAGES[theme]
  return (
    <div>
      <section className="relative flex items-center overflow-hidden" style={{ minHeight: '70vh' }}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slowZoom"
          style={{ backgroundImage: 'url(' + img.hero + ')' }}
        />
        <div className={'absolute inset-0 ' + (isLight ? 'bg-white/80' : 'bg-gradient-to-r from-nike-black/95 via-nike-black/80 to-nike-black/60')} />
        {!isLight && <div className="absolute inset-0 bg-gradient-to-t from-nike-black via-transparent to-nike-black/30" />}
        <div className="relative max-w-5xl mx-auto px-6 py-24 w-full">
          <Reveal>
            <div className="inline-block mb-6">
              <span className="bg-nike-red/20 backdrop-blur-sm text-nike-red text-xs tracking-widest uppercase font-bold px-5 py-2 rounded-full border border-nike-red/30">
                Our Story
              </span>
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
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <Reveal>
              <div>
                <span className="text-nike-red text-xs tracking-widest uppercase font-bold">Our Mission</span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-3 mb-6">
                  EMPOWERING EVERY<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-nike-red to-nike-amber">FIGHTER'S JOURNEY</span>
                </h2>
                <p className={'leading-relaxed mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/50')}>
                  CombatHub was born in the gym, not a boardroom. We saw how fragmented the combat sports world was — 
                  athletes struggling to find quality coaching, coaches wasting time on scheduling, gyms lacking modern tools, 
                  and fighters hunting for reliable gear.
                </p>
                <p className={'leading-relaxed mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/50')}>
                  We built the ecosystem we wished existed: one platform where every piece of your fighting journey connects. 
                  Whether you're stepping into the ring for the first time or preparing for a title shot, CombatHub gives you 
                  the tools, community, and resources to push further.
                </p>
                <p className={'leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/50')}>
                  No more jumping between apps. No more dead ends. Just everything you need, integrated and accessible.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-nike-red/20 via-nike-amber/10 to-transparent rounded-2xl blur-2xl" />
                <img
                  src={img.mission}
                  alt="Training"
                  className={'relative w-full h-80 md:h-96 object-cover rounded-2xl ' + (isLight ? 'border border-nike-gray' : 'border border-white/5')}
                />
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="text-center mb-16">
              <span className="text-nike-red text-xs tracking-widest uppercase font-bold">What We Stand For</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-3">CORE VALUES</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 mb-24">
            {[
              {
                icon: '🥊',
                title: 'Authenticity',
                desc: 'Every product, coach, and gym on our platform is vetted. We only work with those who share our commitment to quality and integrity in combat sports.',
              },
              {
                icon: '🤝',
                title: 'Community First',
                desc: 'We believe fighters grow faster together. Our platform is built to foster real connections — between athletes, coaches, and the wider combat sports family.',
              },
              {
                icon: '🔥',
                title: 'Relentless Improvement',
                desc: 'Just like every fighter in the gym, we never stop evolving. We constantly refine the platform based on what our community needs to succeed.',
              },
            ].map((val, i) => (
              <Reveal key={val.title} delay={i * 150}>
                <div className={'group rounded-2xl p-8 transition-all duration-500 ' + (isLight
                  ? 'bg-nike-dark border border-nike-gray shadow-sm hover:shadow-md hover:border-nike-red/30'
                  : 'bg-nike-dark border border-white/5 hover:border-nike-red/30 hover:shadow-lg hover:shadow-nike-red/5'
                )}>
                  <div className="w-14 h-14 bg-nike-red/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:bg-nike-red/20 transition-all duration-300">
                    {val.icon}
                  </div>
                  <h3 className={'text-xl font-bold mb-3 ' + (isLight ? 'text-nike-black' : 'text-white')}>{val.title}</h3>
                  <p className={'text-sm leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{val.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* What We Offer */}
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-nike-red text-xs tracking-widest uppercase font-bold">The Platform</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-3">WHAT WE OFFER</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6 mb-24">
            {[
              {
                title: 'Premium Gear Marketplace',
                desc: 'Shop gloves, wraps, apparel, equipment, and supplements from trusted brands. Every product is reviewed by fighters, for fighters.',
                color: 'from-nike-red/20 to-transparent',
              },
              {
                title: 'Elite Coach Network',
                desc: 'Find and book certified coaches across boxing, Muay Thai, BJJ, wrestling, and MMA. Train online or in-person with the best in the game.',
                color: 'from-nike-amber/20 to-transparent',
              },
              {
                title: 'Gym Directory & Management',
                desc: 'Discover combat sports gyms near you, compare amenities, view schedules, and manage memberships — all from one dashboard.',
                color: 'from-nike-orange/20 to-transparent',
              },
              {
                title: 'Event & Fight Tracking',
                desc: 'Stay on top of upcoming fights, events, and tournaments. Track your own fight history, record, and progression over time.',
                color: 'from-nike-red/20 to-transparent',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div className={'group rounded-2xl p-8 transition-all duration-500 overflow-hidden relative ' + (isLight
                  ? 'bg-nike-dark border border-nike-gray shadow-sm hover:shadow-md hover:border-nike-red/30'
                  : 'bg-nike-dark border border-white/5 hover:border-white/20'
                )}>
                  <div className={'absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ' + item.color + ' rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none'} />
                  <div className="relative">
                    <h3 className={'text-xl font-bold mb-3 ' + (isLight ? 'text-nike-black' : 'text-white')}>{item.title}</h3>
                    <p className={'text-sm leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* CTA */}
          <Reveal delay={200}>
            <div className={'relative overflow-hidden rounded-2xl p-8 md:p-12 text-center ' + (isLight
              ? 'bg-gradient-to-br from-nike-red/5 via-nike-amber/5 to-white border border-nike-gray'
              : 'bg-gradient-to-br from-nike-red/10 via-nike-amber/5 to-nike-dark border border-white/5'
            )}>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                  READY TO STEP INSIDE?
                </h2>
                <p className={'max-w-md mx-auto mb-8 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                  Join thousands of athletes, coaches, and gyms already on the platform. Free to start.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300"
                >
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
