import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { mediaUrl } from '../utils/media'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

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
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

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
      const memRes = await api.get('/auth/groups/' + id + '/members/')
      setMembers(memRes.data.results || memRes.data || [])
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
              <button onClick={handleLeave} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white transition-all">
                Leave
              </button>
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
            <div className="text-5xl mb-4">🔒</div>
            <p className={'text-lg font-bold ' + textClass}>Join this group to see the content</p>
            <p className={'text-sm mt-1 ' + mutedClass}>{group.my_status === 'pending' ? 'Your join request is pending approval.' : 'Ask the creator to join!'}</p>
          </div>
        ) : tab === 'chat' ? (
          <div className="flex flex-col h-[calc(100vh-20rem)]">
            <div className={'flex-1 overflow-y-auto rounded-2xl border p-4 space-y-3 ' + borderClass + ' ' + cardBg}>
              {messages.length === 0 ? (
                <div className={'text-center py-10 text-sm ' + mutedClass}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === user?.id
                  return (
                    <div key={msg.id} className={'flex items-start gap-3 ' + (isMe ? 'flex-row-reverse' : '')}>
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--color-nike-light)' }}>
                        {msg.sender_avatar ? <img src={mediaUrl(msg.sender_avatar)} className="w-full h-full object-cover" alt="" /> : (msg.sender_name || '?')[0].toUpperCase()}
                      </div>
                      <div className={'max-w-[75%] ' + (isMe ? 'items-end' : '')}>
                        {!isMe && <p className={'text-[10px] mb-1 font-bold ' + mutedClass}>{msg.sender_name}</p>}
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
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className={'flex items-center justify-between p-4 rounded-xl border ' + borderClass + ' ' + cardBg}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-nike-gray/20 flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-nike-light)' }}>
                    {r.avatar ? <img src={mediaUrl(r.avatar)} className="w-full h-full object-cover" alt="" /> : (r.username || '?')[0].toUpperCase()}
                  </div>
                  <span className={'text-sm font-bold truncate ' + textClass}>{r.username}</span>
                </div>
                <div className="flex gap-2 shrink-0">
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
    </div>
  )
}