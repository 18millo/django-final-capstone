import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { mediaUrl } from '../utils/media'
import { playClick } from '../utils/sounds'
import { toast } from '../components/ui/Toast'
import { ROLE_ICONS, ROLE_LABELS, ROLE_COLORS } from '../utils/roles'

const BG = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1920&q=80'

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

export default function PublicProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animatingId, setAnimatingId] = useState(null)
  const isOwn = user?.id === Number(id)

  useEffect(() => {
    const endpoint = isOwn ? '/auth/me/' : '/auth/users/' + id + '/'
    api.get(endpoint)
      .then((res) => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, isOwn])

  const toggleFollow = async () => {
    if (!profile) return
    playClick()
    setAnimatingId(profile.id)
    setTimeout(() => setAnimatingId(null), 300)
    const endpoint = profile.is_following
      ? '/auth/users/' + profile.id + '/unfollow/'
      : '/auth/users/' + profile.id + '/follow/'
    try {
      await api.post(endpoint)
      setProfile((prev) => ({
        ...prev,
        is_following: !prev.is_following,
        follower_count: prev.follower_count + (prev.is_following ? -1 : 1),
      }))
    } catch {}
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!profile) return <div className="flex justify-center py-20 text-white/40">User not found.</div>

  const p = profile.profile || {}
  const rc = ROLE_COLORS[profile.role] || ROLE_COLORS.athlete

  const shareProfile = () => {
    playClick()
    navigator.clipboard.writeText(window.location.origin + '/profile/' + profile.id)
    toast('Profile link copied to clipboard!')
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <Reveal>
          <div className={'rounded-2xl p-8 border backdrop-blur-md ' + (isLight ? 'bg-white/90 border-nike-gray' : 'bg-nike-dark/80 border-white/5')}>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 shrink-0" style={{ '--tw-ring-color': 'var(--color-nike-gray)' }}>
                {p.avatar ? (
                  <img src={mediaUrl(p.avatar)} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: 'var(--color-nike-light)' }}>👤</div>
                )}
              </div>
              <div className="flex-1">
                <p className={'font-bold text-xl ' + (isLight ? 'text-nike-black' : 'text-white')}>{profile.username || 'Anonymous'}</p>
                <div className={'inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md text-xs tracking-widest uppercase font-bold border ' + rc.bg + ' ' + rc.text + ' ' + rc.border}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d={ROLE_ICONS[profile.role] || ROLE_ICONS.athlete} />
                  </svg>
                  {ROLE_LABELS[profile.role] || profile.role?.replace('_', ' ')}
                </div>
                <div className={'flex gap-4 mt-2 text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                  <span><strong className={'font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{profile.follower_count || 0}</strong> followers</span>
                  <span><strong className={'font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{profile.following_count || 0}</strong> following</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {!isOwn && (
                  <button
                    onClick={toggleFollow}
                    className={'shrink-0 text-xs tracking-widest uppercase font-bold px-6 py-3 rounded-full transition-all duration-300 ' + (profile.is_following
                      ? (isLight ? 'bg-nike-gray text-nike-light hover:bg-nike-red hover:text-white' : 'bg-white/10 text-white/60 hover:bg-nike-red hover:text-white')
                      : 'bg-nike-red text-white hover:bg-white hover:text-nike-black'
                    ) + ' ' + (animatingId === profile.id ? 'animate-followPop' : '')}
                  >
                    {profile.is_following ? 'Following' : 'Follow'}
                  </button>
                )}
                <button
                  onClick={shareProfile}
                  className={'shrink-0 text-xs tracking-widest uppercase font-bold px-6 py-3 rounded-full border transition-all duration-300 ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/30' : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white')}
                >
                  Share
                </button>
                {isOwn && (
                  <Link
                    to="/settings"
                    className="shrink-0 text-xs tracking-widest uppercase font-bold px-6 py-3 rounded-full bg-nike-red text-white hover:bg-white hover:text-nike-black transition-all duration-300 text-center"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>

            {p.bio && (
              <div className={'mb-6 pb-6 border-b ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
                <p className={'text-sm leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/60')}>{p.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <p className={'text-xs tracking-widest uppercase font-bold mb-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Weight Class</p>
                <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{WEIGHT_LABELS[p.weight_class] || p.weight_class?.replace('_', ' ') || '—'}</p>
              </div>
              <div>
                <p className={'text-xs tracking-widest uppercase font-bold mb-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Stance</p>
                <p className={'text-sm font-bold capitalize ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.stance || '—'}</p>
              </div>
              <div>
                <p className={'text-xs tracking-widest uppercase font-bold mb-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Height</p>
                <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.height_ft ? p.height_ft + "'" + (p.height_in || 0) + '"' : '—'}</p>
              </div>
              <div>
                <p className={'text-xs tracking-widest uppercase font-bold mb-1 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Reach</p>
                <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{p.reach_in ? p.reach_in + '"' : '—'}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
