import { useState, useEffect, useRef } from 'react'
import api from '../api'
import { useTheme } from '../providers/ThemeProvider'
import { IconMoon, IconSun } from '../components/Icons'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    business_name: '',
    business_location: '',
    business_description: '',
  })
  const [avatar, setAvatar] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/shop/profile/')
      .then(({ data }) => {
        setForm({
          business_name: data.business_name || '',
          business_location: data.business_location || '',
          business_description: data.business_description || '',
        })
        setAvatar(data.avatar || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await api.put('/shop/profile/', form)
      setMessage('Profile updated')
    } catch {
      setMessage('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setUploading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    api.patch('/shop/profile/', fd)
      .then(({ data }) => {
        setAvatar(data.avatar)
        setAvatarFile(null)
        setMessage('Avatar updated')
      })
      .catch(() => setMessage('Failed to upload avatar'))
      .finally(() => setUploading(false))
  }

  const handleRemoveAvatar = async () => {
    setUploading(true)
    try {
      await api.post('/shop/profile/remove-avatar/')
      setAvatar(null)
      setAvatarFile(null)
      setMessage('Avatar removed')
    } catch {
      setMessage('Failed to remove avatar')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="text-sm py-12 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading settings...</div>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>Settings</h1>

      {/* Avatar section */}
      <div className="liquid-glass-card rounded-2xl p-6 mb-6 animate-slideUp" style={{ border: '1px solid var(--theme-border)' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-text)' }}>Profile Picture</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatar ? (
              <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-nike-red/40" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-nike-red/20 flex items-center justify-center text-2xl font-bold text-nike-red ring-2 ring-nike-red/40">
                {(form.business_name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'var(--theme-surface)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
            >
              Upload Photo
            </button>
            {avatar && (
              <button
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-nike-red hover:bg-nike-red/10 transition-all"
                style={{ border: '1px solid rgba(229,16,29,0.3)' }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 animate-slideUp">
        {message && (
          <div className={`text-sm px-4 py-3 rounded-lg ${
            ['Avatar updated', 'Avatar removed', 'Profile updated'].includes(message)
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Business Name</label>
          <input
            name="business_name"
            value={form.business_name}
            onChange={handleChange}
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
            style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Location</label>
          <input
            name="business_location"
            value={form.business_location}
            onChange={handleChange}
            placeholder="City, State"
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
            style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Description</label>
          <textarea
            name="business_description"
            value={form.business_description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 resize-none"
            style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
          />
        </div>



        <button
          type="submit"
          disabled={saving}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm tracking-wider transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Theme */}
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
