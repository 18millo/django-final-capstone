import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { IconCheck, IconX } from '../components/Icons'


export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')
  const [eventId, setEventId] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [reference, setReference] = useState('')

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'

  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref') || sessionStorage.getItem('paystack_ref') || ''
    const storedEventId = sessionStorage.getItem('paystack_event_id') || ''

    setReference(ref)

    if (!ref) {
      setStatus('error')
      setMessage('No payment reference found.')
      return
    }

    api.get(`/payments/paystack/verify/?reference=${ref}`)
      .then(({ data }) => {
        if (data.status === 'success') {
          setStatus('success')
          setMessage('Payment successful!')
          if (data.metadata?.event_id) {
            setEventId(data.metadata.event_id)
          } else if (storedEventId) {
            setEventId(storedEventId)
          }
          if (data.metadata?.order_id) {
            setOrderId(data.metadata.order_id)
          }
        } else {
          setStatus('error')
          setMessage('Payment verification failed.')
        }
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Payment verification failed.')
      })
      .finally(() => {
        sessionStorage.removeItem('paystack_ref')
        sessionStorage.removeItem('paystack_event_id')
      })
  }, [])

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center ${isLight ? 'bg-nike-gray/20' : 'bg-nike-black'}`}>
      <div className={`max-w-md w-full mx-6 p-8 rounded-2xl border text-center ${borderClass} ${cardBg}`}>
        {status === 'verifying' && (
          <>
            <Spinner />
            <p className={`mt-4 text-sm ${mutedClass}`}>Verifying your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className={`text-xl font-black tracking-tight mb-2 ${textClass}`}>Payment Successful!</h2>
            <p className={`text-sm mb-2 ${mutedClass}`}>{message}</p>
            <p className={`text-xs mb-6 ${mutedClass}`}>Reference: {reference}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {eventId ? (
                <Link
                  to={`/events/${eventId}`}
                  className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all shadow-lg shadow-nike-red/30"
                >
                  View Event
                </Link>
              ) : orderId ? (
                <Link
                  to={`/orders/${orderId}`}
                  className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all shadow-lg shadow-nike-red/30"
                >
                  View Order
                </Link>
              ) : (
                <Link
                  to="/events"
                  className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all shadow-lg shadow-nike-red/30"
                >
                  Browse Events
                </Link>
              )}
              <Link
                to="/orders"
                className={`px-6 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ${isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10'}`}
              >
                My Orders
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconX className="w-8 h-8 text-red-400" />
            </div>
            <h2 className={`text-xl font-black tracking-tight mb-2 ${textClass}`}>Payment Failed</h2>
            <p className={`text-sm mb-6 ${mutedClass}`}>{message}</p>
            <Link
              to="/events"
              className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all shadow-lg shadow-nike-red/30"
            >
              Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
