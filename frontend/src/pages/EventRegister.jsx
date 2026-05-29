import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import { mediaUrl } from '../utils/media'
import { toast } from '../components/ui/Toast'
import Spinner from '../components/ui/Spinner'
import { IconTicket, IconCreditCard, IconCheck, IconCalendar } from '../components/Icons'


const T_SHIRTS = [
  { value: '', label: 'Select size' },
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: '2XL', label: '2XL' },
  { value: '3XL', label: '3XL' },
]


export default function EventRegister() {
  const { id } = useParams()
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [participant, setParticipant] = useState(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    t_shirt_size: '',
    dietary_requirements: '',
    emergency_contact: '',
    emergency_phone: '',
  })

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'
  const inputClass = `w-full px-4 py-3 rounded-xl text-sm outline-none border bg-transparent transition-all focus:border-nike-red ${borderClass} ${textClass}`
  const labelClass = `block text-xs tracking-widest uppercase font-bold mb-1.5 ${mutedClass}`

  useEffect(() => {
    api.get(`/events/${id}/`)
      .then(({ data }) => {
        setEvent(data)
        if (user) {
          setForm(prev => ({
            ...prev,
            name: user.display_name || '',
            email: user.email || '',
            phone: user.profile?.phone || '',
          }))
        }
      })
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false))
  }, [id, user])

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!form.name.trim()) { toast('Full name is required', 'error'); return false }
    if (!form.email.trim()) { toast('Email is required', 'error'); return false }
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) { toast('Invalid email format', 'error'); return false }
    if (!form.phone.trim()) { toast('Phone number is required', 'error'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!validateForm()) return

    setSubmitting(true)

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      t_shirt_size: form.t_shirt_size,
      dietary_requirements: form.dietary_requirements.trim(),
      emergency_contact: form.emergency_contact.trim(),
      emergency_phone: form.emergency_phone.trim(),
    }

    try {
      if (isPaid) {
        const regRes = await api.post(`/events/${id}/register/`, {
          ...payload,
          method: 'paystack',
        })
        const regData = regRes.data

        if (regData.payment_required) {
          const payRes = await api.post(`/events/${id}/payment/`, {
            method: 'paystack',
          })
          const { authorization_url, reference } = payRes.data
          sessionStorage.setItem('paystack_ref', reference)
          sessionStorage.setItem('paystack_event_id', id)
          window.location.href = authorization_url
          return
        }
        setCompleted(true)
        toast('Registration successful!', 'success')
        return
      }

      const regRes = await api.post(`/events/${id}/register/`, payload)
      const { data: updatedEvent } = await api.get(`/events/${id}/`)
      const myReg = updatedEvent.participants?.find(p => p.user === user?.id)
      setParticipant(myReg || updatedEvent)
      setCompleted(true)
      toast('Registration successful! Check your email for the ticket.', 'success')
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed'
      toast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={'min-h-[calc(100vh-4rem)] flex items-center justify-center ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
        <Spinner />
      </div>
    )
  }

  if (!event) return null

  const isPast = new Date(event.start_date) < new Date()
  const isPaid = event.entry_fee && event.entry_fee > 0

  if (completed) {
    return (
      <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <div className={'p-8 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <IconCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className={'text-2xl font-black tracking-tight mb-2 ' + textClass}>Registration Confirmed!</h2>
            <p className={'text-sm mb-6 ' + mutedClass}>You are registered for {event.title}</p>

            {participant?.qr_code && (
              <div className="mb-6">
                <img src={mediaUrl(participant.qr_code)} alt="Ticket QR" className="w-48 h-48 mx-auto rounded-xl" />
              </div>
            )}

            {participant?.ticket_number && (
              <div className={'inline-flex items-center gap-2 px-4 py-2 rounded-xl border mb-6 ' + borderClass}>
                <IconTicket className="w-4 h-4 text-nike-red" />
                <span className={'text-sm font-mono font-bold ' + textClass}>{participant.ticket_number}</span>
              </div>
            )}

            <p className={'text-xs mb-8 ' + mutedClass}>
              A receipt and QR code have been sent to <strong>{form.email}</strong>.
              Show the QR code at the event entrance.
            </p>

            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                to={`/events/${id}`}
                className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
              >
                View Event
              </Link>
              <Link
                to="/events"
                className={'px-6 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
              >
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to={`/events/${id}`} className={'inline-flex items-center gap-1 text-xs tracking-widest uppercase font-bold transition-colors ' + mutedClass + ' hover:text-nike-red'}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Event
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className={'p-6 rounded-2xl border sticky top-24 ' + borderClass + ' ' + cardBg}>
              <h3 className={'text-xs tracking-widest uppercase font-bold mb-4 ' + mutedClass}>Event Summary</h3>

              {event.poster && (
                <img src={mediaUrl(event.poster)} alt={event.title} className="w-full h-36 object-cover rounded-xl mb-4" />
              )}

              <h4 className={'text-lg font-black tracking-tight mb-2 ' + textClass}>{event.title}</h4>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <IconCalendar className="w-3.5 h-3.5 text-nike-red shrink-0" />
                  <span className={mutedClass}>
                    {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-nike-red shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span className={mutedClass}>{event.location}, {event.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconTicket className="w-3.5 h-3.5 text-nike-red shrink-0" />
                  <span className={mutedClass}>
                    {event.tickets_available !== null ? `${event.tickets_available} tickets left` : 'Unlimited tickets'}
                  </span>
                </div>
              </div>

              {isPaid && (
                <div className={'mt-5 pt-4 border-t ' + borderClass}>
                  <div className="flex items-center justify-between">
                    <span className={'text-xs tracking-widest uppercase font-bold ' + mutedClass}>Entry Fee</span>
                    <span className={'text-xl font-black ' + textClass}>
                      {event.currency} {event.entry_fee}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            {isPast ? (
              <div className={'p-8 rounded-2xl border text-center ' + borderClass + ' ' + cardBg}>
                <p className={'text-sm ' + mutedClass}>This event has already taken place.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={'p-6 rounded-2xl border ' + borderClass + ' ' + cardBg}>
                <h2 className={'text-xl font-black tracking-tight mb-6 ' + textClass}>Attendee Details</h2>

                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={inputClass}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={inputClass}
                      placeholder="your@email.com"
                      required
                    />
                    <p className={'text-[10px] mt-1 ' + mutedClass}>Receipt and QR code will be sent here</p>
                  </div>

                  <div>
                    <label className={labelClass}>Phone *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className={inputClass}
                      placeholder="+254 7XX XXX XXX"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>T-Shirt Size</label>
                    <select
                      value={form.t_shirt_size}
                      onChange={(e) => updateField('t_shirt_size', e.target.value)}
                      className={inputClass}
                    >
                      {T_SHIRTS.map(s => (
                        <option key={s.value} value={s.value} className={isLight ? 'text-nike-black bg-white' : 'text-white bg-nike-black'}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Dietary Requirements</label>
                    <textarea
                      value={form.dietary_requirements}
                      onChange={(e) => updateField('dietary_requirements', e.target.value)}
                      className={inputClass + ' resize-none'}
                      rows={2}
                      placeholder="Any dietary restrictions or allergies"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Emergency Contact</label>
                      <input
                        type="text"
                        value={form.emergency_contact}
                        onChange={(e) => updateField('emergency_contact', e.target.value)}
                        className={inputClass}
                        placeholder="Contact name"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Emergency Phone</label>
                      <input
                        type="tel"
                        value={form.emergency_phone}
                        onChange={(e) => updateField('emergency_phone', e.target.value)}
                        className={inputClass}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                  <p className={'text-[10px] -mt-3 ' + mutedClass}>Recommended in case of emergency at the event</p>

                  {isPaid && (
                    <>
                      <div className={'border-t pt-6 ' + borderClass}>
                        <h3 className={'text-lg font-black tracking-tight mb-4 ' + textClass}>Payment</h3>
                        <p className={'text-sm mb-4 ' + mutedClass}>
                          Entry fee: <strong>{event.currency} {event.entry_fee}</strong>
                        </p>
                        <div className={'p-4 rounded-xl border border-dashed ' + borderClass + ' bg-nike-red/5'}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-nike-red/10 rounded-full flex items-center justify-center shrink-0">
                              <IconCreditCard className="w-5 h-5 text-nike-red" />
                            </div>
                            <div>
                              <p className={'text-sm font-bold ' + textClass}>Pay with Paystack</p>
                              <p className={'text-[10px] ' + mutedClass}>Secured by Paystack</p>
                            </div>
                          </div>
                          <p className={'text-xs ' + mutedClass}>
                            You will be redirected to Paystack's secure checkout to complete your payment using your card, mobile money, or bank transfer.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-nike-red text-white hover:bg-white hover:text-nike-black px-6 py-4 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : isPaid ? `Pay ${event.currency} ${event.entry_fee} & Register` : 'Register Now'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
