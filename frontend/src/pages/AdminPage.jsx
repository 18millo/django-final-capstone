import { useState, useEffect } from 'react'
import { useTheme } from '../providers/ThemeProvider'
import { useAuth } from '../providers/AuthProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

const ROLES = ['athlete', 'coach', 'gym_owner', 'vendor', 'admin']

export default function AdminPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'

  useEffect(() => {
    api.get('/auth/admin/users/')
      .then((res) => setUsers(res.data))
      .catch(() => toast('Failed to load users', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    playClick()
    setSavingId(userId)
    try {
      await api.post('/auth/admin/users/' + userId + '/role/', { role: newRole })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
      playSuccess()
      toast('Role updated', 'success')
    } catch {
      toast('Failed to update role', 'error')
    } finally {
      setSavingId(null)
    }
  }

  if (user?.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] text-white/40">Access denied.</div>
  }

  if (loading) return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]"><Spinner /></div>

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Admin Panel</h1>
          <p className={'text-sm mt-0.5 ' + mutedClass}>Manage users and roles</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className={'rounded-2xl border overflow-hidden ' + borderClass}>
          <table className="w-full text-sm">
            <thead>
              <tr className={isLight ? 'bg-nike-gray/30' : 'bg-white/5'}>
                <th className={'px-4 py-3 text-left text-xs tracking-widest uppercase font-bold ' + mutedClass}>ID</th>
                <th className={'px-4 py-3 text-left text-xs tracking-widest uppercase font-bold ' + mutedClass}>Email</th>
                <th className={'px-4 py-3 text-left text-xs tracking-widest uppercase font-bold ' + mutedClass}>Username</th>
                <th className={'px-4 py-3 text-left text-xs tracking-widest uppercase font-bold ' + mutedClass}>Role</th>
                <th className={'px-4 py-3 text-left text-xs tracking-widest uppercase font-bold ' + mutedClass}>Premium</th>
                <th className={'px-4 py-3 text-left text-xs tracking-widest uppercase font-bold ' + mutedClass}>Active</th>
                <th className={'px-4 py-3 text-left text-xs tracking-widest uppercase font-bold ' + mutedClass}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={'border-t ' + (isLight ? 'border-nike-gray/50 hover:bg-nike-gray/20' : 'border-white/5 hover:bg-white/5')}>
                  <td className={'px-4 py-3 ' + mutedClass}>{u.id}</td>
                  <td className={'px-4 py-3 ' + textClass}>{u.email}</td>
                  <td className={'px-4 py-3 ' + textClass}>{u.username || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={savingId === u.id}
                      className={'text-xs px-2 py-1.5 rounded-lg border font-bold outline-none transition-colors ' +
                        (isLight ? 'bg-white border-nike-gray text-nike-black focus:border-nike-red' : 'bg-nike-dark border-white/10 text-white focus:border-nike-red')}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className={isLight ? 'bg-white' : 'bg-nike-dark'}>{r}</option>
                      ))}
                    </select>
                    {savingId === u.id && <span className="ml-2 text-xs text-nike-amber">saving...</span>}
                  </td>
                  <td className={'px-4 py-3 ' + (u.is_premium ? 'text-emerald-400' : mutedClass)}>{u.is_premium ? 'Yes' : 'No'}</td>
                  <td className={'px-4 py-3 ' + (u.is_active ? 'text-emerald-400' : 'text-nike-red')}>{u.is_active ? 'Yes' : 'No'}</td>
                  <td className={'px-4 py-3 ' + mutedClass}>{new Date(u.date_joined).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}