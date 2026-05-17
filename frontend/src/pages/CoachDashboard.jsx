import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { playClick } from '../utils/sounds'

export default function CoachDashboard() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'

  useEffect(() => {
    setLoading(true)
    api.get('/auth/me/followers/')
      .then((res) => setFollowers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className={'w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ' + (isLight ? 'bg-nike-amber/20 text-nike-amber' : 'bg-nike-amber/10 text-nike-amber')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div>
              <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Coach Dashboard</h1>
              <p className={'text-sm mt-0.5 ' + mutedClass}>Connect with your athletes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : followers.length === 0 ? (
          <div className={'text-center py-20 ' + mutedClass}>
            <div className="text-6xl mb-4">🏋️</div>
            <p className={'text-lg font-bold ' + textClass}>No athletes yet</p>
            <p className="text-sm mt-1">When athletes follow you, they'll appear here.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <p className={'text-xs mb-2 ' + mutedClass}>{followers.length} athlete{followers.length !== 1 ? 's' : ''} following you</p>
            {followers.map((f) => (
              <div
                key={f.id}
                className={'flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.002] cursor-pointer ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}
                onClick={() => { playClick(); navigate('/messages?user=' + f.id) }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-lg font-bold" style={!isLight ? { color: 'var(--color-nike-light)' } : {}}>
                  {f.profile?.avatar ? (
                    <img src={f.profile.avatar} alt={''} className="w-full h-full object-cover" />
                  ) : (
                    (f.display_name || f.username || '?')[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={'text-sm font-bold truncate ' + textClass}>{f.display_name || f.username}</p>
                  {f.follower_count !== undefined && <p className={'text-xs mt-0.5 ' + mutedClass}>{f.follower_count} follower{f.follower_count !== 1 ? 's' : ''}</p>}
                </div>
                <div className={'text-xs font-bold px-4 py-2 rounded-xl border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-red hover:text-white hover:border-nike-red' : 'border-white/10 text-white/40 hover:bg-nike-red hover:text-white hover:border-nike-red')}>
                  Message
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
