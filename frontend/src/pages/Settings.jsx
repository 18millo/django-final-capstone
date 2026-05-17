import { useState, useEffect } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { playSuccess } from '../utils/sounds'

const WEIGHT_CLASSES = [
  { value: '', label: 'Not specified' },
  { value: 'strawweight', label: 'Strawweight (115 lbs / 52 kg)' },
  { value: 'flyweight', label: 'Flyweight (125 lbs / 57 kg)' },
  { value: 'bantamweight', label: 'Bantamweight (135 lbs / 61 kg)' },
  { value: 'featherweight', label: 'Featherweight (145 lbs / 66 kg)' },
  { value: 'lightweight', label: 'Lightweight (155 lbs / 70 kg)' },
  { value: 'welterweight', label: 'Welterweight (170 lbs / 77 kg)' },
  { value: 'middleweight', label: 'Middleweight (185 lbs / 84 kg)' },
  { value: 'light_heavyweight', label: 'Light Heavyweight (205 lbs / 93 kg)' },
  { value: 'heavyweight', label: 'Heavyweight (265 lbs / 120 kg)' },
]

const STANCES = [
  { value: '', label: 'Not specified' },
  { value: 'orthodox', label: 'Orthodox' },
  { value: 'southpaw', label: 'Southpaw' },
  { value: 'switch', label: 'Switch' },
]

