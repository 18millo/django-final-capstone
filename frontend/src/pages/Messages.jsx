import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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

  useEffect(() => {
    api.get('/auth/conversations/')
      .then((res) => setConversations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!conversations.length) return
    const poll = setInterval(() => {
      api.get('/auth/conversations/')
        .then((res) => {
          setConversations((prev) => {
            const merged = [...res.data]
            for (const c of prev) {
              if (!merged.find((m) => m.user_id === c.user_id)) merged.push(c)
            }
            return merged
          })
        })
        .catch(() => {})
    }, 10000)
    return () => clearInterval(poll)
  }, [conversations.length > 0])

  useEffect(() => {
    if (activeId) {
      setChatLoading(true)
      api.get('/auth/conversations/' + activeId + '/')
        .then((res) => setMessages(res.data))
        .catch(() => {})
        .finally(() => setChatLoading(false))
    }
  }, [activeId])

  useEffect(() => {
    if (activeId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mark_read' }))
    }
  }, [activeId, messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const connectWs = useCallback(() => {
    if (!activeId || !user) return
    const token = localStorage.getItem('access_token')
    if (!token) return
    const url = WS_BASE + '/ws/chat/' + activeId + '/?token=' + token

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
            return [{ id: data.id, sender: data.sender, content: data.content, created_at: data.created_at, read: data.read }, ...prev]
          })
          if (data.sender !== user.id) {
            playSuccess()
          }
          setConversations((prev) => prev.map((c) =>
            c.user_id === (data.sender === user.id ? parseInt(activeId) : data.sender)
              ? { ...c, last_message: data.content, last_message_time: data.created_at, unread: data.sender !== user.id ? (c.unread || 0) + 1 : c.unread }
              : c
          ))
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'mark_read' }))
          }
        } else if (data.type === 'messages_read') {
          setMessages((prev) => prev.map((m) =>
            m.sender === data.read_by ? { ...m, read: true } : m
          ))
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

  const send = () => {
    const content = input.trim()
    if (!content || !activeId) return
    setInput('')
    setShowEmojiPicker(false)
    playClick()

    const tempId = 'temp_' + Date.now()
    const optimistic = { id: tempId, sender: user.id, content, created_at: new Date().toISOString(), read: false }
    setMessages((prev) => [optimistic, ...prev])

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }))
      setConversations((prev) => prev.map((c) => c.user_id === activeId ? { ...c, last_message: content, last_message_time: new Date().toISOString() } : c))
      playSuccess()
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      api.post('/auth/conversations/' + activeId + '/send/', { content })
        .then(({ data }) => {
          setMessages((prev) => [data, ...prev])
          setConversations((prev) => prev.map((c) => c.user_id === activeId ? { ...c, last_message: data.content, last_message_time: data.created_at } : c))
          playSuccess()
        })
        .catch(() => toast('Failed to send message', 'error'))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
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
        setConversations((prev) => [{ user_id: u.id, username: u.username || u.display_name || 'User', avatar: u.profile?.avatar, unread: 0 }, ...prev])
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
        <div className={'w-72 shrink-0 border-r flex flex-col ' + (isLight ? 'border-nike-gray bg-white/90' : 'border-white/5 bg-nike-dark/80')}>
          <div className={'p-4 border-b flex items-center justify-between ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
            <div className={'flex items-center gap-2.5 px-3 py-2 rounded-xl ' + (isLight ? 'bg-nike-gray/30' : 'bg-white/5')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'w-4 h-4 shrink-0 ' + (isLight ? 'text-nike-light' : 'text-white/30')}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Messages</span>
            </div>
            <button
              onClick={openNewChat}
              className={'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40 hover:text-white')}
              title="New conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
            </button>
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
                        <>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-nike-red rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-nike-red/30">
                            {c.unread > 9 ? '9+' : c.unread}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 shadow-lg" style={{ borderColor: isLight ? 'white' : 'var(--color-nike-dark)' }} />
                        </>
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
              <div className={'p-4 border-b flex items-center gap-3 ' + (isLight ? 'border-nike-gray bg-white/90' : 'border-white/5 bg-nike-dark/80')}>
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
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 shadow-lg" style={{ borderColor: isLight ? 'white' : 'var(--color-nike-dark)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={'text-sm font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{activeConv?.username || 'User'}</p>
                    <div className={'w-1.5 h-1.5 rounded-full ' + (wsConnected ? 'bg-green-500' : 'bg-red-500')} />
                  </div>
                  <p className={'text-[10px] ' + (wsConnected ? (isLight ? 'text-green-600' : 'text-green-400') : (isLight ? 'text-red-500' : 'text-red-400'))}>
                    {wsConnected ? '● Real-time connected' : '○ Reconnecting…'}
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
                    return (
                      <div key={item.id} className={'flex items-end gap-2 ' + (isMe ? 'justify-end' : 'justify-start') + ' ' + (i > 0 && groupedMessages[i-1]?.type === 'msg' && groupedMessages[i-1]?.sender === item.sender ? 'mt-0.5' : 'mt-2')}>
                        <div className={'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ' + (
                          isMe
                            ? 'bg-nike-red text-white rounded-br-sm'
                            : (isLight ? 'bg-white border border-nike-gray/30 text-nike-black rounded-bl-sm' : 'bg-nike-dark border border-white/5 text-white rounded-bl-sm')
                        )}>
                          <p className="whitespace-pre-wrap break-words">{item.content}</p>
                          <div className={'flex items-center justify-end gap-1 mt-1 ' + (isMe ? 'text-white/50' : (isLight ? 'text-nike-light' : 'text-white/30'))}>
                            <span className="text-[10px]">{formatTime(item.created_at)}</span>
                            {isMe && !item.read && (
                              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white/40">
                                <path d="M2 6l3 3 5-5"/>
                              </svg>
                            )}
                            {isMe && item.read && (
                              <svg viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-3 text-blue-400">
                                <path d="M2 6.5l3 3 5-5" opacity="0.4"/>
                                <path d="M10 6.5l3 3 5-5"/>
                              </svg>
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
              <div className={'p-4 border-t ' + (isLight ? 'border-nike-gray bg-white/90' : 'border-white/5 bg-nike-dark/80')}>
                <div className={'flex items-end gap-2 p-2 rounded-2xl border transition-all duration-300 relative ' + (isLight
                  ? (input ? 'border-nike-red/30 bg-white' : 'border-nike-gray bg-nike-gray/20')
                  : (input ? 'border-white/30 bg-white/5' : 'border-white/10 bg-white/5')
                )}>
                  <button
                    onClick={() => setShowEmojiPicker((p) => !p)}
                    className={'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ' + (showEmojiPicker ? 'bg-nike-red/20 text-nike-red' : (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/30'))}
                    title="Emoji"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                  </button>
                  {showEmojiPicker && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} />}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    rows={1}
                    className={'flex-1 bg-transparent px-1 py-1 text-sm outline-none resize-none max-h-24 ' + (isLight ? 'text-nike-black placeholder:text-nike-light' : 'text-white placeholder:text-white/30')}
                    style={{ scrollbarWidth: 'none' }}
                    onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px' }}
                  />
                  <button
                    onClick={send}
                    disabled={!input.trim()}
                    className={'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ' + (input.trim()
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
          <div className={'relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl overflow-hidden ' + (isLight ? 'bg-white border-nike-gray shadow-lg' : 'bg-nike-dark border-white/5')}>
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
    </div>
  )
}
