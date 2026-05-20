import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import EmojiPicker from '../components/ui/EmojiPicker'
import { mediaUrl } from '../utils/media'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

const BG = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80'
const WS_BASE = 'ws://localhost:8000'

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return mins + 'm ago'
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + 'h ago'
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return days + 'd ago'
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dateLabel(date) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function Messages() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [typing, setTyping] = useState(false)
  const typingTimeoutRef = useRef(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [viewOnce, setViewOnce] = useState(false)
  const fileInputRef = useRef(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('chat-opened'))
    api.get('/auth/conversations/')
      .then((res) => setConversations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const poll = setInterval(() => {
      api.get('/auth/conversations/')
        .then((res) => {
          setConversations((prev) => {
            const serverMap = new Map(res.data.map((c) => [c.user_id, c]))
            const merged = prev.map((local) => {
              const server = serverMap.get(local.user_id)
              if (!server) return local
              serverMap.delete(local.user_id)
              return { ...server, unread: local.unread }
            })
            return [...merged, ...serverMap.values()]
          })
        })
        .catch(() => {})
    }, 30000)
    api.get('/auth/conversations/')
      .then((res) => {
        setConversations((prev) => {
          const serverMap = new Map(res.data.map((c) => [c.user_id, c]))
          const merged = prev.map((local) => {
            const server = serverMap.get(local.user_id)
            if (!server) return local
            serverMap.delete(local.user_id)
            return { ...server, unread: local.unread }
          })
          return [...merged, ...serverMap.values()]
        })
      })
      .catch(() => {})
    return () => clearInterval(poll)
  }, [])

  useEffect(() => {
    if (activeId) {
      setChatLoading(true)
      api.get('/auth/conversations/' + activeId + '/')
        .then((res) => setMessages((prev) => {
          const fresh = res.data
          const existingIds = new Set(prev.map((m) => m.id))
          const merged = [...fresh.filter((m) => !existingIds.has(m.id)), ...prev]
          return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }))
        .catch(() => {})
        .finally(() => setChatLoading(false))
    }
  }, [activeId])

  useEffect(() => {
    if (activeId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mark_read' }))
    }
  }, [activeId])

  useEffect(() => {
    const handler = (e) => {
      const { sender, sender_name, content, created_at } = e.detail
      if (!sender) return
      setConversations((prev) => {
        const existing = prev.find((c) => c.user_id === sender)
        if (existing) {
          return prev.map((c) =>
            c.user_id === sender
              ? { ...c, last_message: content || '📷 Photo', last_message_time: created_at || new Date().toISOString(), unread: c.user_id === activeId ? 0 : (c.unread || 0) + 1 }
              : c
          )
        }
        return [{ user_id: sender, username: sender_name || 'User', avatar: null, last_message: content || '📷 Photo', last_message_time: created_at || new Date().toISOString(), unread: 1 }, ...prev].sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0))
      })
      if (sender === activeId) {
        api.get('/auth/conversations/' + activeId + '/')
          .then((res) => setMessages((prev) => {
            const fresh = res.data
            const existingIds = new Set(prev.map((m) => m.id))
            const merged = [...fresh.filter((m) => !existingIds.has(m.id)), ...prev]
            return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          }))
          .catch(() => {})
      }
    }
    window.addEventListener('new-message', handler)
    return () => window.removeEventListener('new-message', handler)
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const connectWs = useCallback(() => {
    if (!activeId || !user) return
    const token = localStorage.getItem('access_token')
    if (!token) return
    const url = WS_BASE + '/ws/chat/' + activeId + '/?token=' + encodeURIComponent(token)

    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
    }

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setWsConnected(true)

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'chat_message') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev
            const tempIdx = prev.findIndex((m) => m.id?.toString().startsWith('temp_') && m.content === data.content && m.sender === data.sender)
            if (tempIdx !== -1) {
              const next = [...prev]
              next[tempIdx] = data
              return next
            }
            return [data, ...prev]
          })
          if (data.sender !== user.id) {
            playSuccess()
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'message_delivered', message_id: data.id }))
            }
          }
          setConversations((prev) => prev.map((c) =>
            c.user_id === (data.sender === user.id ? parseInt(activeId) : data.sender)
              ? { ...c, last_message: data.content || (data.view_once ? '📷 View once photo' : '📷 Photo'), last_message_time: data.created_at, unread: data.sender !== user.id ? (c.unread || 0) + 1 : c.unread }
              : c
          ).sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)))
        } else if (data.type === 'message_delivered') {
          setMessages((prev) => prev.map((m) =>
            m.id === data.message_id ? { ...m, delivered: true } : m
          ))
        } else if (data.type === 'messages_read') {
          setMessages((prev) => prev.map((m) =>
            m.sender === data.read_by ? { ...m, read: true } : m
          ))
        } else if (data.type === 'user_typing') {
          if (data.user_id !== user.id) setTyping(true)
        } else if (data.type === 'user_stop_typing') {
          if (data.user_id !== user.id) setTyping(false)
        }
      } catch {}
    }

    ws.onclose = () => {
      setWsConnected(false)
      if (wsRef.current === ws) {
        reconnectTimeoutRef.current = setTimeout(connectWs, 3000)
      }
    }

    ws.onerror = () => ws.close()
  }, [activeId, user])

  useEffect(() => {
    connectWs()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
      setWsConnected(false)
    }
  }, [connectWs])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleViewOnceMessage = async (msgId, imageUrl) => {
    try {
      await api.post('/auth/messages/' + msgId + '/view-once/')
      setMessages((prev) => prev.map((m) =>
        m.id === msgId ? { ...m, viewed: true } : m
      ))
      setLightboxUrl(mediaUrl(imageUrl))
    } catch {
      toast('Failed to open view once image', 'error')
    }
  }

  const send = () => {
    const content = input.trim()
    if ((!content && !imageFile) || !activeId) return
    setShowEmojiPicker(false)
    playClick()

    const tempId = 'temp_' + Date.now()
    const lastMsgText = !content && imageFile ? (viewOnce ? '📷 View once photo' : '📷 Photo') : content
    const optimistic = {
      id: tempId,
      sender: user.id,
      content: content || '',
      created_at: new Date().toISOString(),
      delivered: false,
      read: false,
      image_url: imagePreview || null,
      view_once: viewOnce,
      viewed: false,
    }
    setMessages((prev) => [optimistic, ...prev])
    setConversations((prev) => prev.map((c) => c.user_id === activeId ? {
      ...c,
      last_message: lastMsgText,
      last_message_time: new Date().toISOString(),
    } : c).sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)))

    if (imageFile) {
      const formData = new FormData()
      formData.append('content', content || '')
      if (viewOnce) formData.append('view_once', 'true')
      formData.append('image', imageFile)

      api.post('/auth/conversations/' + activeId + '/send/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
        .then(({ data }) => {
          setMessages((prev) => prev.map((m) => m.id === tempId ? data : m))
          const lastText = data.content || (data.view_once ? '📷 View once photo' : '📷 Photo')
          setConversations((prev) => prev.map((c) => c.user_id === activeId ? {
            ...c,
            last_message: lastText,
            last_message_time: data.created_at,
          } : c).sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)))
          playSuccess()
        })
        .catch(() => {
          setMessages((prev) => prev.filter((m) => m.id !== tempId))
          toast('Failed to send message', 'error')
        })

      setInput('')
      setImageFile(null)
      setImagePreview(null)
      setViewOnce(false)
      return
    }

    setInput('')
    setViewOnce(false)

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const wsPayload = { type: 'message', content }
      if (viewOnce) wsPayload.view_once = true
      wsRef.current.send(JSON.stringify(wsPayload))
      setConversations((prev) => prev.map((c) => c.user_id === activeId ? { ...c, last_message: content, last_message_time: new Date().toISOString() } : c).sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)))
      playSuccess()
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      const jsonPayload = { content }
      if (viewOnce) jsonPayload.view_once = true
      api.post('/auth/conversations/' + activeId + '/send/', jsonPayload)
        .then(({ data }) => {
          setMessages((prev) => [data, ...prev])
          const lastText = data.content || (data.view_once ? '📷 View once photo' : '📷 Photo')
          setConversations((prev) => prev.map((c) => c.user_id === activeId ? { ...c, last_message: lastText, last_message_time: data.created_at } : c).sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)))
          playSuccess()
        })
        .catch(() => toast('Failed to send message', 'error'))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'typing' }))
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stop_typing' }))
      }
    }, 2000)
  }

  const insertEmoji = (emoji) => {
    const ta = textareaRef.current
    if (ta) {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      setInput((prev) => prev.substring(0, start) + emoji + prev.substring(end))
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + emoji.length
        ta.focus()
      })
    } else {
      setInput((prev) => prev + emoji)
    }
  }

  const openNewChat = async () => {
    playClick()
    setShowNewChat(true)
    if (contacts.length > 0) return
    setContactsLoading(true)
    try {
      const [fol, ing] = await Promise.all([
        api.get('/auth/me/followers/'),
        api.get('/auth/me/following/'),
      ])
      const followers = fol.data.results || fol.data
      const following = ing.data.results || ing.data
      const seen = new Set()
      const deduped = []
      for (const u of [...following, ...followers]) {
        if (!seen.has(u.id)) { seen.add(u.id); deduped.push(u) }
      }
      setContacts(deduped)
    } catch {} finally {
      setContactsLoading(false)
    }
  }

  const startConvo = (uid) => {
    setShowNewChat(false)
    setActiveId(uid)
    if (!conversations.find((c) => c.user_id === uid)) {
      const u = contacts.find((c) => c.id === uid)
      if (u) {
        setConversations((prev) => [{ user_id: u.id, username: u.username || u.display_name || 'User', avatar: u.profile?.avatar, unread: 0, online: false }, ...prev])
      }
    }
  }

  const activeConv = conversations.find((c) => c.user_id === activeId)

  const groupedMessages = useMemo(() => {
    if (messages.length === 0) return []
    const groups = []
    let currentLabel = null
    for (const m of [...messages].reverse()) {
      const label = dateLabel(m.created_at)
      if (label !== currentLabel) {
        currentLabel = label
        groups.push({ type: 'date', label })
      }
      groups.push({ type: 'msg', ...m })
    }
    return groups
  }, [messages])

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'absolute inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative h-full flex">

        {/* Sidebar */}
        <div className={'w-72 shrink-0 flex flex-col liquid-glass-card'}>
          <div className={'p-4 border-b flex items-center justify-between ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
            <div className={'flex items-center gap-2.5 px-3 py-2 rounded-xl ' + (isLight ? 'bg-nike-gray/30' : 'bg-white/5')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'w-4 h-4 shrink-0 ' + (isLight ? 'text-nike-light' : 'text-white/30')}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Messages</span>
            </div>
            <div className="flex items-center gap-1">
              {['gym_owner', 'coach'].includes(user?.role) && user?.profile?.is_premium && (
                <button
                  onClick={() => { playClick(); navigate('/groups') }}
                  className={'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40 hover:text-white')}
                  title="Create Group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </button>
              )}
              <button
                onClick={openNewChat}
                className={'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40 hover:text-white')}
                title="New conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : conversations.length === 0 ? (
              <div className={'text-center py-12 px-4 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                <div className="text-3xl mb-2">💬</div>
                <p className="text-xs">No conversations yet</p>
                <button onClick={openNewChat} className="mt-3 text-xs tracking-widest uppercase font-bold bg-nike-red text-white px-4 py-2 rounded-full hover:bg-white hover:text-nike-black transition-all duration-300">
                  + New Chat
                </button>
              </div>
            ) : (
              conversations.map((c) => {
                const active = c.user_id === activeId
                return (
                  <button
                    key={c.user_id}
                    onClick={() => { playClick(); setActiveId(c.user_id) }}
                    className={'w-full text-left p-4 flex items-center gap-3 transition-all duration-200 border-b ' + (isLight
                      ? (active ? 'bg-nike-red/5 border-nike-gray' : 'hover:bg-nike-gray/20 border-nike-gray')
                      : (active ? 'bg-white/5 border-white/5' : 'hover:bg-white/5 border-white/5')
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2" style={{ '--tw-ring-color': 'var(--color-nike-gray)' }}>
                        {c.avatar ? (
                          <img src={mediaUrl(c.avatar)} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}>
                            {(c.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      {c.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-nike-red rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-nike-red/30">
                          {c.unread > 9 ? '9+' : c.unread}
                        </div>
                      )}
                      {c.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 shadow-lg" style={{ borderColor: isLight ? 'white' : 'var(--color-nike-dark)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={'text-xs font-bold truncate ' + (c.unread > 0 ? (isLight ? 'text-nike-black' : 'text-white') : (isLight ? 'text-nike-black/70' : 'text-white/60'))}>{c.username}</p>
                        {c.last_message_time && (
                          <p className={'text-[10px] shrink-0 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{timeAgo(c.last_message_time)}</p>
                        )}
                      </div>
                      <p className={'text-[10px] truncate mt-0.5 ' + (c.unread > 0 ? (isLight ? 'text-nike-black' : 'text-white/80') : (isLight ? 'text-nike-light' : 'text-white/30')) + (c.unread > 0 ? ' font-bold' : '')}>
                        {c.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {activeId ? (
            <>
              {/* Chat header */}
              <div className={'p-4 border-b flex items-center gap-3 liquid-glass-card ' + (isLight ? 'border-nike-gray' : '')} style={!isLight ? { borderBottomColor: 'rgba(255,255,255,0.05)' } : {}}>
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2" style={{ '--tw-ring-color': 'var(--color-nike-gray)' }}>
                    {activeConv?.avatar ? (
                      <img src={mediaUrl(activeConv.avatar)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}>
                        {(activeConv?.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  {activeConv?.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 shadow-lg" style={{ borderColor: isLight ? 'white' : 'var(--color-nike-dark)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={'text-sm font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{activeConv?.username || 'User'}</p>
                    <div className={'w-1.5 h-1.5 rounded-full ' + (activeConv?.online ? 'bg-green-500' : 'bg-red-500')} />
                  </div>
                  <p className={'text-[10px] ' + (typing ? (isLight ? 'text-green-600' : 'text-green-400') : (activeConv?.online ? (isLight ? 'text-green-600' : 'text-green-400') : (isLight ? 'text-red-500' : 'text-red-400')))}>
                    {typing ? '● Typing…' : (activeConv?.online ? '● Online' : '○ Offline')}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className={'flex-1 overflow-y-auto p-4 space-y-1 ' + (isLight ? 'bg-white/70' : 'bg-nike-black/40')}>
                {chatLoading ? (
                  <div className="flex justify-center py-10"><Spinner /></div>
                ) : messages.length === 0 ? (
                  <div className={'flex flex-col items-center justify-center h-full text-center ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                    <div className="text-5xl mb-4">👋</div>
                    <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>No messages yet</p>
                    <p className={'text-xs mt-1 max-w-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Send a message to start the conversation with {activeConv?.username || 'this fighter'}.</p>
                  </div>
                ) : (
                  groupedMessages.map((item, i) => {
                    if (item.type === 'date') {
                      return (
                        <div key={'d' + i} className="flex justify-center pt-4 pb-2">
                          <span className={'px-3 py-1 rounded-full text-[10px] tracking-wider font-bold ' + (isLight ? 'bg-nike-gray/30 text-nike-light' : 'bg-white/5 text-white/30')}>{item.label}</span>
                        </div>
                      )
                    }
                    const isMe = item.sender === user?.id
                    const hasImage = !!item.image_url
                    const isViewOnce = !!item.view_once
                    const isViewed = !!item.viewed
                    return (
                      <div key={item.id} className={'flex items-end gap-2 ' + (isMe ? 'justify-end' : 'justify-start') + ' ' + (i > 0 && groupedMessages[i-1]?.type === 'msg' && groupedMessages[i-1]?.sender === item.sender ? 'mt-0.5' : 'mt-2')}>
                        <div className={'max-w-[75%] rounded-2xl text-sm leading-relaxed overflow-hidden ' + (
                          isMe
                            ? 'bg-nike-red text-white rounded-br-sm'
                            : (isLight ? 'bg-white border border-nike-gray/30 text-nike-black rounded-bl-sm' : 'bg-nike-dark border border-white/5 text-white rounded-bl-sm')
                        )}>
                          {hasImage && isViewOnce && !isMe && !isViewed && (
                            <button
                              onClick={() => handleViewOnceMessage(item.id, item.image_url)}
                              className="flex flex-col items-center justify-center gap-2 p-8 w-full min-h-[160px] cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 opacity-60"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              <span className="text-xs font-bold opacity-80 text-center">Sensitive content<br/>Tap to view</span>
                            </button>
                          )}
                          {hasImage && isViewOnce && !isMe && isViewed && (
                            <div className="flex flex-col items-center justify-center gap-2 p-8 w-full min-h-[120px]">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 opacity-60"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              <span className="text-xs opacity-80 text-center">View once image<br/>has been opened</span>
                            </div>
                          )}
                          {hasImage && isViewOnce && isMe && (
                            <div className="flex flex-col items-center justify-center gap-2 p-8 w-full min-h-[120px]">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 opacity-60"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              <span className="text-xs opacity-80 text-center">📷 View once photo<br/>Sent</span>
                            </div>
                          )}
                          {hasImage && !isViewOnce && (
                            <div className="relative">
                              <img
                                src={mediaUrl(item.image_url)}
                                alt=""
                                className={'w-full object-cover cursor-pointer'}
                                style={{ maxHeight: '300px' }}
                                onClick={() => setLightboxUrl(mediaUrl(item.image_url))}
                              />
                            </div>
                          )}
                          {(item.content || !hasImage) && (
                            <div className={'px-4 pt-2.5' + (hasImage && !item.content ? ' pb-2.5' : '')}>
                              {item.content && <p className="whitespace-pre-wrap break-words">{item.content}</p>}
                            </div>
                          )}
                          <div className={'flex items-center justify-end gap-1 px-4 pb-2.5 pt-1 ' + (isMe ? 'text-white/50' : (isLight ? 'text-nike-light' : 'text-white/30'))}>
                            <span className="text-[10px]">{formatTime(item.created_at)}</span>
                            {isMe && !item.delivered && (
                              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white/40">
                                <path d="M2 6l3 3 5-5"/>
                              </svg>
                            )}
                            {isMe && item.delivered && !item.read && (
                              <svg viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-3 text-white/40">
                                <path d="M2 6.5l3 3 5-5" opacity="0.4"/>
                                <path d="M10 6.5l3 3 5-5"/>
                              </svg>
                            )}
                            {isMe && item.read && (
                              <>
                                <svg viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-3 text-blue-400">
                                  <path d="M2 6.5l3 3 5-5" opacity="0.4"/>
                                  <path d="M10 6.5l3 3 5-5"/>
                                </svg>
                                <span className="text-[9px] text-blue-400 font-bold ml-0.5">Read</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className={'p-4 border-t liquid-glass-card ' + (isLight ? 'border-nike-gray' : '')} style={!isLight ? { borderTopColor: 'rgba(255,255,255,0.05)' } : {}}>
                {imagePreview && (
                  <div className="relative mb-2 inline-block">
                    <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl" />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                )}
                <div className={'flex items-end gap-2 p-2 rounded-2xl border transition-all duration-300 relative ' + (isLight
                  ? (input || imageFile ? 'border-nike-red/30 bg-white' : 'border-nike-gray bg-nike-gray/20')
                  : (input || imageFile ? 'border-white/30 bg-white/5' : 'border-white/10 bg-white/5')
                )}>
                  <button
                    onClick={() => setShowEmojiPicker((p) => !p)}
                    className={'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ' + (showEmojiPicker ? 'bg-nike-red/20 text-nike-red' : (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/30'))}
                    title="Emoji"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                  </button>
                  {showEmojiPicker && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} />}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ' + (imageFile ? 'bg-nike-red/20 text-nike-red' : (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/30'))}
                    title="Attach image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => setViewOnce((p) => !p)}
                    className={'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ' + (viewOnce ? 'bg-nike-red/20 text-nike-red' : (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/30'))}
                    title="View once"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    rows={1}
                    className={'flex-1 bg-transparent px-1 py-1 text-sm outline-none resize-none max-h-24 ' + (isLight ? 'text-nike-black placeholder:text-nike-light' : 'text-white placeholder:text-white/30')}
                    style={{ scrollbarWidth: 'none' }}
                    onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px' }}
                  />
                  <button
                    onClick={send}
                    disabled={!input.trim() && !imageFile}
                    className={'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ' + (input.trim() || imageFile
                      ? 'bg-nike-red text-white hover:bg-white hover:text-nike-black shadow-lg shadow-nike-red/30 hover:shadow-none'
                      : (isLight ? 'bg-nike-gray/50 text-nike-light' : 'bg-white/5 text-white/20')
                    )}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={'flex-1 flex items-center justify-center ' + (isLight ? 'bg-white/70' : 'bg-nike-black/40')}>
              <div className="text-center max-w-sm">
                <div className="text-6xl mb-4">💬</div>
                <p className={'text-lg font-black tracking-tight ' + (isLight ? 'text-nike-black' : 'text-white')}>Your Messages</p>
                <p className={'text-sm mt-2 leading-relaxed ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                  Select a conversation from the sidebar or start a new one with someone in your squad.
                </p>
                <button onClick={openNewChat} className="mt-6 inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-6 py-3 rounded-full text-xs tracking-widest uppercase font-bold transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
                  New Conversation
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewChat(false)} />
          <div className={'relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden liquid-glass-card'}>
            <div className={'px-6 py-5 border-b flex items-center justify-between ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
              <div>
                <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>New Conversation</p>
                <p className={'text-xs mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Select a fighter to message</p>
              </div>
              <button onClick={() => setShowNewChat(false)} className={'w-8 h-8 rounded-xl flex items-center justify-center transition-colors ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {contactsLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : contacts.length === 0 ? (
                <div className={'text-center py-12 px-6 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm font-bold">No contacts yet</p>
                  <p className="text-xs mt-1">Follow other fighters to start a conversation.</p>
                </div>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => startConvo(c.id)}
                    className={'w-full text-left px-6 py-4 flex items-center gap-4 transition-colors border-b ' + (isLight ? 'hover:bg-nike-gray/20 border-nike-gray/50' : 'hover:bg-white/5 border-white/5')}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2" style={{ '--tw-ring-color': 'var(--color-nike-gray)' }}>
                        {c.profile?.avatar ? (
                          <img src={mediaUrl(c.profile.avatar)} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}>
                            {(c.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 shadow-lg" style={{ borderColor: isLight ? 'white' : 'var(--color-nike-dark)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={'text-sm font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{c.username || 'Anonymous'}</p>
                      <p className={'text-xs truncate ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{c.role?.replace('_', ' ') || ''}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'w-4 h-4 shrink-0 ' + (isLight ? 'text-nike-light' : 'text-white/30')}><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} className="max-w-full max-h-full object-contain p-4" alt="" />
        </div>
      )}
    </div>
  )
}
