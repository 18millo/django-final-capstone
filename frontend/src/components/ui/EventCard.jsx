import { Link } from 'react-router-dom'
import { useTheme } from '../../providers/ThemeProvider'
import { mediaUrl } from '../../utils/media'

const TYPE_ICONS = {
  competition: '🏆',
  workshop: '🔧',
  seminar: '📚',
  tournament: '🥊',
  other: '📅',
}

const TYPE_COLORS = {
  competition: 'text-rose-400',
  workshop: 'text-amber-400',
  seminar: 'text-blue-400',
  tournament: 'text-red-400',
  other: 'text-emerald-400',
}

export default function EventCard({ event }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const startDate = new Date(event.start_date)
  const endDate = event.end_date ? new Date(event.end_date) : null
  const isPast = startDate < new Date()

  return (
    <Link
      to={`/events/${event.id}`}
      className={'group block rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.01] liquid-glass-card ' + (isLight ? 'bg-white border-nike-gray shadow-sm hover:shadow-md' : 'bg-nike-dark border-white/5 hover:border-white/20')}
    >
      {event.poster && (
        <div className="relative h-44 overflow-hidden">
          <img src={mediaUrl(event.poster)} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {isPast && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs tracking-widest uppercase font-bold bg-black/60 px-4 py-2 rounded-full">Past Event</span>
            </div>
          )}
        </div>
      )}
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{TYPE_ICONS[event.event_type] || '📅'}</span>
          <span className={'text-[10px] tracking-widest uppercase font-bold ' + (TYPE_COLORS[event.event_type] || 'text-nike-light')}>
            {event.event_type}
          </span>
          {event.is_registered && (
            <span className="ml-auto text-[10px] tracking-widest uppercase font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Registered</span>
          )}
        </div>

        <h3 className={'text-sm font-bold leading-snug group-hover:text-nike-red transition-colors ' + (isLight ? 'text-nike-black' : 'text-white')}>{event.title}</h3>

        <div className="space-y-1.5">
          <div className={'flex items-center gap-2 text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            {endDate && endDate.getTime() !== startDate.getTime() && (
              <> – {endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</>
            )}
          </div>
          <div className={'flex items-center gap-2 text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {event.city}, {event.country}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className={'flex items-center gap-1.5 text-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {event.participant_count || 0}{event.max_participants ? ` / ${event.max_participants}` : ''} registered
          </div>
          {event.entry_fee && (
            <span className={'text-xs font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>
              {event.currency} {event.entry_fee}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
