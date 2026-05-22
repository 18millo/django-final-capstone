import { useState } from 'react'
import { useTheme } from '../../providers/ThemeProvider'
import { toast } from './Toast'
import { playClick } from '../../utils/sounds'
import api from '../../utils/api'

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'violence', label: 'Violence or Threats' },
  { value: 'nudity', label: 'Nudity or Sexual Content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
]

export default function ReportModal({ isOpen, onClose, targetType, targetId }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!reason) {
      toast('Please select a reason', 'error')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/reports/', { reason, description, target_type: targetType, target_id: targetId })
      toast('Report submitted. Our team will review it.', 'success')
      playClick()
      setReason('')
      setDescription('')
      onClose()
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to submit report', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={'relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden liquid-glass-card'}>
        <div className={'px-6 py-5 border-b flex items-center justify-between ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
          <div>
            <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Report Content</p>
            <p className={'text-xs mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>This goes against our community guidelines</p>
          </div>
          <button onClick={() => { playClick(); onClose() }} className={'w-8 h-8 rounded-xl flex items-center justify-center transition-colors ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={'block text-xs tracking-widest uppercase font-bold mb-2 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Reason</label>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => { playClick(); setReason(r.value) }}
                  className={'w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 border ' + (reason === r.value
                    ? 'bg-nike-red/10 border-nike-red/30 text-nike-red font-bold'
                    : (isLight ? 'border-nike-gray text-nike-light hover:border-nike-gray/50' : 'border-white/10 text-white/40 hover:border-white/30'))}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={'block text-xs tracking-widest uppercase font-bold mb-2 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context..."
              rows={3}
              className={'w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 resize-none ' + (isLight ? 'bg-nike-gray/20 border-nike-gray text-nike-black placeholder:text-nike-light/50' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20')}
              style={{ border: '1px solid', borderColor: 'var(--color-nike-gray)' }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="w-full bg-nike-red hover:bg-white hover:text-nike-black text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
