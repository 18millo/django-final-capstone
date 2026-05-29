import { Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { mediaUrl } from '../utils/media'
import { toast } from '../components/ui/Toast'
import { playClick } from '../utils/sounds'
import { ROLE_ICONS, ROLE_LABELS, ROLE_COLORS } from '../utils/roles'
import { IconUser } from '../components/Icons'


const WEIGHT_LABELS = {
  strawweight: 'Strawweight (115 lbs / 52 kg)',
  flyweight: 'Flyweight (125 lbs / 57 kg)',
  bantamweight: 'Bantamweight (135 lbs / 61 kg)',
  featherweight: 'Featherweight (145 lbs / 66 kg)',
  lightweight: 'Lightweight (155 lbs / 70 kg)',
  welterweight: 'Welterweight (170 lbs / 77 kg)',
  middleweight: 'Middleweight (185 lbs / 84 kg)',
  light_heavyweight: 'Light Heavyweight (205 lbs / 93 kg)',
  heavyweight: 'Heavyweight (265 lbs / 120 kg)',
}

const BG = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1920&q=80'

function memberSince(dateStr) {
  if (!dateStr) return null
  const created = new Date(dateStr)
  const now = new Date()
  const diffMs = now - created
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffYears >= 1) {
    const remMonths = diffMonths % 12
    return diffYears + ' year' + (diffYears > 1 ? 's' : '') + (remMonths ? ', ' + remMonths + ' month' + (remMonths > 1 ? 's' : '') : '')
  }
  if (diffMonths >= 1) return diffMonths + ' month' + (diffMonths > 1 ? 's' : '')
  if (diffDays >= 1) return diffDays + ' day' + (diffDays > 1 ? 's' : '')
  return 'Just joined'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ProfileView() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  if (!user) return <div className="flex justify-center py-20"><Spinner /></div>

  const p = user.profile || {}
  const rc = ROLE_COLORS[user.role] || ROLE_COLORS.athlete

  const shareProfile = () => {
    playClick()
    navigator.clipboard.writeText(window.location.origin + '/profile/' + (user.id || ''))
    toast('Profile link copied to clipboard!')
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <Reveal>
          <div className="mb-10">
            <div className="w-12 h-12 bg-nike-red/20 rounded-2xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-nike-red"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h1 className="text-4xl font-black tracking-tight">PROFILE</h1>
            <p className={'text-sm mt-2 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Your fighter profile.</p>
          </div>
        </Reveal>

        <div className="space-y-8">
          <Reveal delay={100}>
            <div className={'rounded-2xl p-8 border backdrop-blur-md ' + (isLight ? 'bg-white/90 border-nike-gray' : '')} style={!isLight ? { backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' } : {}}>
              <div className="flex items-center gap-6 mb-8">
                <div className={'w-20 h-20 rounded-full overflow-hidden ring-2 ' + (isLight ? 'ring-nike-gray' : 'ring-white/10')} style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                  {p.avatar ? (
                    <img src={mediaUrl(p.avatar)} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: 'var(--color-nike-light)' }}><IconUser className="w-4 h-4" /></div>
                  )}
                </div>
                <div>
                  <p className={'font-bold text-lg ' + (isLight ? 'text-nike-black' : 'text-white')}>{user.username || user.email}</p>
                  <div className={'inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md text-xs tracking-widest uppercase font-bold border ' + rc.bg + ' ' + rc.text + ' ' + rc.border}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d={ROLE_ICONS[user.role] || ROLE_ICONS.athlete} />
                    </svg>
                    {ROLE_LABELS[user.role] || user.role?.replace('_', ' ')}
                  </div>
                  <p className={'text-xs mt-1.5 ' + (isLight ? 'text-nike-light' : 'text-white/20')}>{user.email}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <span className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Username</span>
                  <p className={'mt-1 ' + (isLight ? 'text-nike-black' : 'text-white')}>{user.username || '—'}</p>
                </div>
                <div>
                  <span className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Phone</span>
                  <p className={'mt-1 ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.phone || '—'}</p>
                </div>
              </div>

              <div className="mt-6">
                <span className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Bio</span>
                <p className={'mt-1 leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/60')}>{p.bio || 'No bio yet.'}</p>
              </div>

              <div className={'mt-6 pt-6 border-t flex items-center gap-3 ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
                <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + (isLight ? 'bg-nike-red/5' : 'bg-nike-red/10')}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-nike-red"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p className={'text-xs font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Member since {formatDate(user.created_at)}</p>
                  <p className={'text-xs mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>You've been a member for {memberSince(user.created_at)}</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className={'rounded-2xl p-8 border backdrop-blur-md ' + (isLight ? 'bg-white/90 border-nike-gray' : '')} style={!isLight ? { backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' } : {}}>
              <h3 className={'font-bold text-sm tracking-widest uppercase mb-6 ' + (isLight ? 'text-nike-light' : 'text-white/60')}>Fighter Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Weight Class</span>
                  <p className={'mt-1 ' + (isLight ? 'text-nike-black' : 'text-white')}>{WEIGHT_LABELS[p.weight_class] || p.weight_class?.replace('_', ' ') || '—'}</p>
                </div>
                <div>
                  <span className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Stance</span>
                  <p className={'mt-1 capitalize ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.stance || '—'}</p>
                </div>
                <div>
                  <span className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Height</span>
                  <p className={'mt-1 ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.height_ft ? p.height_ft + "'" + (p.height_in || 0) + '"' : '—'}</p>
                </div>
                <div>
                  <span className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Reach</span>
                  <p className={'mt-1 ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.reach_in ? p.reach_in + '"' : '—'}</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={shareProfile}
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/50 text-white/60 hover:text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share Profile
              </button>
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300"
              >
                Edit Profile <span>→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
