import { useState } from 'react'
import { useTheme } from '../providers/ThemeProvider'
import { motion } from 'framer-motion'
import api from '../utils/api'

export default function Newsletter() {
  const { isLight } = useTheme()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleSubscribe = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const { data } = await api.post('/subscribe/', { email })
      setStatus('success')
      setMessage('You are subscribed!')
      setEmail('')
    } catch (err) {
      const errData = err.response?.data
      setStatus('error')
      setMessage(errData?.email?.[0] || errData?.error || 'Subscription failed')
    }
  }

  return (
    <div className={'min-h-screen ' + (isLight ? 'bg-nike-offwhite' : '')} style={!isLight ? { backgroundColor: 'var(--color-nike-dark)' } : {}}>
      <div className="max-w-xl mx-auto px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={'rounded-2xl p-8 border ' + (isLight ? 'bg-white border-nike-gray' : '')}
          style={!isLight ? { backgroundColor: 'var(--color-nike-card)', borderColor: 'var(--color-nike-gray)' } : {}}
        >
          <h1 className="text-2xl font-black tracking-tight mb-2" style={{ color: 'var(--color-nike-white)' }}>
            NEWSLETTER
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-nike-light)' }}>
            Get combat sports news, event announcements, and exclusive deals delivered to your inbox.
          </p>

          {status === 'success' ? (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-4">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={'w-full px-4 py-3 rounded-xl text-sm tracking-wider outline-none border transition-all focus:ring-2 focus:ring-nike-red ' + (isLight ? 'bg-nike-offwhite border-nike-gray text-black' : '')}
                style={!isLight ? { backgroundColor: 'var(--color-nike-dark)', borderColor: 'var(--color-nike-gray)', color: 'var(--color-nike-white)' } : {}}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase bg-nike-red text-white hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {status === 'loading' ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
              </button>
              {status === 'error' && (
                <p className="text-red-400 text-xs">{message}</p>
              )}
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
