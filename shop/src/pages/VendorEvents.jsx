import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../providers/AuthProvider'
import { IconCalendar } from '../components/Icons'

const TYPE_ICONS = {
  competition: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  workshop: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  seminar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  tournament: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  other: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
}

export default function VendorEvents() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', event_type: 'competition', location: '', city: '', country: 'Kenya', start_date: '', end_date: '', max_participants: '', entry_fee: '', currency: 'KES', poster: null })
  const [posterPreview, setPosterPreview] = useState(null)

  useEffect(() => {
    api.get('/events/?mine=true')
      .then((res) => setEvents(res.data.results || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const { name, value, type, files } = e.target
    if (type === 'file') {
      const file = files[0]
      if (file) {
        setForm((prev) => ({ ...prev, poster: file }))
        setPosterPreview(URL.createObjectURL(file))
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (v !== null && v !== '') fd.append(k, v)
    })
    if (form.start_date) fd.set('start_date', new Date(form.start_date).toISOString())
    if (form.end_date) fd.set('end_date', new Date(form.end_date).toISOString())
    fd.set('is_published', 'true')
    try {
      const { data } = await api.post('/events/', fd)
      setEvents((prev) => [data, ...prev])
      setShowForm(false)
      setForm({ title: '', description: '', event_type: 'competition', location: '', city: '', country: 'Kenya', start_date: '', end_date: '', max_participants: '', entry_fee: '', currency: 'KES', poster: null })
      setPosterPreview(null)
    } catch (err) {
      const data = err.response?.data
      setError(Object.values(data || {}).flat().join(', ') || 'Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    try {
      await api.delete(`/events/${id}/`)
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch {
      setError('Failed to delete event')
    }
  }

  const startDate = (e) => new Date(e.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>My Events</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-lg text-xs tracking-wider transition-colors">
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="liquid-glass-card rounded-2xl p-6 mb-6 space-y-4 animate-slideUp" style={{ border: '1px solid var(--theme-border)' }}>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Event title *" required className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={3} className="w-full rounded-lg px-4 py-2.5 text-sm resize-none" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
          <div className="grid grid-cols-2 gap-3">
            <select name="event_type" value={form.event_type} onChange={handleChange} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}>
              <option value="competition">Competition</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="tournament">Tournament</option>
              <option value="other">Other</option>
            </select>
            <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            <input name="location" value={form.location} onChange={handleChange} placeholder="Venue/Location" className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            <input name="entry_fee" value={form.entry_fee} onChange={handleChange} type="number" step="0.01" placeholder="Entry fee" className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            <input name="start_date" value={form.start_date} onChange={handleChange} type="datetime-local" required className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            <input name="end_date" value={form.end_date} onChange={handleChange} type="datetime-local" className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            <input name="max_participants" value={form.max_participants} onChange={handleChange} type="number" placeholder="Max participants" className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>Poster:</span>
              <input type="file" accept="image/*" onChange={handleChange} className="text-xs" />
            </label>
          </div>
          {posterPreview && <img src={posterPreview} alt="" className="w-32 h-20 object-cover rounded-lg" />}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm tracking-wider transition-colors">
              {saving ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm py-12 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 liquid-glass-card rounded-2xl" style={{ border: '1px solid var(--theme-border)' }}>
          <div className="mb-3"><IconCalendar size={48} /></div>
          <p className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>No events yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>Create your first event to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="liquid-glass-card rounded-2xl p-5 flex items-center justify-between gap-4" style={{ border: '1px solid var(--theme-border)' }}>
              <div className="flex items-center gap-4 min-w-0">
                <span className="inline-flex items-center justify-center w-8 h-8">{TYPE_ICONS[event.event_type]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--theme-text)' }}>{event.title}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>{startDate(event)} — {event.city}, {event.country} · {event.participant_count || 0} registered</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => navigate(`/events/${event.id}`)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors" style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' }}>View</button>
                <button onClick={() => handleDelete(event.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-nike-red hover:bg-nike-red/10 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
