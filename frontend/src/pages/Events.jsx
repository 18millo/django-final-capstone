import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import EventCard from '../components/ui/EventCard'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { playClick } from '../utils/sounds'
import { IconCalendar } from '../components/Icons'


const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'competition', label: 'Competitions' },
  { value: 'tournament', label: 'Tournaments' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'seminar', label: 'Seminars' },
  { value: 'other', label: 'Other' },
]

export default function Events() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'

  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventType, setEventType] = useState(searchParams.get('type') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [upcoming, setUpcoming] = useState(searchParams.get('upcoming') !== 'false')

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'

  const fetchEvents = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (eventType) params.set('type', eventType)
    if (city) params.set('city', city)
    if (upcoming) params.set('upcoming', 'true')
    setSearchParams(params, { replace: true })

    api.get(`/events/?${params.toString()}`)
      .then((res) => setEvents(res.data.results || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEvents()
  }, [eventType, city, upcoming])

  const canManage = user && ['coach', 'gym_owner'].includes(user.role)

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={'w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ' + (isLight ? 'bg-blue-500/20 text-blue-500' : 'bg-blue-500/10 text-blue-400')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div>
                <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Events</h1>
                <p className={'text-sm mt-0.5 ' + mutedClass}>Discover combat sports events near you</p>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => { playClick(); navigate('/events/new') }}
                className="flex items-center gap-2 bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                Create Event
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <Reveal delay={50}>
          <div className={'flex flex-wrap items-center gap-3 p-4 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className={'text-xs tracking-widest uppercase font-bold ' + mutedClass}>Filter</div>
            <select
              value={eventType}
              onChange={(e) => { playClick(); setEventType(e.target.value) }}
              className={'text-xs px-3 py-2 rounded-xl border bg-transparent outline-none ' + borderClass + ' ' + textClass}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="City..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={'text-xs px-3 py-2 rounded-xl border bg-transparent outline-none w-32 ' + borderClass + ' ' + textClass}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={upcoming}
                onChange={(e) => setUpcoming(e.target.checked)}
                className="w-3.5 h-3.5 accent-nike-red"
              />
              <span className={'text-xs ' + textClass}>Upcoming only</span>
            </label>
          </div>
        </Reveal>

        {/* Events grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : events.length === 0 ? (
          <div className={'text-center py-20 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className="text-6xl mb-4"><IconCalendar className="w-4 h-4" /></div>
            <p className={'text-lg font-bold ' + textClass}>No events found</p>
            <p className={'text-sm mt-1 ' + mutedClass}>Try adjusting your filters or check back later.</p>
            {canManage && (
              <button
                onClick={() => { playClick(); navigate('/events/new') }}
                className="mt-6 bg-nike-red text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase font-bold hover:bg-white hover:text-nike-black transition-all duration-300 shadow-lg shadow-nike-red/30"
              >
                Create the first event
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event, i) => (
              <Reveal key={event.id} delay={i * 60}>
                <EventCard event={event} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
