import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { mediaUrl } from '../utils/media'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'
import { IconLock } from '../components/Icons'
import ScrollProgressBar from '../components/ui/ScrollProgressBar'


export default function GroupDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'

  const [group, setGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [tab, setTab] = useState('chat')
  const [requests, setRequests] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingInvites, setPendingInvites] = useState([])
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [editAvatar, setEditAvatar] = useState(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState(null)
  const editAvatarRef = useRef(null)
  const [updating, setUpdating] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const messagesRef = useRef(null)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'

  const isCreator = group?.created_by === user?.id

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/auth/groups/' + id + '/'),
      api.get('/auth/groups/' + id + '/messages/'),
      api.get('/auth/groups/' + id + '/members/'),
    ])
      .then(([gRes, mRes, memRes]) => {
        setGroup(gRes.data)
        setMessages(mRes.data.results || mRes.data || [])
        setMembers(memRes.data.results || memRes.data || [])
        if (isCreator) {
          api.get('/auth/groups/' + id + '/requests/')
            .then((rRes) => {
              const reqs = rRes.data.results || rRes.data || []
              setRequests(reqs)
              setPendingCount(reqs.length)
            })
            .catch(() => {})
          api.get('/auth/groups/' + id + '/invites/')
            .then((iRes) => setPendingInvites(iRes.data.results || iRes.data || []))
            .catch(() => {})
        }
      })
      .catch(() => toast('Failed to load group', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/auth/groups/' + id + '/messages/')
        .then((res) => setMessages(res.data.results || res.data || []))
        .catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [id])

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return
    setSending(true)
    try {
      const formData = new FormData()
      if (input.trim()) formData.append('content', input)
      if (imageFile) formData.append('image', imageFile)
      await api.post('/auth/groups/' + id + '/messages/send/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setInput('')
      setImageFile(null)
      setImagePreview(null)
      playSuccess()
      const res = await api.get('/auth/groups/' + id + '/messages/')
      setMessages(res.data.results || res.data || [])
    } catch {
      toast('Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleApprove = async (userId) => {
    try {
      await api.post('/auth/groups/' + id + '/requests/' + userId + '/approve/')
      playSuccess()
      toast('Request approved', 'success')
      setRequests((prev) => prev.filter((r) => r.user !== userId))
      setPendingCount((p) => p - 1)
      const [memRes, gRes] = await Promise.all([
        api.get('/auth/groups/' + id + '/members/'),
        api.get('/auth/groups/' + id + '/'),
      ])
      setMembers(memRes.data.results || memRes.data || [])
      setGroup(gRes.data)
    } catch {
      toast('Failed to approve', 'error')
    }
  }

  const handleReject = async (userId) => {
    try {
      await api.post('/auth/groups/' + id + '/requests/' + userId + '/reject/')
      toast('Request rejected', 'success')
      setRequests((prev) => prev.filter((r) => r.user !== userId))
      setPendingCount((p) => p - 1)
    } catch {
      toast('Failed to reject', 'error')
    }
  }

  const cancelInvite = async (userId) => {
    try {
      await api.delete('/auth/groups/' + id + '/members/' + userId + '/')
      setPendingInvites((prev) => prev.filter((m) => m.user !== userId))
      toast('Invitation cancelled', 'success')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to cancel invite', 'error')
    }
  }

  const handleLeave = async () => {
    if (!confirm('Leave this group?')) return
    try {
      await api.post('/auth/groups/' + id + '/leave/')
      playSuccess()
      toast('You left the group', 'success')
      navigate('/groups')
    } catch {
      toast('Failed to leave group', 'error')
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]"><Spinner /></div>
  if (!group) return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] text-white/40">Group not found</div>

  const isMember = group.is_member

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/groups')} className={'p-2 rounded-xl transition-colors ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/5 text-white/40')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-lg font-bold" style={{ color: 'var(--color-nike-light)' }}>
              {group.avatar ? <img src={mediaUrl(group.avatar)} className="w-full h-full object-cover" alt="" /> : (group.name || 'G')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={'text-lg font-black tracking-tight truncate ' + textClass}>{group.name}</h1>
              <p className={'text-xs ' + mutedClass}>{group.member_count} member{(group.member_count || 0) !== 1 ? 's' : ''}{group.is_private ? ' · Private' : ' · Public'}</p>
            </div>
            {isMember && !isCreator && (
              <>
                <button onClick={handleLeave} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white transition-all">
                  Leave
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Block this group? You will leave it and it will be hidden.')) return
                    try {
                      await api.post('/auth/groups/' + id + '/block/')
                      toast('Group blocked', 'success')
                      navigate('/groups')
                    } catch {
                      toast('Failed to block group', 'error')
                    }
                  }}
                  className={'text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-red hover:text-white hover:border-nike-red' : 'border-white/10 text-white/40 hover:bg-nike-red hover:text-white hover:border-nike-red')}
                >
                  Block
                </button>
              </>
            )}
            {isCreator && (
              <>
                <button onClick={() => { setEditForm({ name: group.name, description: group.description || '' }); setEditing(true) }} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white transition-all">
                  Edit
                </button>
                <button
                  onClick={async () => {
                    const otherMemberCount = members.filter(m => m.user !== user.id).length
                    if (otherMemberCount > 0) {
                      if (!confirm('Remove all other members before deleting the group.')) return
                      return toast('Remove all members first, then delete again', 'error')
                    }
                    if (!confirm('Delete this group permanently? This cannot be undone.')) return
                    try {
                      await api.delete('/auth/groups/' + id + '/')
                      playSuccess()
                      toast('Group deleted', 'success')
                      navigate('/groups')
                    } catch (err) {
                      toast(err.response?.data?.detail || 'Failed to delete group', 'error')
                    }
                  }}
                  className={'text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-red hover:text-white hover:border-nike-red' : 'border-white/10 text-white/40 hover:bg-nike-red hover:text-white hover:border-nike-red')}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isMember && (
        <div className={'border-b ' + borderClass}>
          <div className="max-w-5xl mx-auto px-6 flex gap-6">
            <button onClick={() => setTab('chat')} className={'py-3 text-xs tracking-widest uppercase font-bold border-b-2 transition-all ' + (tab === 'chat' ? 'border-nike-red text-nike-red' : 'border-transparent ' + mutedClass)}>
              Chat
            </button>
            <button onClick={() => setTab('members')} className={'py-3 text-xs tracking-widest uppercase font-bold border-b-2 transition-all ' + (tab === 'members' ? 'border-nike-red text-nike-red' : 'border-transparent ' + mutedClass)}>
              Members ({members.length})
            </button>
            {isCreator && (
              <button onClick={() => setTab('invites')} className={'py-3 text-xs tracking-widest uppercase font-bold border-b-2 transition-all ' + (tab === 'invites' ? 'border-nike-red text-nike-red' : 'border-transparent ' + mutedClass)}>
                Invites ({pendingInvites.length})
              </button>
            )}
            {isCreator && pendingCount > 0 && (
              <button onClick={() => setTab('requests')} className={'py-3 text-xs tracking-widest uppercase font-bold border-b-2 transition-all ' + (tab === 'requests' ? 'border-nike-red text-nike-red' : 'border-transparent ' + mutedClass)}>
                Requests ({pendingCount})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-6">
        {!isMember ? (
          <div className={'text-center py-20 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <div className="text-5xl mb-4"><IconLock className="w-4 h-4" /></div>
            <p className={'text-lg font-bold ' + textClass}>Join this group to see the content</p>
            <p className={'text-sm mt-1 ' + mutedClass}>{group.my_status === 'pending' ? 'Your join request is pending approval.' : ''}</p>
            {group.my_status !== 'pending' && (
              <button
                onClick={async () => {
                  try {
                    await api.post('/auth/groups/' + id + '/join/')
                    playSuccess()
                    toast('Join request sent!', 'success')
                    const [gRes] = await Promise.all([
                      api.get('/auth/groups/' + id + '/'),
                      api.get('/auth/groups/' + id + '/messages/'),
                      api.get('/auth/groups/' + id + '/members/'),
                    ])
                    setGroup(gRes.data)
                    if (user.id === group.created_by) {
                      const rRes = await api.get('/auth/groups/' + id + '/requests/')
                      setRequests(rRes.data.results || rRes.data || [])
                    }
                  } catch (err) {
                    toast(err.response?.data?.error || 'Failed to join', 'error')
                  }
                }}
                className="mt-4 px-6 py-2 bg-nike-red text-white text-sm font-bold rounded-xl hover:bg-white hover:text-nike-black transition-all"
              >
                {group.is_private ? 'Request to Join' : 'Join Group'}
              </button>
            )}
          </div>
        ) : tab === 'chat' ? (
          <div className="flex flex-col h-[calc(100vh-20rem)]">
            <div className={'flex-1 overflow-y-auto rounded-2xl border p-4 space-y-3 relative ' + borderClass + ' ' + cardBg} ref={messagesRef}>
              <ScrollProgressBar scrollRef={messagesRef} />
              {messages.length === 0 ? (
                <div className={'text-center py-10 text-sm ' + mutedClass}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === user?.id
                  if (msg.is_system) {
                    return (
                      <div key={msg.id} className="flex justify-center py-1">
                        <span className={'text-xs font-medium px-4 py-1.5 rounded-full ' + (isLight ? 'bg-nike-gray/20 text-nike-light' : 'bg-white/5 text-white/40')}>{msg.content}</span>
                      </div>
                    )
                  }
                  return (
                    <div key={msg.id} className={'flex items-start gap-3 ' + (isMe ? 'flex-row-reverse' : '')}>
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--color-nike-light)' }}>
                        {msg.sender_avatar ? <img src={mediaUrl(msg.sender_avatar)} className="w-full h-full object-cover" alt="" /> : ((msg.sender_username || msg.sender_name || '?')[0]).toUpperCase()}
                          </div>
                          {!isMe && <p className={'text-[10px] mb-1 font-bold ' + mutedClass}>{msg.sender_username || msg.sender_name}</p>}
                        <div className={'rounded-2xl px-4 py-2 text-sm ' + (isMe ? 'bg-nike-red text-white rounded-tr-sm' : (isLight ? 'bg-nike-gray/30 text-nike-black' : 'bg-white/10 text-white'))}>
                          {msg.content && <p>{msg.content}</p>}
                          {msg.image_url && (
                            <img
                              src={mediaUrl(msg.image_url)}
                              className={'rounded-xl max-w-60 cursor-pointer hover:opacity-90 transition-opacity ' + (msg.content ? 'mt-2' : '')}
                              alt=""
                              onClick={() => window.open(mediaUrl(msg.image_url), '_blank')}
                            />
                          )}
                        </div>
                        <p className={'text-[9px] mt-1 ' + mutedClass}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>
            {/* Input */}
            <div className={'mt-3 rounded-2xl border p-3 ' + borderClass + ' ' + cardBg}>
              {imagePreview && (
                <div className="relative inline-block mb-2">
                  <img src={imagePreview} className="h-20 rounded-xl object-cover" alt="" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="absolute -top-2 -right-2 w-5 h-5 bg-nike-red rounded-full flex items-center justify-center text-white text-[10px] font-bold">x</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={'p-2 rounded-xl transition-colors shrink-0 ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/5 text-white/40')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className={'flex-1 px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-all ' + (isLight ? 'bg-nike-gray/30 text-nike-black placeholder:text-nike-light border border-nike-gray focus:border-nike-red/50' : 'bg-white/5 text-white placeholder:text-white/30 border border-white/10 focus:border-white/40')}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!input.trim() && !imageFile)}
                  className="p-2.5 rounded-xl bg-nike-red text-white hover:bg-white hover:text-nike-black transition-all disabled:opacity-40 shrink-0"
                >
                  {sending ? <Spinner /> : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : tab === 'members' ? (
          <div className="grid md:grid-cols-2 gap-3">
            {members.map((m) => (
              <div key={m.id} className={'flex items-center gap-3 p-4 rounded-xl border ' + borderClass + ' ' + cardBg}>
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-nike-light)' }}>
                  {m.avatar ? <img src={mediaUrl(m.avatar)} className="w-full h-full object-cover" alt="" /> : (m.username || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={'text-sm font-bold truncate ' + textClass}>{m.username}</p>
                  <p className={'text-[10px] ' + mutedClass}>{m.role === 'admin' ? 'Admin' : 'Member'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'invites' ? (
          <div className="space-y-3">
            {pendingInvites.map((m) => (
              <div key={m.id || m.user} className={'flex items-center justify-between p-4 rounded-xl border flex-wrap gap-2 ' + borderClass + ' ' + cardBg}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-nike-light)' }}>
                    {m.avatar ? <img src={mediaUrl(m.avatar)} className="w-full h-full object-cover" alt="" /> : (m.username || '?')[0].toUpperCase()}
                  </div>
                  <span className={'text-sm font-bold truncate ' + textClass}>{m.username}</span>
                </div>
                <button onClick={() => cancelInvite(m.user)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white transition-all">Cancel</button>
              </div>
            ))}
            {pendingInvites.length === 0 && (
              <p className={'text-center py-10 text-sm ' + mutedClass}>No pending invites</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className={'flex items-center justify-between p-4 rounded-xl border flex-wrap gap-2 ' + borderClass + ' ' + cardBg}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-nike-light)' }}>
                    {r.avatar ? <img src={mediaUrl(r.avatar)} className="w-full h-full object-cover" alt="" /> : (r.username || '?')[0].toUpperCase()}
                  </div>
                  <span className={'text-sm font-bold truncate ' + textClass}>{r.username}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(r.user)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all">Approve</button>
                  <button onClick={() => handleReject(r.user)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white transition-all">Reject</button>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <p className={'text-center py-10 text-sm ' + mutedClass}>No pending requests</p>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div className={'w-full max-w-md mx-4 rounded-2xl p-6 ' + cardBg + ' border ' + borderClass} style={{ background: 'var(--theme-bg-secondary)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className={'text-lg font-black mb-4 ' + textClass}>Edit Group</h3>
            <div className="space-y-4">
              {/* Avatar */}
              <div>
                <label className={'text-[10px] tracking-widest uppercase font-bold block mb-2 ' + mutedClass}>Avatar</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => editAvatarRef.current?.click()}
                    className={'relative w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-bold text-xl ring-2 transition-all hover:ring-nike-red/50 ' + (isLight ? 'ring-nike-gray bg-nike-gray/20' : 'ring-white/10 bg-white/5')}
                  >
                    {editAvatarPreview ? (
                      <img src={editAvatarPreview} className="w-full h-full object-cover" alt="" />
                    ) : group.avatar ? (
                      <img src={mediaUrl(group.avatar)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className={'text-lg ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{(group.name || 'G')[0].toUpperCase()}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={'text-xs font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Group Avatar</p>
                    <p className={'text-[10px] mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Click to upload a new image</p>
                  </div>
                  {editAvatarPreview && (
                    <button
                      onClick={() => { setEditAvatar(null); setEditAvatarPreview(null) }}
                      className={'text-xs px-2 py-1 rounded-lg transition-colors ' + (isLight ? 'text-nike-light hover:bg-nike-gray/30' : 'text-white/40 hover:bg-white/10')}
                    >
                      Remove
                    </button>
                  )}
                  <input
                    ref={editAvatarRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setEditAvatar(file)
                        setEditAvatarPreview(URL.createObjectURL(file))
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>
              <div>
                <label className={'text-[10px] tracking-widest uppercase font-bold block mb-1 ' + mutedClass}>Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className={'w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ' + (isLight ? 'bg-nike-gray/30 text-nike-black border-nike-gray focus:border-nike-red/50' : 'bg-white/5 text-white border-white/10 focus:border-white/40')}
                />
              </div>
              <div>
                <label className={'text-[10px] tracking-widest uppercase font-bold block mb-1 ' + mutedClass}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={'w-full px-4 py-2.5 rounded-xl text-sm outline-none border resize-none transition-all ' + (isLight ? 'bg-nike-gray/30 text-nike-black border-nike-gray focus:border-nike-red/50' : 'bg-white/5 text-white border-white/10 focus:border-white/40')}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setEditing(false)} className={'px-4 py-2 rounded-xl text-xs font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/30' : 'border-white/10 text-white/40 hover:bg-white/10')}>
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editForm.name.trim()) return toast('Name is required', 'error')
                    setUpdating(true)
                    try {
                      let res
                      if (editAvatar instanceof File) {
                        const fd = new FormData()
                        fd.append('name', editForm.name.trim())
                        fd.append('description', editForm.description.trim())
                        fd.append('avatar', editAvatar)
                        res = await api.patch('/auth/groups/' + id + '/', fd, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                        })
                      } else {
                        res = await api.patch('/auth/groups/' + id + '/', { name: editForm.name.trim(), description: editForm.description.trim() })
                      }
                      setGroup(res.data)
                      playSuccess()
                      toast('Group updated', 'success')
                      setEditing(false)
                      setEditAvatar(null)
                      setEditAvatarPreview(null)
                    } catch (err) {
                      toast(err.response?.data?.detail || 'Failed to update', 'error')
                    } finally {
                      setUpdating(false)
                    }
                  }}
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-nike-red text-white hover:bg-white hover:text-nike-black transition-all disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}