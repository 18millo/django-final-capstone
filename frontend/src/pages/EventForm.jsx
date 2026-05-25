import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

const EVENT_TYPES = [
  { value: 'competition', label: 'Competition' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'other', label: 'Other' },
]

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const isEditing = Boolean(id)

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'competition',
    location: '',
    city: '',
    country: 'Kenya',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    max_participants: '',
    entry_fee: '',
    currency: 'KES',
    is_published: true,
    poster: null,
  })
  const [posterPreview, setPosterPreview] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'

  useEffect(() => {
    if (!isEditing) return
    api.get(`/events/${id}/`)
      .then(({ data }) => {
        setForm({
          title: data.title || '',
          description: data.description || '',
          event_type: data.event_type || 'competition',
          location: data.location || '',
          city: data.city || '',
          country: data.country || 'Kenya',
          start_date: data.start_date ? data.start_date.slice(0, 16) : '',
          end_date: data.end_date ? data.end_date.slice(0, 16) : '',
          registration_deadline: data.registration_deadline ? data.registration_deadline.slice(0, 16) : '',
          max_participants: data.max_participants || '',
          entry_fee: data.entry_fee || '',
          currency: data.currency || 'KES',
          is_published: data.is_published,
          poster: null,
        })
        if (data.poster) setPosterPreview(data.poster)
      })
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') {
      const file = files[0]
      if (file) {
        setForm((prev) => ({ ...prev, poster: file }))
        setPosterPreview(URL.createObjectURL(file))
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('description', form.description)
    fd.append('event_type', form.event_type)
    fd.append('location', form.location)
    fd.append('city', form.city)
    fd.append('country', form.country)
    fd.append('start_date', form.start_date ? new Date(form.start_date).toISOString() : '')
    fd.append('end_date', form.end_date ? new Date(form.end_date).toISOString() : '')
    fd.append('is_published', form.is_published)
    if (form.registration_deadline) {
      fd.append('registration_deadline', new Date(form.registration_deadline).toISOString())
    }
    if (form.max_participants) fd.append('max_participants', form.max_participants)
    if (form.entry_fee) fd.append('entry_fee', form.entry_fee)
    fd.append('currency', form.currency)
    if (form.poster instanceof File) fd.append('poster', form.poster)

    try {
      if (isEditing) {
        await api.put(`/events/${id}/`, fd)
      } else {
        await api.post('/events/', fd)
      }
      playSuccess()
      toast(isEditing ? 'Event updated!' : 'Event created!', 'success')
      navigate(isEditing ? `/events/${id}` : '/events')
    } catch (err) {
      const data = err.response?.data
      const msg = data?.detail || Object.values(data || {}).flat().join(', ') || 'Failed to save event'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className={'min-h-[calc(100vh-4rem)] flex items-center justify-center ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <Spinner />
    </div>
  )

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-3xl mx-auto px-6 py-6">
          <h1 className={'text-2xl font-black tracking-tight ' + textClass}>{isEditing ? 'Edit Event' : 'Create Event'}</h1>
          <p className={'text-sm mt-0.5 ' + mutedClass}>Fill in the details below</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className={'space-y-6 p-6 md:p-8 rounded-2xl border ' + borderClass + ' liquid-glass-card'}>
          {error && (
            <div className="bg-nike-red/10 border border-nike-red/30 text-nike-red text-xs px-4 py-3 rounded-xl">{error}</div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
                placeholder="Event title"
              />
            </div>

            <div className="md:col-span-2">
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red resize-none ' + borderClass + ' ' + textClass}
                placeholder="Describe your event..."
              />
            </div>

            <div>
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Event Type *</label>
              <select
                name="event_type"
                value={form.event_type}
                onChange={handleChange}
                required
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Currency</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Entry Fee</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="entry_fee"
                value={form.entry_fee}
                onChange={handleChange}
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Max Participants</label>
              <input
                type="number"
                min="1"
                name="max_participants"
                value={form.max_participants}
                onChange={handleChange}
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
                placeholder="Venue name or address"
              />
            </div>

            <div>
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
                placeholder="Nairobi"
              />
            </div>

            <div>
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Country</label>
              <input
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
              />
            </div>

            <div>
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Start Date *</label>
              <input
                type="datetime-local"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                required
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
              />
            </div>

            <div>
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>End Date</label>
              <input
                type="datetime-local"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Registration Deadline</label>
              <input
                type="datetime-local"
                name="registration_deadline"
                value={form.registration_deadline}
                onChange={handleChange}
                className={'w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-sm transition-colors focus:border-nike-red ' + borderClass + ' ' + textClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + mutedClass}>Poster Image</label>
              <div className="flex items-center gap-4">
                <label className={'flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:border-nike-red ' + borderClass}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-nike-red"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span className={'text-xs ' + textClass}>Choose Image</span>
                  <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
                </label>
                {posterPreview && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                    <img src={posterPreview.startsWith('blob:') || posterPreview.startsWith('http') ? posterPreview : `http://localhost:8000${posterPreview}`} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                name="is_published"
                checked={form.is_published}
                onChange={handleChange}
                id="is_published"
                className="w-3.5 h-3.5 accent-nike-red"
              />
              <label htmlFor="is_published" className={'text-xs cursor-pointer ' + textClass}>Publish immediately</label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-8 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={() => { playClick(); navigate(-1) }}
              className={'px-6 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
