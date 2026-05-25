import { useState, useEffect } from 'react'
import api from '../api'
import { useTheme } from '../providers/ThemeProvider'
import { IconMoon, IconSun } from '../components/Icons'

export default function CustomerSettings() {
  const { theme, toggleTheme } = useTheme()
  const [form, setForm] = useState({ display_name: '', email: '', username: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/auth/me/').then(({ data }) => {
      const u = data.user || data
      setForm({ display_name: u.display_name || '', email: u.email || '', username: u.username || '' })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await api.patch('/auth/profile/update/', { display_name: form.display_name })
      setMessage('Profile updated')
    } catch {
      setMessage('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-[var(--theme-text-secondary)] text-sm py-20 text-center">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-nike-red text-xs font-bold tracking-[0.25em] uppercase mb-2">Settings</p>
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-8" style={{ color: 'var(--theme-text)' }}>Your Profile</h1>

      <div className="liquid-glass-card rounded-2xl p-6 animate-slideUp" style={{ border: '1px solid var(--theme-border)' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`text-sm px-4 py-3 rounded-xl ${message === 'Profile updated' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-nike-red/10 border border-nike-red/20 text-nike-red'}`}>
              {message}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Display Name</label>
            <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-nike-red/50 transition-all duration-300"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Email</label>
            <input value={form.email} disabled
              className="w-full rounded-xl px-4 py-3 text-sm cursor-not-allowed"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }} />
            <p className="text-[10px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Username</label>
            <input value={form.username} disabled
              className="w-full rounded-xl px-4 py-3 text-sm cursor-not-allowed"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }} />
          </div>

          <button type="submit" disabled={saving}
            className="bg-nike-red hover:bg-white hover:text-nike-black disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm tracking-wider transition-all duration-300">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Theme settings */}
      <div className="liquid-glass-card rounded-2xl p-6 mt-6 animate-slideUp animate-delay-100" style={{ border: '1px solid var(--theme-border)' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-text)' }}>Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>Theme</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>Switch between light and dark mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="relative w-14 h-7 rounded-full transition-colors duration-300"
            style={{ background: theme === 'dark' ? 'var(--theme-surface)' : '#e5101d' }}
          >
            <div
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center text-[10px]"
              style={{ left: theme === 'dark' ? '2px' : 'calc(100% - 22px)' }}
            >
              {theme === 'dark' ? <IconMoon size={18} /> : <IconSun size={18} />}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
