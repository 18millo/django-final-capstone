import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import { useAuth } from '../providers/AuthProvider'
import { getToken } from '../utils/api'
import { IconBoxingGlove, IconCheck, IconGem, IconHourglass, IconInfo, IconMail, IconRun, IconShop, IconWeightLift } from '../components/Icons'

const SHOP_URL = import.meta.env.VITE_SHOP_URL || 'http://localhost:5174'

const BG = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=80'

const FEATURES = [
  {
    icon: '🛒',
    title: 'Sell Products',
    desc: 'List and sell your combat sports gear, supplements, apparel and more.',
    forRole: ['vendor'],
    label: 'Vendors',
    link: null,
  },
  {
    icon: '📊',
    title: 'Business Dashboard',
    desc: 'Real-time stats, follower insights, product performance, and quick actions.',
    forRole: ['vendor', 'coach', 'gym_owner'],
    label: 'Vendors, Coaches & Gym Owners',
    link: null,
  },
  {
    icon: '🏋️',
    title: 'Gym Management',
    desc: 'Manage your gym profile and showcase your facility to potential members.',
    forRole: ['gym_owner'],
    label: 'Gym Owners',
    link: null,
  },
  {
    icon: '🏆',
    title: 'Coaching Tools',
    desc: 'Access client management tools, certification showcases, and training plans.',
    forRole: ['coach'],
    label: 'Coaches',
    link: null,
  },
  {
    icon: '🖼️',
    title: 'Gallery Uploads',
    desc: 'Upload images and videos to your gallery to promote your brand.',
    forRole: ['vendor', 'coach', 'gym_owner', 'athlete'],
    label: 'Vendors, Coaches, Gym Owners & Athletes',
    link: null,
  },
  {
    icon: '📈',
    title: 'Growth Analytics',
    desc: 'Track follower growth, engagement metrics, and business performance.',
    forRole: ['vendor', 'coach', 'gym_owner', 'athlete'],
    label: 'Everyone',
    link: null,
  },
  {
    icon: '🔗',
    title: 'Priority Support',
    desc: 'Get faster responses and dedicated support for your needs.',
    forRole: ['vendor', 'coach', 'gym_owner', 'athlete'],
    label: 'Everyone',
    link: null,
  },
  {
    icon: '💎',
    title: 'Exclusive Badge',
    desc: 'Stand out with a premium badge on your profile and listings.',
    forRole: ['vendor', 'coach', 'gym_owner', 'athlete'],
    label: 'Everyone',
    link: null,
  },
]

const ATHLETE_FEATURES = [
  {
    icon: '📋',
    title: 'Advanced Profile Stats',
    desc: 'See detailed follower analytics, profile visits, and engagement trends over time.',
  },
  {
    icon: '⭐',
    title: 'Priority Following',
    desc: 'Get your follow requests seen first by coaches, vendors, and gym owners.',
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    desc: 'Get notified when your favorite vendors restock or coaches post new content.',
  },
  {
    icon: '🏅',
    title: 'Achievement Badges',
    desc: 'Unlock exclusive premium achievement badges on your profile.',
  },
  {
    icon: '🎯',
    title: 'Personalized Feed',
    desc: 'Get a curated feed of content from your favorite fighters, coaches, and brands.',
  },
  {
    icon: '🎫',
    title: 'Event Priority',
    desc: 'Get early access to event tickets, meet-and-greets, and exclusive promotions.',
  },
  {
    icon: '🛡️',
    title: 'Enhanced Privacy',
    desc: 'Control who can see your activity, followers list, and online status.',
  },
  {
    icon: '📱',
    title: 'Ad-Free Experience',
    desc: 'Browse CombatHub without promotional content and banners.',
  },
]

const BUSINESS_ROLES = ['vendor', 'coach', 'gym_owner']