const SIDEBAR_ITEMS = [
  { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z' },
  { id: 'fighter', label: 'Fighter Stats', icon: 'M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { id: 'appearance', label: 'Appearance', icon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' },
  { id: 'about', label: 'About', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
]

const BG = 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1920&q=80'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const { theme, toggleTheme, appVersion } = useTheme()
  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({
    username: '', bio: '', phone: '', weight_class: '',
    height_ft: '', height_in: '', reach_in: '', stance: '',
  })
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const isLight = theme === 'light'

  useEffect(() => {
    if (user) {
      const p = user.profile || {}
      setForm({
        username: user.username || '',
        bio: p.bio || '',
        phone: p.phone || '',
        weight_class: p.weight_class || '',
        height_ft: p.height_ft || '',
        height_in: p.height_in || '',
        reach_in: p.reach_in || '',
        stance: p.stance || '',
      })
    }
  }, [user])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const formData = new FormData()
      formData.append('username', form.username)
      Object.entries(form).forEach(([key, val]) => {
        if (key !== 'username') formData.append('profile.' + key, val)
      })
      if (avatar) formData.append('profile.avatar', avatar)

      const { data } = await api.patch('/auth/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateUser(data)
      playSuccess()
      setMessage({ type: 'success', text: 'Profile updated!' })
    } catch (err) {
      const errData = err.response?.data
      const msg = errData?.username?.[0] || errData?.detail || 'Failed to update profile'
      setMessage({ type: 'error', text: msg })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />

      {/* Sidebar */}
      <div className="relative z-10 w-64 shrink-0 min-h-[calc(100vh-4rem)] flex flex-col" style={{ backgroundColor: 'var(--color-nike-dark)', borderRight: '1px solid var(--color-nike-gray)' }}>
        <div className="px-6 py-8 border-b" style={{ borderColor: 'var(--color-nike-gray)' }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-nike-red rounded-xl flex items-center justify-center font-black text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">SETTINGS</h2>
              <p className="text-xs" style={{ color: 'var(--color-nike-light)' }}>Manage your account</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={'flex items-center gap-3 w-full px-4 py-3 text-xs tracking-widest uppercase font-bold rounded-xl transition-all duration-300 text-left ' + (tab === item.id ? 'bg-nike-red text-white shadow-lg shadow-nike-red/20' : 'hover:bg-white/5')}
              style={tab !== item.id ? { color: 'var(--color-nike-light)' } : {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t text-xs" style={{ borderColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}>
          v{appVersion}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-2xl mx-auto">
          {message.text && (
            <div className={'px-5 py-4 rounded-xl mb-8 text-sm border ' + (message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-nike-red/10 border-nike-red/20 text-nike-red')}>
              {message.text}
            </div>
          )}

          {tab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                        {avatarPreview ? (
                          <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar" />
                        ) : user.profile?.avatar ? (
                          <img src={user.profile.avatar} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: 'var(--color-nike-light)' }}>👤</div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-nike-red text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-white hover:text-nike-black transition-all duration-300 text-sm font-bold shadow-lg">
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />+
                      </label>
                    </div>
                    <div>
                      <p className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>{user.email}</p>
                      <p className="text-sm uppercase tracking-wider" style={{ color: 'var(--color-nike-light)' }}>{user.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                    <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="mt-5 space-y-1.5">
                    <label className="block text-xs tracking-widest uppercase font-bold" style={{ color: 'var(--color-nike-light)' }}>Bio</label>
                    <textarea
                      className="w-full rounded-xl px-4 py-3 placeholder:text-white/20 focus:outline-none focus:border-[var(--color-nike-light)] focus:bg-white/10 transition-all duration-300"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
                      rows={4}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Tell the world about your fighting journey..."
                    />
                  </div>
                </div>
              </Reveal>
              <Button type="submit" loading={loading} className="w-full">Save Changes</Button>
            </form>
          )}

          {tab === 'fighter' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <h3 className="font-bold text-sm tracking-widest uppercase mb-6" style={{ color: 'var(--color-nike-light)' }}>Fighter Stats</h3>
                  <div className="grid md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-xs tracking-widest uppercase font-bold mb-1.5" style={{ color: 'var(--color-nike-light)' }}>Weight Class</label>
                      <select
                        value={form.weight_class}
                        onChange={(e) => setForm({ ...form, weight_class: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all duration-300"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
                      >
                        {WEIGHT_CLASSES.map((wc) => (
                          <option key={wc.value} value={wc.value} style={{ backgroundColor: 'var(--color-nike-dark)' }}>{wc.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs tracking-widest uppercase font-bold mb-1.5" style={{ color: 'var(--color-nike-light)' }}>Stance</label>
                      <select
                        value={form.stance}
                        onChange={(e) => setForm({ ...form, stance: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all duration-300"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-black) 80%, transparent)', border: '1px solid var(--color-nike-gray)', color: 'var(--color-nike-white)' }}
                      >
                        {STANCES.map((s) => (
                          <option key={s.value} value={s.value} style={{ backgroundColor: 'var(--color-nike-dark)' }}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="Height (ft)" type="number" value={form.height_ft} onChange={(e) => setForm({ ...form, height_ft: e.target.value })} />
                    <Input label="Height (in)" type="number" value={form.height_in} onChange={(e) => setForm({ ...form, height_in: e.target.value })} />
                    <Input label="Reach (in)" type="number" value={form.reach_in} onChange={(e) => setForm({ ...form, reach_in: e.target.value })} />
                  </div>
                </div>
              </Reveal>
              <Button type="submit" loading={loading} className="w-full">Save Changes</Button>
            </form>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>Theme</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>
                        {theme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="relative w-14 h-7 rounded-full transition-all duration-300 flex items-center"
                      style={{ backgroundColor: theme === 'dark' ? 'var(--color-nike-red)' : 'var(--color-nike-gray)' }}
                    >
                      <div className={'flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ' + (theme === 'dark' ? 'translate-x-1' : 'translate-x-7')}>
                        {theme === 'dark' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f172a" className="w-3.5 h-3.5">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" className="w-3.5 h-3.5">
                            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </Reveal>
            </div>
          )}

          {tab === 'about' && (
            <div className="space-y-6">
              <Reveal>
                <div className="p-8 rounded-2xl backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-nike-dark) 90%, transparent)', border: '1px solid var(--color-nike-gray)' }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-nike-gray)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: 'var(--color-nike-light)' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--color-nike-white)' }}>About CombatHub</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-nike-light)' }}>Version {appVersion}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-nike-light)' }}>
                      CombatHub is the complete ecosystem for combat sports athletes, coaches, and gyms. Built with Django, React, and Tailwind CSS.
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-nike-gray)' }}>
                      <div className="w-10 h-10 bg-nike-red rounded-full flex items-center justify-center font-black text-sm">
                        M
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--color-nike-white)' }}>Created by Millo</p>
                        <p className="text-xs" style={{ color: 'var(--color-nike-light)' }}>Full-stack developer & combat sports enthusiast</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
