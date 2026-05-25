import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { mediaUrl } from '../utils/media'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

const TYPE_ICONS = {
  competition: '🏆',
  workshop: '🔧',
  seminar: '📚',
  tournament: '🥊',
  other: '📅',
}

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'

  useEffect(() => {
    api.get(`/events/${id}/`)
      .then(({ data }) => setEvent(data))
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false))
  }, [id])

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return }
    setRegistering(true)
    try {
      await api.post(`/events/${id}/register/`)
      playSuccess()
      toast('Registered for event!', 'success')
      const { data } = await api.get(`/events/${id}/`)
      setEvent(data)
    } catch (err) {
      toast(err.response?.data?.error || 'Registration failed', 'error')
    } finally {
      setRegistering(false)
    }
  }

  const handleUnregister = async () => {
    setRegistering(true)
    try {
      await api.delete(`/events/${id}/unregister/`)
      playClick()
      toast('Unregistered from event', 'info')
      const { data } = await api.get(`/events/${id}/`)
      setEvent(data)
    } catch {
      toast('Failed to unregister', 'error')
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    try {
      await api.delete(`/events/${id}/`)
      playSuccess()
      toast('Event deleted', 'success')
      navigate('/my-events')
    } catch {
      toast('Failed to delete event', 'error')
    }
  }

  if (loading) return (
    <div className={'min-h-[calc(100vh-4rem)] flex items-center justify-center ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <Spinner />
    </div>
  )

  if (!event) return null

  const startDate = new Date(event.start_date)
  const endDate = event.end_date ? new Date(event.end_date) : null
  const isPast = startDate < new Date()
  const isOwner = user && event.organizer === user.id
  const canManage = isOwner || user?.role === 'coach' || user?.role === 'gym_owner'

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/events" className={'inline-flex items-center gap-1 text-xs tracking-widest uppercase font-bold transition-colors ' + mutedClass + ' hover:text-nike-red'}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Events
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Poster */}
        {event.poster && (
          <div className="relative rounded-2xl overflow-hidden border border-white/10">
            <img src={mediaUrl(event.poster)} alt={event.title} className="w-full h-64 md:h-80 object-cover" />
            {isPast && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-sm tracking-widest uppercase font-bold bg-black/60 px-6 py-3 rounded-full">Past Event</span>
              </div>
            )}
            {!event.is_published && (
              <div className="absolute top-4 right-4 bg-nike-amber text-nike-black text-[10px] tracking-widest uppercase font-bold px-3 py-1.5 rounded-full">
                Draft
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl">{TYPE_ICONS[event.event_type] || '📅'}</span>
            <span className={'text-xs tracking-widest uppercase font-bold px-3 py-1 rounded-full border ' + (isLight ? 'border-nike-gray text-nike-light' : 'border-white/10 text-white/40')}>
              {event.event_type}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className={'text-3xl md:text-4xl font-black tracking-tight ' + textClass}>{event.title}</h1>
              <p className={'text-sm mt-2 ' + mutedClass}>Organized by {event.organizer_email}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {isOwner && (
                <>
                  <button
                    onClick={() => { playClick(); navigate(`/events/${id}/edit`) }}
                    className={'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold border border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Details */}
          <div className="md:col-span-2 space-y-6">
            {event.description && (
              <Reveal delay={50}>
                <div className={'p-6 rounded-2xl border ' + borderClass + ' ' + cardBg}>
                  <h3 className={'text-xs tracking-widest uppercase font-bold mb-3 ' + mutedClass}>About This Event</h3>
                  <p className={'text-sm leading-relaxed whitespace-pre-wrap ' + (isLight ? 'text-nike-black' : 'text-white/70')}>{event.description}</p>
                </div>
              </Reveal>
            )}

            <Reveal delay={80}>
              <div className={'p-6 rounded-2xl border ' + borderClass + ' ' + cardBg}>
                <h3 className={'text-xs tracking-widest uppercase font-bold mb-4 ' + mutedClass}>Date & Time</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 text-nike-red shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <div>
                      <p className={'text-sm font-bold ' + textClass}>
                        {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className={'text-xs ' + mutedClass}>
                        {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {endDate && endDate.getTime() !== startDate.getTime() && (
                          <> – {endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>
                        )}
                        {endDate && endDate.getTime() === startDate.getTime() && (
                          <> – {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={110}>
              <div className={'p-6 rounded-2xl border ' + borderClass + ' ' + cardBg}>
                <h3 className={'text-xs tracking-widest uppercase font-bold mb-4 ' + mutedClass}>Location</h3>
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 text-nike-red shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div>
                    <p className={'text-sm font-bold ' + textClass}>{event.location}</p>
                    <p className={'text-xs ' + mutedClass}>{event.city}, {event.country}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Reveal delay={60}>
              <div className={'p-6 rounded-2xl border ' + borderClass + ' ' + cardBg + ' sticky top-24'}>
                <h3 className={'text-xs tracking-widest uppercase font-bold mb-4 ' + mutedClass}>Registration</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={'text-xs ' + mutedClass}>Participants</span>
                    <span className={'text-sm font-bold ' + textClass}>
                      {event.participant_count || 0}
                      {event.max_participants ? ` / ${event.max_participants}` : ''}
                    </span>
                  </div>

                  {event.entry_fee && (
                    <div className="flex items-center justify-between">
                      <span className={'text-xs ' + mutedClass}>Entry Fee</span>
                      <span className={'text-sm font-bold ' + textClass}>{event.currency} {event.entry_fee}</span>
                    </div>
                  )}

                  {event.registration_deadline && (
                    <div className="flex items-center justify-between">
                      <span className={'text-xs ' + mutedClass}>Deadline</span>
                      <span className={'text-xs font-bold ' + textClass}>
                        {new Date(event.registration_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className={'border-t pt-4 ' + borderClass}>
                    {!user ? (
                      <button
                        onClick={() => { playClick(); navigate('/login') }}
                        className="w-full bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
                      >
                        Login to Register
                      </button>
                    ) : isPast ? (
                      <div className={'text-center text-xs ' + mutedClass}>This event has already taken place</div>
                    ) : event.is_registered ? (
                      <button
                        onClick={handleUnregister}
                        disabled={registering}
                        className={'w-full px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
                      >
                        {registering ? '...' : 'Unregister'}
                      </button>
                    ) : (
                      <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="w-full bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
                      >
                        {registering ? 'Registering...' : 'Register Now'}
                      </button>
                    )}
                  </div>

                  {event.is_registered && (
                    <div className={'text-center text-xs text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-xl border border-emerald-400/20'}>
                      ✓ You are registered for this event
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  )
}