export default function Premium() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [openFaq, setOpenFaq] = useState(null)

  const userRole = user?.role
  const isBusiness = BUSINESS_ROLES.includes(userRole)
  const isAthlete = userRole === 'athlete'

  const roleGridCols =
    isAthlete ? 'md:grid-cols-1 max-w-sm mx-auto' :
    isBusiness ? 'md:grid-cols-3' :
    'md:grid-cols-4'

  const cardClass = (clickable) =>
    'block p-6 rounded-2xl border text-center transition-all duration-300 liquid-glass-card ' +
    (isLight ? 'bg-nike-gray/20 border-nike-gray ' : 'bg-white/5 border-white/10 ') +
    (clickable ? 'hover:border-nike-red/30 hover:scale-[1.02] cursor-pointer ' : '')

  const featureCardClass = (clickable) =>
    'flex gap-4 p-5 rounded-2xl border transition-all duration-300 liquid-glass-card ' +
    (isLight ? 'bg-nike-gray/20 border-nike-gray ' : 'bg-white/5 border-white/10 ') +
    (clickable ? 'hover:border-nike-red/30 hover:scale-[1.02] cursor-pointer ' : '')

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-105" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 md:py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6"><IconGem className="w-4 h-4" /></div>
          <h1 className={'text-4xl md:text-6xl font-black tracking-tight mb-4 ' + (isLight ? 'text-nike-black' : 'text-white')}>
            CombatHub <span className="text-nike-red">Premium</span>
          </h1>
          <p className={'text-lg max-w-2xl mx-auto mb-8 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
            Unlock powerful tools to grow your combat sports presence. Free 30-day trial — no charges during trial.
          </p>
          {user ? (
            user.email_verified ? (
              <Link
                to="/premium/setup"
                className="inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-8 py-4 rounded-full text-sm tracking-widest uppercase font-bold transition-all duration-300"
              >
                {user.profile?.is_premium ? '⚡ Manage Premium' : '🔓 Start Free Trial'}
              </Link>
            ) : (
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 bg-nike-amber hover:bg-white hover:text-nike-black text-white px-8 py-4 rounded-full text-sm tracking-widest uppercase font-bold transition-all duration-300"
              >
                <IconMail className="w-4 h-4" /> Verify Email to Access Premium
              </Link>
            )
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-8 py-4 rounded-full text-sm tracking-widest uppercase font-bold transition-all duration-300"
            >
              Sign Up to Get Started
              </Link>
            )}
            {(!isAthlete || !user) && (
              <a href={`${SHOP_URL}?token=${getToken('access_token') || ''}`} target="_blank" rel="noopener noreferrer" className={cardClass(true)}>
                <div className="text-3xl mb-3"><IconShop className="w-4 h-4" /></div>
                <h3 className={'font-bold text-sm tracking-widest uppercase mb-2 ' + (isLight ? 'text-nike-black' : 'text-white')}>Vendors</h3>
                <p className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Sell products, manage inventory, view sales stats</p>
              </a>
            )}
            {(!isAthlete || !user) && (
              <Link to="/community" className={cardClass(true)}>
                <div className="text-3xl mb-3"><IconBoxingGlove className="w-4 h-4" /></div>
                <h3 className={'font-bold text-sm tracking-widest uppercase mb-2 ' + (isLight ? 'text-nike-black' : 'text-white')}>Coaches</h3>
                <p className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Showcase certifications, manage clients, track growth</p>
              </Link>
            )}
            {(!isAthlete || !user) && (
              <Link to="/community" className={cardClass(true)}>
                <div className="text-3xl mb-3"><IconWeightLift className="w-4 h-4" /></div>
                <h3 className={'font-bold text-sm tracking-widest uppercase mb-2 ' + (isLight ? 'text-nike-black' : 'text-white')}>Gym Owners</h3>
                <p className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Manage gym profile, showcase facility, attract members</p>
              </Link>
            )}
            {(!isBusiness || !user) && (
              <a href="#athlete-features" className={cardClass(true)} onClick={(e) => {
                e.preventDefault()
                document.getElementById('athlete-features')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                <div className="text-3xl mb-3"><IconRun className="w-4 h-4" /></div>
                <h3 className={'font-bold text-sm tracking-widest uppercase mb-2 ' + (isLight ? 'text-nike-black' : 'text-white')}>Athletes</h3>
                <p className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Enhanced profiles, analytics, priority access, ad-free browsing</p>
              </a>
            )}
          </div>
          <p className={'text-center text-xs mt-6 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
            {isAthlete
              ? 'Athletes can use CombatHub for free. Premium gives you extra perks — advanced analytics, priority access, and ad-free browsing.'
              : isBusiness
                ? 'Business roles require Premium to unlock selling, dashboards, gallery uploads, and analytics.'
                : 'Athletes and regular users can use CombatHub for free. Premium gives everyone extra perks.'}
          </p>

        {/* Athlete Premium Features */}
        {(!isBusiness || !user) && (
        <div id="athlete-features" className={'rounded-3xl border p-8 md:p-12 mb-12 backdrop-blur-sm scroll-mt-24 ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
          <h2 className={'text-xl font-black tracking-tight mb-2 text-center ' + (isLight ? 'text-nike-black' : 'text-white')}>
            <IconRun className="w-4 h-4" /> Premium for Athletes
          </h2>
          <p className={'text-sm text-center mb-8 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
            Even if you&apos;re not selling or coaching, Premium gives you more.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {ATHLETE_FEATURES.map((feat, i) => (
              <div key={i} className={featureCardClass(false)}>
                <div className="text-2xl shrink-0 mt-1">{feat.icon}</div>
                <div>
                  <h3 className={'font-bold text-sm tracking-wide mb-1 ' + (isLight ? 'text-nike-black' : 'text-white')}>{feat.title}</h3>
                  <p className={'text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Business Features Grid */}
        {(!isAthlete || !user) && (
        <div className={'rounded-3xl border p-8 md:p-12 mb-12 backdrop-blur-sm ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
          <h2 className={'text-xl font-black tracking-tight mb-2 text-center ' + (isLight ? 'text-nike-black' : 'text-white')}>
            <IconShop className="w-4 h-4" /> Business Tools
          </h2>
          <p className={'text-sm text-center mb-8 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
            Vendors, coaches, and gym owners — required access for your business features.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((feat, i) => {
              const content = (
                <>
                  <div className="text-2xl shrink-0 mt-1">{feat.icon}</div>
                  <div>
                    <h3 className={'font-bold text-sm tracking-wide mb-1 ' + (isLight ? 'text-nike-black' : 'text-white')}>{feat.title}</h3>
                    <p className={'text-xs mb-2 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{feat.desc}</p>
                    <span className="inline-block px-2 py-0.5 bg-nike-red/10 text-nike-red rounded text-[10px] tracking-widest uppercase font-bold">
                      {feat.label}
                    </span>
                  </div>
                </>
              )
              return (
                <div key={i} className={featureCardClass(false)}>
                  {content}
                </div>
              )
            })}
          </div>
        </div>
        )}

        {/* Pricing */}
        <div className={'rounded-3xl border p-8 md:p-12 mt-12 backdrop-blur-sm ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
          <h2 className={'text-xl font-black tracking-tight mb-8 text-center ' + (isLight ? 'text-nike-black' : 'text-white')}>
            Simple Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Trial */}
            <div className={'p-6 rounded-2xl border-2 text-center flex flex-col liquid-glass-card ' + (isLight ? 'border-nike-gray bg-nike-gray/10' : 'border-white/10 bg-white/5')}>
              <div className={'text-xs tracking-widest uppercase font-bold mb-3 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Free Trial</div>
              <div className="text-4xl font-black tracking-tight mb-2 text-nike-red">$0</div>
              <div className={'text-xs mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>/30 days</div>
              <ul className={'text-xs space-y-2 mb-6 flex-1 text-left ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>Full access to all premium features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>No charges during trial</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>7-day grace extension after expiry</span>
                </li>
              </ul>
              {user ? (
                user.email_verified ? (
                  <Link to="/premium/setup" className="block w-full bg-nike-red hover:bg-white hover:text-nike-black text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
                    {user.profile?.is_premium ? 'Manage Premium' : 'Start Free Trial'}
                  </Link>
                ) : (
                  <Link to="/settings" className="block w-full bg-nike-amber hover:bg-white hover:text-nike-black text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
                    Verify Email First
                  </Link>
                )
              ) : (
                <Link to="/register" className="block w-full bg-nike-red hover:bg-white hover:text-nike-black text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
                  Sign Up
                </Link>
              )}
            </div>

            {/* Monthly */}
            <div className={'p-6 rounded-2xl border-2 border-nike-red/30 text-center flex flex-col relative overflow-hidden liquid-glass-card ' + (isLight ? 'bg-white' : 'bg-nike-dark/80')} style={isLight ? {} : { backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)' }}>
              <div className="absolute top-3 right-3 bg-nike-red text-white text-[10px] px-2 py-0.5 rounded-full tracking-widest uppercase font-bold">Popular</div>
              <div className={'text-xs tracking-widest uppercase font-bold mb-3 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Monthly</div>
              <div className="text-4xl font-black tracking-tight mb-2 text-nike-red">$35</div>
              <div className={'text-xs mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>/month</div>
              <ul className={'text-xs space-y-2 mb-6 flex-1 text-left ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>Sell products in the marketplace</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>Business dashboard & analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>Gallery & community posting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>Cancel anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-nike-amber shrink-0"><IconHourglass className="w-4 h-4" /></span>
                  <span><span className="text-nike-amber font-bold">7-day grace period</span> after expiry</span>
                </li>
              </ul>
              {user ? (
                user.email_verified ? (
                  <Link to="/premium/setup?plan=monthly" className="block w-full bg-nike-red hover:bg-white hover:text-nike-black text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
                    Subscribe Monthly
                  </Link>
                ) : (
                  <Link to="/settings" className="block w-full bg-nike-amber hover:bg-white hover:text-nike-black text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
                    Verify Email First
                  </Link>
                )
              ) : (
                <Link to="/register" className="block w-full bg-nike-red hover:bg-white hover:text-nike-black text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
                  Sign Up
                </Link>
              )}
            </div>

            {/* Yearly */}
            <div className={'p-6 rounded-2xl border-2 text-center flex flex-col relative overflow-hidden liquid-glass-card ' + (isLight ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-500/30 bg-emerald-500/5')}>
              <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full tracking-widest uppercase font-bold">Best Value</div>
              <div className={'text-xs tracking-widest uppercase font-bold mb-3 ' + (isLight ? 'text-emerald-700' : 'text-emerald-400')}>Yearly</div>
              <div className="text-4xl font-black tracking-tight mb-1 text-emerald-500">$357</div>
              <div className={'text-xs mb-1 ' + (isLight ? 'text-emerald-600/60' : 'text-emerald-400/60')}>
                <span className="line-through">$420</span>
                <span className="ml-1 font-bold">Save $63</span>
              </div>
              <div className={'text-xs mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>/year (15% off)</div>
              <ul className={'text-xs space-y-2 mb-6 flex-1 text-left ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>Everything in Monthly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>15% discount vs monthly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  <span>Cancel anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-nike-amber shrink-0"><IconHourglass className="w-4 h-4" /></span>
                  <span><span className="text-nike-amber font-bold">7-day grace period</span> after expiry</span>
                </li>
              </ul>
              {user ? (
                user.email_verified ? (
                  <Link to="/premium/setup?plan=yearly" className="block w-full bg-emerald-500 hover:bg-white hover:text-emerald-500 text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
                    Subscribe Yearly
                  </Link>
                ) : (
                  <Link to="/settings" className="block w-full bg-nike-amber hover:bg-white hover:text-nike-black text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
                    Verify Email First
                  </Link>
                )
              ) : (
                <Link to="/register" className="block w-full bg-emerald-500 hover:bg-white hover:text-emerald-500 text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
                  Sign Up
                </Link>
              )}
            </div>
          </div>
          <p className={'text-xs text-center mt-6 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
            Start with a free 30-day trial — no charges during trial. After the trial you&apos;ll need a paid plan to continue.
          </p>
        </div>

        {/* How to Cancel */}
        <div className={'rounded-3xl border p-8 md:p-12 mt-12 backdrop-blur-sm ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
          <h2 className={'text-xl font-black tracking-tight mb-4 text-center ' + (isLight ? 'text-nike-black' : 'text-white')}>
            How to Cancel Premium
          </h2>
            <div className={'max-w-2xl mx-auto p-6 rounded-2xl border liquid-glass-card ' + (isLight ? 'bg-nike-gray/20 border-nike-gray' : 'bg-white/5 border-white/10')}>
            <div className="flex items-start gap-4">
              <div className="text-2xl shrink-0"><IconInfo className="w-4 h-4" /></div>
              <div>
                <h3 className={'font-bold text-sm tracking-wide mb-2 ' + (isLight ? 'text-nike-black' : 'text-white')}>No Commitments, Cancel Anytime</h3>
                <p className={'text-xs mb-3 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                  Since CombatHub Premium is currently on a free trial model, there are no recurring charges to cancel.
                  Simply let your trial expire and your premium features will be locked after the 7-day grace period.
                </p>
                <p className={'text-xs mb-4 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                  If you&apos;d like to end your premium access immediately, visit the Manage Premium page and click &quot;Cancel Premium&quot;.
                  Your premium will be revoked right away.
                </p>
                {user && (
                  <Link
                    to="/premium/setup"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] tracking-widest uppercase font-bold border transition-all duration-300 hover:border-nike-red hover:text-nike-red"
                    style={{ borderColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}
                  >
                    Manage Premium
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className={'rounded-3xl border p-8 md:p-12 mt-12 backdrop-blur-sm ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
          <h2 className={'text-xl font-black tracking-tight mb-6 text-center ' + (isLight ? 'text-nike-black' : 'text-white')}>
            FAQ
          </h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {[
              { q: 'What is CombatHub Premium?', a: 'Premium is a subscription that unlocks business tools for vendors, coaches, and gym owners — plus extra perks like advanced analytics, priority access, and an ad-free experience for athletes and all users.' },
              { q: 'How does the free trial work?', a: 'Sign up, choose your role, and add a payment method on the payment setup page. You get 30 days of all premium features completely free. No charges during the trial.' },
              { q: 'What happens after the trial ends?', a: 'When the 30-day trial expires, you are automatically granted a 7-day grace period. During this time you keep full access to premium features. After the grace period ends, premium features are locked and you revert to the free tier.' },
              { q: 'Will I be charged after the trial?', a: 'Not automatically. Payment processing (monthly/annual subscriptions via M-Pesa or card) will be introduced in a future update. For now, your premium simply expires.' },
              { q: 'How do I cancel my premium?', a: 'Go to Manage Premium and click "Cancel Premium". Your premium features will be revoked immediately. Since it is a free trial, there are no charges or refunds involved. You can also just let the trial and grace period expire naturally.' },
              { q: 'Can I reactivate after cancelling?', a: 'Yes. Go to the payment setup page again, re-enter your payment method, and you will receive another 30-day trial. There is no limit on how many times you can restart.' },
              { q: 'What payment methods are accepted?', a: 'We currently accept M-Pesa (Kenya) and credit/debit cards (Visa, Mastercard, Amex, Discover). More methods will be added in the future.' },
              { q: 'Is my payment information secure?', a: 'Yes. M-Pesa phone numbers and card details are stored securely in our database. We use industry-standard encryption and never expose full card numbers — only the last four digits and card brand are stored.' },
              { q: 'Why do vendors/coaches/gym owners need premium?', a: 'These roles have access to business tools — selling products, business dashboards, gallery uploads, inventory management, and growth analytics. Premium is required to unlock these features. Regular users (athletes, fans) can use CombatHub for free.' },
              { q: 'What does premium give athletes?', a: 'Athlete premium includes advanced profile stats, priority following, smart notifications, achievement badges, a personalized feed, event priority access, enhanced privacy controls, and an ad-free browsing experience.' },
              { q: 'What is the grace period?', a: 'The grace period is a 7-day extension granted automatically after your 30-day trial expires. It gives you extra time to decide if you want to keep premium before features are locked. You will receive a notification when it starts.' },
              { q: 'What happens to my products/data if premium expires?', a: 'Your products and data are preserved but hidden from the marketplace. Once you reactivate premium, everything is restored. Nothing is deleted.' },
              { q: 'Can I switch payment methods?', a: 'Yes. On the payment setup page, just enter your new payment info. It will replace your existing method on file.' },
              { q: 'I still have questions. How do I get help?', a: 'Send us a message through the app or contact support at mungailevi1@gmail.com. Premium users get priority responses.' },
            ].map((faq, i) => (
              <div key={i} className={'rounded-2xl border overflow-hidden transition-all duration-200 liquid-glass-card ' + (isLight ? 'border-nike-gray' : 'border-white/10')}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={'flex items-center justify-between w-full px-5 py-4 text-left transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/20' : 'hover:bg-white/5')}
                >
                  <h3 className={'font-bold text-sm tracking-wide pr-4 ' + (isLight ? 'text-nike-black' : 'text-white')}>{faq.q}</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={'w-4 h-4 shrink-0 transition-transform duration-200 ' + (openFaq === i ? 'rotate-180' : '') + ' ' + (isLight ? 'text-nike-light' : 'text-white/40')}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className={'overflow-hidden transition-all duration-300 ' + (openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
                  <p className={'px-5 pb-4 text-xs leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
