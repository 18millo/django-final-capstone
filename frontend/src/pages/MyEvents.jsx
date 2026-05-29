import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import EventCard from '../components/ui/EventCard'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { playClick } from '../utils/sounds'
import { IconCalendar } from '../components/Icons'


export default function MyEvents() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'

  useEffect(() => {
    api.get('/events/?mine=true')
      .then((res) => setEvents(res.data.results || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const upcoming = events.filter((e) => new Date(e.start_date) >= new Date())
  const past = events.filter((e) => new Date(e.start_date) < new Date())

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={'w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ' + (isLight ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-500/10 text-emerald-400')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div>
                <h1 className={'text-2xl font-black tracking-tight ' + textClass}>My Events</h1>
                <p className={'text-sm mt-0.5 ' + mutedClass}>Manage events you've created</p>
              </div>
            </div>
            <button
              onClick={() => { playClick(); navigate('/events/new') }}
              className="flex items-center gap-2 bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              Create Event
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : events.length === 0 ? (
          <div className={'text-center py-20 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className="text-6xl mb-4"><IconCalendar className="w-4 h-4" /></div>
            <p className={'text-lg font-bold ' + textClass}>No events yet</p>
            <p className={'text-sm mt-1 ' + mutedClass}>Create your first event to get started.</p>
            <button
              onClick={() => { playClick(); navigate('/events/new') }}
              className="mt-6 bg-nike-red text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase font-bold hover:bg-white hover:text-nike-black transition-all duration-300 shadow-lg shadow-nike-red/30"
            >
              Create Event
            </button>
          </div>
        ) : (
          <>
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <h2 className={'text-xs tracking-widest uppercase font-bold ' + mutedClass}>
                  Upcoming Events
                  <span className={'ml-2 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>({upcoming.length})</span>
                </h2>
              </div>
              {upcoming.length === 0 ? (
                <p className={'text-sm ' + mutedClass}>No upcoming events.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcoming.map((event, i) => (
                    <Reveal key={event.id} delay={i * 60}>
                      <EventCard event={event} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>

            {/* Past Events */}
            {past.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <h2 className={'text-xs tracking-widest uppercase font-bold ' + mutedClass}>
                    Past Events
                    <span className={'ml-2 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>({past.length})</span>
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {past.map((event, i) => (
                    <Reveal key={event.id} delay={i * 60}>
                      <EventCard event={event} />
                    </Reveal>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
