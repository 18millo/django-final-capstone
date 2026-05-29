import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import Reveal from '../components/ui/Reveal'
import { mediaUrl } from '../utils/media'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'
import { IconBoxingGlove } from '../components/Icons'


export default function Groups() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', is_private: false })
  const [joining, setJoining] = useState(null)
  const [leaving, setLeaving] = useState(null)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'

  const canCreate = user && ['gym_owner', 'coach'].includes(user.role) && user.profile?.is_premium

  const fetchGroups = () => {
    setLoading(true)
    api.get('/auth/groups/')
      .then((res) => setGroups((res.data.results || res.data || []).filter((g) => !g.is_private)))
      .catch(() => toast('Failed to load groups', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchGroups() }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return toast('Group name is required', 'error')
    setCreating(true)
    try {
      await api.post('/auth/groups/', form)
      playSuccess()
      toast('Group created!', 'success')
      setShowCreate(false)
      setForm({ name: '', description: '', is_private: false })
      fetchGroups()
    } catch {
      toast('Failed to create group', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (groupId) => {
    playClick()
    setJoining(groupId)
    try {
      const res = await api.post('/auth/groups/' + groupId + '/join/')
      playSuccess()
      toast(res.data.detail, 'success')
      fetchGroups()
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to join', 'error')
    } finally {
      setJoining(null)
    }
  }

  const handleLeave = async (groupId) => {
    if (!confirm('Leave this group?')) return
    playClick()
    setLeaving(groupId)
    try {
      await api.post('/auth/groups/' + groupId + '/leave/')
      playSuccess()
      toast('You left the group', 'success')
      fetchGroups()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to leave', 'error')
    } finally {
      setLeaving(null)
    }
  }

  const handleDeclineInvite = async (groupId) => {
    playClick()
    setJoining(groupId)
    try {
      await api.post('/auth/groups/' + groupId + '/respond-invite/', { action: 'decline' })
      toast('Invitation declined', 'success')
      fetchGroups()
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to decline', 'error')
    } finally {
      setJoining(null)
    }
  }

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={'text-2xl font-black tracking-tight ' + textClass}>Groups</h1>
              <p className={'text-sm mt-0.5 ' + mutedClass}>Connect with training partners and teams</p>
            </div>
            {canCreate && (
              <button
                onClick={() => { playClick(); setShowCreate(true) }}
                className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-5 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30"
              >
                Create Group
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : groups.length === 0 ? (
          <div className={'text-center py-20 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className="text-5xl mb-4"><IconBoxingGlove className="w-4 h-4" /></div>
            <p className={'text-lg font-bold ' + textClass}>No groups yet</p>
            <p className={'text-sm mt-1 ' + mutedClass}>
              {canCreate ? 'Create the first group to bring your squad together!' : 'No groups available. Check back later!'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {groups.map((g) => {
              const isCreator = g.created_by === user?.id
              return (
                <Reveal key={g.id}>
                  <div className={'rounded-2xl border overflow-hidden transition-all hover:scale-[1.01] ' + borderClass + ' ' + cardBg}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-lg font-bold" style={{ color: 'var(--color-nike-light)' }}>
                            {g.avatar ? <img src={mediaUrl(g.avatar)} className="w-full h-full object-cover" alt="" /> : (g.name || 'G')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link to={'/groups/' + g.id} className={'text-sm font-bold truncate block hover:underline ' + textClass}>
                              {g.name}
                            </Link>
                            <div className={'flex items-center gap-2 mt-1 text-[10px] ' + mutedClass}>
                              <span>{g.member_count} member{(g.member_count || 0) !== 1 ? 's' : ''}</span>
                              {g.is_private && (
                                <span className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                  Private
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {g.is_member ? (
                            <>
                              <button
                                onClick={() => handleLeave(g.id)}
                                disabled={leaving === g.id}
                                className={'text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-red hover:text-white hover:border-nike-red' : 'border-white/10 text-white/40 hover:bg-nike-red hover:text-white hover:border-nike-red')}
                              >
                                {leaving === g.id ? '...' : 'Leave'}
                              </button>
                              <Link
                                to={'/groups/' + g.id}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-nike-red text-white transition-all hover:bg-nike-red/80"
                              >
                                Open
                              </Link>
                            </>
                          ) : g.my_status === 'invited' ? (
                            <>
                              <button
                                onClick={() => handleDeclineInvite(g.id)}
                                disabled={joining === g.id}
                                className={'text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-red hover:text-white hover:border-nike-red' : 'border-white/10 text-white/40 hover:bg-nike-red hover:text-white hover:border-nike-red')}
                              >
                                {joining === g.id ? '...' : 'Decline'}
                              </button>
                              <button
                                onClick={() => handleJoin(g.id)}
                                disabled={joining === g.id}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-nike-red text-white transition-all hover:bg-nike-red/80"
                              >
                                {joining === g.id ? '...' : 'Accept'}
                              </button>
                            </>
                          ) : g.my_status === 'pending' ? (
                            <span className={'text-xs font-bold px-3 py-1.5 rounded-lg ' + (isLight ? 'bg-nike-amber/10 text-nike-amber' : 'bg-nike-amber/10 text-nike-amber')}>
                              Pending
                            </span>
                          ) : (
                            <button
                              onClick={() => handleJoin(g.id)}
                              disabled={joining === g.id}
                              className={'text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
                            >
                              {joining === g.id ? '...' : g.is_private ? 'Request' : 'Join'}
                            </button>
                          )}
                        </div>
                      </div>
                      {g.description && (
                        <p className={'text-xs mt-3 leading-relaxed ' + mutedClass}>{g.description}</p>
                      )}
                      <div className={'flex items-center gap-3 mt-3 pt-3 border-t text-[10px] ' + borderClass + ' ' + mutedClass}>
                        <span>Created by {g.created_by_name}</span>
                        {isCreator && <span className="text-nike-red font-bold">You</span>}
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating create button */}
      {canCreate && (
        <button
          onClick={() => { playClick(); setShowCreate(true) }}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-nike-red text-white hover:bg-white hover:text-nike-black shadow-xl shadow-nike-red/40 transition-all duration-300 flex items-center justify-center"
          title="Create Group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        </button>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className={'relative w-full max-w-md rounded-2xl border shadow-xl p-6 ' + (isLight ? 'bg-white border-nike-gray' : 'bg-nike-dark border-white/10')} onClick={(e) => e.stopPropagation()}>
            <h2 className={'text-lg font-black tracking-tight ' + textClass}>Create Group</h2>
            <p className={'text-xs mt-1 ' + mutedClass}>Bring your squad together</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className={'text-[10px] tracking-widest uppercase font-bold ' + mutedClass}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Group name"
                  className={'w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all ' + (isLight ? 'bg-nike-gray/30 text-nike-black border border-nike-gray focus:border-nike-red/50' : 'bg-white/5 text-white border border-white/10 focus:border-white/40')}
                />
              </div>
              <div>
                <label className={'text-[10px] tracking-widest uppercase font-bold ' + mutedClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What's this group about?"
                  rows={3}
                  className={'w-full mt-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all resize-none ' + (isLight ? 'bg-nike-gray/30 text-nike-black border border-nike-gray focus:border-nike-red/50' : 'bg-white/5 text-white border border-white/10 focus:border-white/40')}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_private}
                  onChange={(e) => setForm((p) => ({ ...p, is_private: e.target.checked }))}
                  className="w-4 h-4 rounded accent-nike-red"
                />
                <div>
                  <span className={'text-sm font-bold ' + textClass}>Private Group</span>
                  <p className={'text-[10px] ' + mutedClass}>Members need approval to join</p>
                </div>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className={'flex-1 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/50' : 'border-white/10 text-white/40 hover:bg-white/10')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold bg-nike-red text-white hover:bg-white hover:text-nike-black transition-all disabled:opacity-40"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}