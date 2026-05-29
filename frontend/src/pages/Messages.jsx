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
import { IconBell, IconGroup, IconMessage, IconPhoto } from '../components/Icons'
import ScrollProgressBar from '../components/ui/ScrollProgressBar'


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
  const [activeChatType, setActiveChatType] = useState('user')
  const [showNewChat, setShowNewChat] = useState(false)
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupForm, setGroupForm] = useState({ name: '', description: '', is_private: false })
  const [groupCreating, setGroupCreating] = useState(false)
  const [showGroupSettings, setShowGroupSettings] = useState(false)
  const [groupDetail, setGroupDetail] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])
  const [updatingGroup, setUpdatingGroup] = useState(false)
  const [groupEditName, setGroupEditName] = useState('')
  const [groupEditDescription, setGroupEditDescription] = useState('')
  const [savingGroupEdit, setSavingGroupEdit] = useState(false)
  const [showEditGroup, setShowEditGroup] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [groupEditAvatar, setGroupEditAvatar] = useState(null)
  const [groupEditAvatarPreview, setGroupEditAvatarPreview] = useState(null)
  const [showPendingInvites, setShowPendingInvites] = useState(false)
  const [pendingInvites, setPendingInvites] = useState([])
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState([])
  const [searchingMembers, setSearchingMembers] = useState(false)
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
  const groupAvatarInputRef = useRef(null)
  const messagesRef = useRef(null)
  const sidebarRef = useRef(null)
  const newChatRef = useRef(null)
  const settingsRef = useRef(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [conversationFilter, setConversationFilter] = useState('all')
  const [showNotificationsTab, setShowNotificationsTab] = useState(false)
  const [notificationsList, setNotificationsList] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [inviteActionLoading, setInviteActionLoading] = useState(false)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('chat-opened'))
    api.get('/auth/conversations/')
      .then((res) => setConversations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const fetch = () => {
      api.get('/auth/conversations/')
        .then((res) => {
          setConversations((prev) => {
            const key = (c) => c.type === 'group' ? 'g' + c.group_id : 'u' + c.user_id
            const serverMap = new Map(res.data.map((c) => [key(c), c]))
            return prev.map((local) => {
              const k = key(local)
              const server = serverMap.get(k)
              if (!server) return null
              serverMap.delete(k)
              return server
            }).filter(Boolean).concat([...serverMap.values()])
          })
        })
        .catch(() => {})
    }
    fetch()
    const poll = setInterval(fetch, 30000)
    return () => clearInterval(poll)
  }, [])

  useEffect(() => {
    if (!activeId) return
    setChatLoading(true)
    const url = activeChatType === 'group'
      ? '/auth/groups/' + activeId + '/messages/'
      : '/auth/conversations/' + activeId + '/'
    api.get(url)
      .then((res) => {
        const data = res.data?.results || res.data || []
        setMessages(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
        api.get('/auth/conversations/').then((r) => setConversations(r.data || [])).catch(() => {})
      })
      .catch(() => setMessages([]))
      .finally(() => setChatLoading(false))
  }, [activeId, activeChatType])

  useEffect(() => {
    if (!activeId) return
    if (activeChatType === 'user') {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'mark_read' }))
      }
      api.get('/auth/conversations/' + activeId + '/').catch(() => {})
    } else if (activeChatType === 'group') {
      api.post('/auth/groups/' + activeId + '/read/').catch(() => {})
    }
    setConversations((prev) => prev.map((c) => {
      const match = activeChatType === 'group' ? c.group_id === activeId : c.user_id === activeId
      return match ? { ...c, unread: 0 } : c
    }))
  }, [activeId, activeChatType])

  useEffect(() => {
    const handler = (e) => {
      const { sender, sender_name, content, created_at } = e.detail
      if (!sender) return
      setConversations((prev) => {
        const existing = prev.find((c) => c.user_id === sender)
        if (existing) {
          return prev.map((c) =>
            c.user_id === sender
              ? { ...c, last_message: content || '📷 Photo', last_message_time: created_at || new Date().toISOString(), unread: c.user_id === activeId && activeChatType === 'user' ? 0 : (c.unread || 0) + 1 }
              : c
          )
        }
        return [{ user_id: sender, username: sender_name || 'User', avatar: null, last_message: content || '📷 Photo', last_message_time: created_at || new Date().toISOString(), unread: 1 }, ...prev].sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0))
      })
      if (sender === activeId && activeChatType === 'user') {
        api.get('/auth/conversations/' + activeId + '/')
          .then((res) => {
            const data = res.data?.results || res.data || []
            setMessages(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
          })
          .catch(() => {})
      }
    }
    window.addEventListener('new-message', handler)
    return () => window.removeEventListener('new-message', handler)
  }, [activeId, activeChatType])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const connectWs = useCallback(() => {
    if (!activeId || activeChatType !== 'user' || !user) return
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

    const isGroup = activeChatType === 'group'
    const tempId = 'temp_' + Date.now()
    const lastMsgText = !content && imageFile ? (imageFile ? '📷 Photo' : '') : content
    const optimistic = {
      id: tempId,
      sender: user.id,
      content: content || '',
      created_at: new Date().toISOString(),
      image_url: imagePreview || null,
    }
    setMessages((prev) => [optimistic, ...prev])

    if (isGroup) {
      const formData = new FormData()
      formData.append('content', content || '')
      if (imageFile) formData.append('image', imageFile)
      api.post('/auth/groups/' + activeId + '/messages/send/', imageFile ? formData : { content: content || '' }, imageFile ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
        .then(({ data }) => {
          setMessages((prev) => prev.map((m) => m.id === tempId ? data : m))
          setConversations((prev) => prev.map((c) => c.group_id === activeId ? { ...c, last_message: lastMsgText, last_message_time: data.created_at } : c).sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)))
          playSuccess()
        })
        .catch(() => {
          setMessages((prev) => prev.filter((m) => m.id !== tempId))
          toast('Failed to send message', 'error')
        })
      setInput('')
      setImageFile(null)
      setImagePreview(null)
      return
    }

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

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) { toast('Group name is required', 'error'); return }
    setGroupCreating(true)
    try {
      await api.post('/auth/groups/', groupForm)
      toast('Group created!', 'success')
      setShowCreateGroup(false)
      setGroupForm({ name: '', description: '', is_private: false })
      const { data } = await api.get('/auth/conversations/')
      setConversations(data || [])
    } catch (err) {
      const msg = err.response?.data?.name?.[0] || err.response?.data?.error?.[0] || err.response?.data?.detail || 'Failed to create group'
      toast(msg, 'error')
    } finally {
      setGroupCreating(false)
    }
  }

  const fetchNotifications = async () => {
    setNotifLoading(true)
    try {
      const res = await api.get('/auth/notifications/')
      setNotificationsList(res.data.results || res.data || [])
    } catch {
      setNotificationsList([])
    } finally {
      setNotifLoading(false)
    }
  }

  const markNotifRead = async (id) => {
    try {
      await api.post('/auth/notifications/' + id + '/read/')
      setNotificationsList((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    } catch {}
  }

  const markAllNotifRead = async () => {
    try {
      await api.post('/auth/notifications/read-all/')
      setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {}
  }

  const fetchGroupDetail = async () => {
    if (!activeId || activeChatType !== 'group') return
    try {
      const [detailRes, membersRes, invitesRes] = await Promise.all([
        api.get('/auth/groups/' + activeId + '/'),
        api.get('/auth/groups/' + activeId + '/members/'),
        api.get('/auth/groups/' + activeId + '/invites/').catch(() => ({ data: { results: [] } })),
      ])
      setGroupDetail(detailRes.data)
      setGroupEditName(detailRes.data.name || '')
      setGroupEditDescription(detailRes.data.description || '')
      setGroupMembers(membersRes.data.results || membersRes.data || [])
      setPendingInvites(invitesRes.data.results || invitesRes.data || [])
    } catch {}
  }

  const toggleGroupPrivacy = async () => {
    if (!groupDetail) return
    setUpdatingGroup(true)
    try {
      const res = await api.patch('/auth/groups/' + activeId + '/', { is_private: !groupDetail.is_private })
      setGroupDetail(res.data)
      const { data } = await api.get('/auth/conversations/')
      setConversations(data || [])
      toast('Group set to ' + (res.data.is_private ? 'private' : 'public'), 'success')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to update group', 'error')
    } finally {
      setUpdatingGroup(false)
    }
  }

  const handleSaveGroupEdit = async () => {
    if (!activeId || !groupEditName.trim()) return toast('Name is required', 'error')
    setSavingGroupEdit(true)
    try {
      const hasAvatar = groupEditAvatar instanceof File
      if (hasAvatar) {
        const fd = new FormData()
        fd.append('name', groupEditName.trim())
        fd.append('description', groupEditDescription.trim())
        fd.append('avatar', groupEditAvatar)
        const res = await api.patch('/auth/groups/' + activeId + '/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setGroupDetail(res.data)
      } else {
        const res = await api.patch('/auth/groups/' + activeId + '/', {
          name: groupEditName.trim(),
          description: groupEditDescription.trim(),
        })
        setGroupDetail(res.data)
      }
      setShowEditGroup(false)
      setGroupEditAvatar(null)
      setGroupEditAvatarPreview(null)
      toast('Group updated', 'success')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to update group', 'error')
    } finally {
      setSavingGroupEdit(false)
    }
  }

  useEffect(() => {
    if (showAddMember && memberResults.length === 0) searchUsers('__init__')
  }, [showAddMember])

  const removeMember = async (userId) => {
    try {
      await api.delete('/auth/groups/' + activeId + '/members/' + userId + '/')
      const [detailRes, membersRes, convRes] = await Promise.all([
        api.get('/auth/groups/' + activeId + '/'),
        api.get('/auth/groups/' + activeId + '/members/'),
        api.get('/auth/conversations/'),
      ])
      setGroupDetail(detailRes.data)
      setGroupMembers(membersRes.data.results || membersRes.data || [])
      setConversations(convRes.data || [])
      toast('Member removed', 'success')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to remove member', 'error')
    }
  }

  const cancelInvite = async (userId) => {
    try {
      await api.delete('/auth/groups/' + activeId + '/members/' + userId + '/')
      setPendingInvites((prev) => prev.filter((m) => m.user !== userId))
      toast('Invitation cancelled', 'success')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to cancel invite', 'error')
    }
  }

  const searchUsers = async (query) => {
    setSearchingMembers(true)
    try {
      const queryParam = query.trim() && query !== '__init__' ? `?search=${encodeURIComponent(query.trim())}` : ''
      const res = await api.get('/auth/users/' + queryParam)
      const all = res.data.results || res.data || []
      const memberIds = new Set(groupMembers.map((m) => m.user))
      const invitedIds = new Set(pendingInvites.map((m) => m.user))
      const filtered = all.filter((u) => u.id !== user.id && !memberIds.has(u.id) && !invitedIds.has(u.id))
      setMemberResults(filtered)
    } catch {
      setMemberResults([])
    } finally {
      setSearchingMembers(false)
    }
  }

  const inviteMember = async (username) => {
    try {
      const res = await api.post('/auth/groups/' + activeId + '/invite/', { username })
      toast(res.data?.detail || 'Invitation sent to ' + username, 'success')
      setShowAddMember(false)
      setMemberSearch('')
      setMemberResults([])
      fetchGroupDetail()
      const { data } = await api.get('/auth/conversations/')
      setConversations(data || [])
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to add member', 'error')
    }
  }

  const handleAcceptInvite = async () => {
    if (!activeId) return
    setInviteActionLoading(true)
    try {
      const res = await api.post('/auth/groups/' + activeId + '/respond-invite/', { action: 'accept' })
      toast(res.data?.detail || 'You accepted the invitation and are now part of the group', 'success')
      await Promise.all([
        fetchGroupDetail(),
        api.get('/auth/conversations/').then((r) => setConversations(r.data || [])),
        api.get('/auth/groups/' + activeId + '/messages/').then((r) => setMessages(r.data?.results || r.data || [])),
      ])
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to accept invite', 'error')
    } finally {
      setInviteActionLoading(false)
    }
  }

  const handleDeclineInvite = async () => {
    if (!activeId) return
    setInviteActionLoading(true)
    try {
      await api.post('/auth/groups/' + activeId + '/respond-invite/', { action: 'decline' })
      toast('Invitation declined', 'success')
      setConversations((prev) => prev.filter((c) => !(c.type === 'group' && c.group_id === activeId)))
      setActiveId(null)
      setActiveChatType('user')
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to decline invite', 'error')
    } finally {
      setInviteActionLoading(false)
    }
  }

  const handleBlockGroup = async () => {
    if (!activeId || activeChatType !== 'group') return
    try {
      await api.post('/auth/groups/' + activeId + '/block/')
      toast('Group blocked', 'success')
      setShowGroupSettings(false)
      setConversations((prev) => prev.filter((c) => !(c.type === 'group' && c.group_id === activeId)))
      setActiveId(null)
      setActiveChatType('user')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to block group', 'error')
    }
  }

  const handleLeaveGroup = async () => {
    if (!activeId || activeChatType !== 'group') return
    if (!confirm('Leave this group?')) return
    try {
      await api.post('/auth/groups/' + activeId + '/leave/')
      toast('You left the group', 'success')
      setShowGroupSettings(false)
      setConversations((prev) => prev.filter((c) => !(c.type === 'group' && c.group_id === activeId)))
      setActiveId(null)
      setActiveChatType('user')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to leave group', 'error')
    }
  }

  const handleDeleteGroup = async () => {
    if (!activeId || activeChatType !== 'group') return
    const otherMemberCount = groupMembers.filter((m) => m.user !== user?.id).length
    if (otherMemberCount > 0) {
      if (!confirm('Remove all other members before deleting the group.')) return
      return toast('Remove all members first, then delete again', 'error')
    }
    if (!confirm('Delete this group permanently? This cannot be undone.')) return
    try {
      await api.delete('/auth/groups/' + activeId + '/')
      toast('Group deleted', 'success')
      setShowGroupSettings(false)
      setConversations((prev) => prev.filter((c) => !(c.type === 'group' && c.group_id === activeId)))
      setActiveId(null)
      setActiveChatType('user')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to delete group', 'error')
    }
  }

  const handleBlockUser = async () => {
    if (!activeId || activeChatType !== 'user') return
    try {
      const res = await api.post('/auth/users/' + activeId + '/block/')
      toast(res.data.blocked ? 'User blocked' : 'User unblocked', 'success')
      setConversations((prev) => prev.filter((c) => !(c.type !== 'group' && c.user_id === activeId)))
      setActiveId(null)
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to block user', 'error')
    }
  }

  const activeConv = activeChatType === 'user'
    ? conversations.find((c) => c.user_id === activeId)
    : conversations.find((c) => c.group_id === activeId)

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
          <div className={'p-3 border-b flex flex-col gap-2 ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
            <div className="flex items-center justify-between">
              <div className={'flex items-center gap-2.5 px-3 py-2 rounded-xl ' + (isLight ? 'bg-nike-gray/30' : 'bg-white/5')}>
                {showNotificationsTab ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'w-4 h-4 shrink-0 ' + (isLight ? 'text-nike-light' : 'text-white/30')}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'w-4 h-4 shrink-0 ' + (isLight ? 'text-nike-light' : 'text-white/30')}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                )}
                <span className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{showNotificationsTab ? 'Notifications' : 'Messages'}</span>
              </div>
              <div className="flex items-center gap-1">
                {!showNotificationsTab && ['gym_owner', 'coach'].includes(user?.role) && (
                  <button
                    onClick={() => { playClick(); setShowCreateGroup(true) }}
                    className={'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40 hover:text-white')}
                    title="Create Group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </button>
                )}
                {!showNotificationsTab && (
                  <button
                    onClick={openNewChat}
                    className={'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40 hover:text-white')}
                    title="New conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                )}
              </div>
            </div>
            <div className={'flex rounded-xl overflow-hidden ' + (isLight ? 'bg-nike-gray/30' : 'bg-white/5')}>
              <button
                onClick={() => { playClick(); setShowNotificationsTab(false) }}
                className={'flex-1 px-3 py-1.5 text-[10px] tracking-widest uppercase font-bold transition-all duration-200 ' + (!showNotificationsTab
                  ? (isLight ? 'bg-nike-red text-white' : 'bg-nike-red text-white')
                  : (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')
                )}
              >
                Messages
              </button>
              <button
                onClick={() => { playClick(); setShowNotificationsTab(true); fetchNotifications() }}
                className={'flex-1 px-3 py-1.5 text-[10px] tracking-widest uppercase font-bold transition-all duration-200 ' + (showNotificationsTab
                  ? (isLight ? 'bg-nike-red text-white' : 'bg-nike-red text-white')
                  : (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/40 hover:text-white')
                )}
              >
                Notifications
              </button>
            </div>
          </div>
          {!showNotificationsTab && (
          <div className={'flex gap-0 px-3 pt-2 border-b ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
            {['all', 'personal', 'groups'].map((f) => (
              <button
                key={f}
                onClick={() => setConversationFilter(f)}
                className={'px-3 py-2 text-[10px] tracking-widest uppercase font-bold transition-all duration-200 border-b-2 ' + (conversationFilter === f
                  ? (isLight ? 'text-nike-black border-nike-red' : 'text-white border-nike-red')
                  : (isLight ? 'text-nike-light border-transparent hover:border-nike-gray' : 'text-white/40 border-transparent hover:border-white/10')
                )}
              >
                {f === 'all' ? 'All' : f === 'personal' ? 'Personal' : 'Groups'}
              </button>
            ))}
          </div>
          )}
          <div className="flex-1 overflow-y-auto relative" ref={sidebarRef}>
            <ScrollProgressBar scrollRef={sidebarRef} />
            {showNotificationsTab ? (
              notifLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : notificationsList.length === 0 ? (
                <div className={'text-center py-12 px-4 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                  <div className="text-3xl mb-2"><IconBell className="w-4 h-4" /></div>
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                <>
                  {notificationsList.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markNotifRead(n.id)}
                      className={'w-full text-left px-5 py-3 flex items-start gap-3 text-xs transition-colors border-b ' + (isLight ? 'border-nike-gray ' : 'border-white/5 ') + (n.read
                        ? (isLight ? 'text-nike-black/60' : 'text-white/60')
                        : (isLight ? 'text-nike-black bg-nike-red/5' : 'text-white bg-white/5')
                      )}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.notification_type === 'follow' ? (
                          <svg className="w-5 h-5" style={{ color: 'var(--color-nike-red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        ) : n.notification_type === 'group_join' ? (
                          <svg className="w-5 h-5" style={{ color: 'var(--color-nike-red)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v2m0 0v2m0-2h-2m2 0h2" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" style={{ color: 'var(--color-nike-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={n.read ? '' : 'font-bold'}>{n.message}</p>
                        <p className={'mt-0.5 ' + (isLight ? 'text-nike-black/40' : 'text-white/40')}>{new Date(n.created_at).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))}
                  {notificationsList.some((n) => !n.read) && (
                    <button
                      onClick={markAllNotifRead}
                      className={'w-full px-5 py-2.5 text-xs tracking-widest uppercase font-bold text-center transition-colors border-t ' + (isLight ? 'text-nike-red border-nike-gray hover:bg-nike-red/5' : 'text-nike-red border-white/5 hover:bg-nike-red/10')}
                    >
                      Mark all as read
                    </button>
                  )}
                </>
              )
            ) : loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : conversations.filter((c) => conversationFilter === 'all' || (conversationFilter === 'personal' ? !c.type : c.type === 'group')).length === 0 ? (
              <div className={'text-center py-12 px-4 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                <div className="text-3xl mb-2"><IconMessage className="w-4 h-4" /></div>
                <p className="text-xs">{conversationFilter === 'groups' ? 'No groups yet' : 'No conversations yet'}</p>
                {conversationFilter !== 'groups' && (
                  <button onClick={openNewChat} className="mt-3 text-xs tracking-widest uppercase font-bold bg-nike-red text-white px-4 py-2 rounded-full hover:bg-white hover:text-nike-black transition-all duration-300">
                    + New Chat
                  </button>
                )}
              </div>
            ) : (
              conversations.filter((c) => conversationFilter === 'all' || (conversationFilter === 'personal' ? !c.type : c.type === 'group')).map((c, i) => {
                const isGroup = c.type === 'group'
                const convId = isGroup ? c.group_id : c.user_id
                const active = isGroup ? c.group_id === activeId && activeChatType === 'group' : c.user_id === activeId && activeChatType === 'user'
                return (
                  <button
                    key={isGroup ? 'g' + (c.group_id ?? i) : 'u' + (c.user_id ?? i)}
                    onClick={() => { playClick(); setActiveChatType(isGroup ? 'group' : 'user'); setActiveId(convId) }}
                    className={'w-full text-left p-4 flex items-center gap-3 transition-all duration-200 border-b ' + (isLight
                      ? (active ? 'bg-nike-red/5 border-nike-gray' : 'hover:bg-nike-gray/20 border-nike-gray')
                      : (active ? 'bg-white/5 border-white/5' : 'hover:bg-white/5 border-white/5')
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className={'w-10 h-10 overflow-hidden ring-2 flex items-center justify-center text-sm font-bold ' + (isGroup ? 'rounded-xl' : 'rounded-full')} style={{ '--tw-ring-color': 'var(--color-nike-gray)', backgroundColor: isGroup ? 'rgba(220,38,38,0.15)' : 'var(--color-nike-gray)', color: isGroup ? 'var(--color-nike-red)' : 'var(--color-nike-light)' }}>
                        {c.avatar ? (
                          <img src={mediaUrl(c.avatar)} className="w-full h-full object-cover" alt="" />
                        ) : isGroup ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        ) : (
                          (c.username || '?')[0].toUpperCase()
                        )}
                      </div>
                      {c.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-nike-red rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-nike-red/30">
                          {c.unread > 9 ? '9+' : c.unread}
                        </div>
                      )}
                      {!isGroup && c.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 shadow-lg" style={{ borderColor: isLight ? 'white' : 'var(--color-nike-dark)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={'text-xs font-bold truncate ' + (c.unread > 0 ? (isLight ? 'text-nike-black' : 'text-white') : (isLight ? 'text-nike-black/70' : 'text-white/60'))}>
                          {c.username}{isGroup ? <span className={'ml-1 text-[9px] font-normal ' + (isLight ? 'text-nike-light' : 'text-white/30')}>· {c.member_count || 0}</span> : ''}
                        </p>
                        {c.last_message_time && (
                          <p className={'text-[10px] shrink-0 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{timeAgo(c.last_message_time)}</p>
                        )}
                      </div>
                      <p className={'text-[10px] truncate mt-0.5 ' + (c.unread > 0 ? (isLight ? 'text-nike-black' : 'text-white/80') : (isLight ? 'text-nike-light' : 'text-white/30')) + (c.unread > 0 ? ' font-bold' : '')}>
                        {c.last_message || (isGroup ? 'No messages yet' : 'No messages yet')}
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
                  <div className={'w-9 h-9 overflow-hidden ring-2 flex items-center justify-center text-xs font-bold ' + (activeChatType === 'group' ? 'rounded-xl' : 'rounded-full')} style={{ '--tw-ring-color': 'var(--color-nike-gray)', backgroundColor: activeChatType === 'group' ? 'rgba(220,38,38,0.15)' : 'var(--color-nike-gray)', color: 'var(--color-nike-light)' }}>
                    {activeConv?.avatar ? (
                      <img src={mediaUrl(activeConv.avatar)} className="w-full h-full object-cover" alt="" />
                    ) : activeChatType === 'group' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: 'var(--color-nike-red)' }}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    ) : (
                      (activeConv?.username || '?')[0].toUpperCase()
                    )}
                  </div>
                  {activeChatType !== 'group' && activeConv?.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 shadow-lg" style={{ borderColor: isLight ? 'white' : 'var(--color-nike-dark)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={'text-sm font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{activeConv?.username || (activeChatType === 'group' ? 'Group' : 'User')}</p>
                    {activeChatType === 'group' ? (
                      <div className="flex items-center gap-2 flex-1">
                        <span className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{activeConv?.member_count || 0} members</span>
                        <button
                          onClick={() => { playClick(); setShowGroupSettings(true); fetchGroupDetail() }}
                          className={'ml-auto w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40 hover:text-white')}
                          title="Group Settings"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className={'w-1.5 h-1.5 rounded-full ' + (activeConv?.online ? 'bg-green-500' : 'bg-red-500')} />
                        <button
                          onClick={handleBlockUser}
                          className={'ml-auto w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40 hover:text-white')}
                          title="Block User"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        </button>
                      </>
                    )}
                  </div>
                  {activeChatType !== 'group' && (
                    <p className={'text-[10px] ' + (typing ? (isLight ? 'text-green-600' : 'text-green-400') : (activeConv?.online ? (isLight ? 'text-green-600' : 'text-green-400') : (isLight ? 'text-red-500' : 'text-red-400')))}>
                      {typing ? '● Typing…' : (activeConv?.online ? '● Online' : '○ Offline')}
                    </p>
                  )}
                </div>
              </div>

              {/* Invite banner */}
              {activeChatType === 'group' && activeConv?.my_status === 'invited' && (
                <div className={'p-4 text-center border-b ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
                  <p className={'text-sm font-bold mb-1 ' + (isLight ? 'text-nike-black' : 'text-white')}>You've been invited to this group</p>
                  <p className={'text-xs mb-3 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Accept to join and start chatting</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleAcceptInvite}
                      disabled={inviteActionLoading}
                      className="px-5 py-2 bg-nike-red text-white rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-nike-black transition-all disabled:opacity-50"
                    >
                      {inviteActionLoading ? '...' : 'Accept Invite'}
                    </button>
                    <button
                      onClick={handleDeclineInvite}
                      disabled={inviteActionLoading}
                      className={'px-5 py-2 rounded-xl text-xs font-bold tracking-widest uppercase border transition-all disabled:opacity-50 ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-gray/30' : 'border-white/10 text-white/40 hover:bg-white/10')}
                    >
                      {inviteActionLoading ? '...' : 'Decline'}
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className={'flex-1 overflow-y-auto p-4 space-y-1 relative ' + (isLight ? 'bg-white/70' : 'bg-nike-black/40')} ref={messagesRef}>
                <ScrollProgressBar scrollRef={messagesRef} />
                {chatLoading ? (
                  <div className="flex justify-center py-10"><Spinner /></div>
                ) : messages.length === 0 ? (
                  <div className={'flex flex-col items-center justify-center h-full text-center ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                    <div className="text-5xl mb-4">{activeChatType === 'group' ? '👥' : '👋'}</div>
                    <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>No messages yet</p>
                    <p className={'text-xs mt-1 max-w-xs ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{activeChatType === 'group' ? 'Be the first to send a message in this group.' : 'Send a message to start the conversation with ' + (activeConv?.username || 'this fighter') + '.'}</p>
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
                    const senderName = activeChatType === 'group' ? (item.sender_username || item.sender_name || null) : null
                    if (item.is_system) {
                      return (
                        <div key={item.id} className="flex justify-center py-2">
                          <span className={'text-xs font-medium px-4 py-1.5 rounded-full ' + (isLight ? 'bg-nike-gray/20 text-nike-light' : 'bg-white/5 text-white/40')}>{item.content}</span>
                        </div>
                      )
                    }
                    return (
                      <div key={item.id} className={activeChatType === 'group' ? 'flex flex-col ' : ''}>
                        {activeChatType === 'group' && !isMe && (
                          <p className={'text-[9px] px-1 mb-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/30') + ' ' + (i > 0 && groupedMessages[i-1]?.type === 'msg' && groupedMessages[i-1]?.sender === item.sender ? 'hidden' : '')}>{senderName || 'Unknown'}</p>
                        )}
                        <div className={'flex items-end gap-2 ' + (isMe ? 'justify-end' : 'justify-start') + ' ' + (i > 0 && groupedMessages[i-1]?.type === 'msg' && groupedMessages[i-1]?.sender === item.sender ? 'mt-0.5' : 'mt-2')}>
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
                              <span className="text-xs opacity-80 text-center"><IconPhoto className="w-4 h-4" /> View once photo<br/>Sent</span>
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
                    </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className={'p-4 border-t liquid-glass-card ' + (isLight ? 'border-nike-gray' : '')} style={!isLight ? { borderTopColor: 'rgba(255,255,255,0.05)' } : {}}>
                {activeChatType === 'group' && activeConv?.my_status === 'invited' ? (
                  <div className={'text-center py-3 text-xs ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                    Accept the invitation above to start chatting
                  </div>
                ) : (
                <>
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
                  {activeChatType !== 'group' && (
                    <button
                      onClick={() => setViewOnce((p) => !p)}
                      className={'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ' + (viewOnce ? 'bg-nike-red/20 text-nike-red' : (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/30'))}
                      title="View once"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  )}
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
                </>
                )}
              </div>
            </>
          ) : (
            <div className={'flex-1 flex items-center justify-center ' + (isLight ? 'bg-white/70' : 'bg-nike-black/40')}>
              <div className="text-center max-w-sm">
                <div className="text-6xl mb-4"><IconMessage className="w-4 h-4" /></div>
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
            <div className="max-h-96 overflow-y-auto relative" ref={newChatRef}>
              <ScrollProgressBar scrollRef={newChatRef} />
              {contactsLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : contacts.length === 0 ? (
                <div className={'text-center py-12 px-6 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>
                  <div className="text-3xl mb-2"><IconGroup className="w-4 h-4" /></div>
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

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateGroup(false)} />
          <div className={'relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden liquid-glass-card'}>
            <div className={'px-6 py-5 border-b flex items-center justify-between ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
              <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Create Group</p>
              <button onClick={() => setShowCreateGroup(false)} className={'w-8 h-8 rounded-xl flex items-center justify-center transition-colors ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Group Name</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="Enter group name"
                  className={'w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all ' + (isLight ? 'bg-white border-nike-gray text-nike-black placeholder:text-nike-light focus:border-nike-red' : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30')}
                />
              </div>
              <div>
                <label className={'block text-xs tracking-widest uppercase font-bold mb-1.5 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Description</label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="What's this group about?"
                  rows={3}
                  className={'w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all resize-none ' + (isLight ? 'bg-white border-nike-gray text-nike-black placeholder:text-nike-light focus:border-nike-red' : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Private Group</p>
                  <p className={'text-xs mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Only approved members can join</p>
                </div>
                <button
                  onClick={() => setGroupForm({ ...groupForm, is_private: !groupForm.is_private })}
                  className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (groupForm.is_private ? 'bg-nike-red' : 'bg-nike-gray')}
                >
                  <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (groupForm.is_private ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              </div>
              <button
                onClick={handleCreateGroup}
                disabled={groupCreating}
                className="w-full py-3 bg-nike-red text-white rounded-xl text-xs tracking-widest uppercase font-bold hover:bg-white hover:text-nike-black transition-all duration-300 disabled:opacity-50"
              >
                {groupCreating ? 'Creating…' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showGroupSettings && groupDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowGroupSettings(false); setShowAddMember(false); setShowEditGroup(false); setGroupEditAvatar(null); setGroupEditAvatarPreview(null); setMemberSearch(''); setMemberResults([]) }} />
          <div className={'relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden liquid-glass-card'}>
            <div className={'px-6 py-5 border-b flex items-center justify-between ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
              <div>
                <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>{groupDetail.name}</p>
                <p className={'text-xs mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Group Settings</p>
              </div>
              <button onClick={() => { setShowGroupSettings(false); setShowAddMember(false); setShowEditGroup(false); setGroupEditAvatar(null); setGroupEditAvatarPreview(null); setMemberSearch(''); setMemberResults([]) }} className={'w-8 h-8 rounded-xl flex items-center justify-center transition-colors ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40')}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto relative" ref={settingsRef}>
              <ScrollProgressBar scrollRef={settingsRef} />
              {/* Privacy toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className={'text-sm font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Private Group</p>
                  <p className={'text-xs mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Only approved members can join</p>
                </div>
                <button
                  onClick={toggleGroupPrivacy}
                  disabled={updatingGroup}
                  className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (groupDetail.is_private ? 'bg-nike-red' : 'bg-nike-gray')}
                >
                  <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (groupDetail.is_private ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              </div>

              {/* Members list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Members ({groupMembers.length})</p>
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className={'text-xs font-bold px-3 py-1.5 rounded-lg transition-all ' + (isLight ? 'bg-nike-gray/30 text-nike-black hover:bg-nike-gray/50' : 'bg-white/10 text-white hover:bg-white/20')}
                  >
                    {showAddMember ? 'Cancel' : '+ Add Member'}
                  </button>
                </div>

                {/* Add member search */}
                {showAddMember && (
                  <div className={'mb-3 p-3 rounded-xl border ' + (isLight ? 'border-nike-gray bg-nike-gray/10' : 'border-white/10 bg-white/5')}>
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => { setMemberSearch(e.target.value); searchUsers(e.target.value) }}
                      placeholder="Search members…"
                      className={'w-full px-3 py-2 rounded-lg text-sm outline-none border transition-all ' + (isLight ? 'bg-white border-nike-gray text-nike-black placeholder:text-nike-light' : 'bg-white/5 border-white/10 text-white placeholder:text-white/30')}
                    />
                    {searchingMembers && <p className={'text-xs mt-2 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Searching users…</p>}
                    {memberResults.length > 0 && (
                      <div className={'mt-2 max-h-40 overflow-y-auto space-y-1 '}>
                        {memberResults.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => inviteMember(m.username)}
                            className={'w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 text-sm transition-colors ' + (isLight ? 'hover:bg-nike-gray/30' : 'hover:bg-white/10')}
                          >
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-nike-gray/30 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--color-nike-light)' }}>
                              {(m.username || '?')[0].toUpperCase()}
                            </div>
                            <span className={'font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{m.username}</span>
                            <span className={'text-[10px] ml-auto ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{m.role?.replace('_', ' ')}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!searchingMembers && memberResults.length === 0 && (
                      <p className={'text-xs mt-2 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>No users found</p>
                    )}
                  </div>
                )}

                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {groupMembers.map((m) => (
                    <div key={m.id || m.user} className={'flex items-center justify-between p-3 rounded-xl transition-colors ' + (isLight ? 'hover:bg-nike-gray/20' : 'hover:bg-white/5')}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-nike-gray/30 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--color-nike-light)' }}>
                          {m.avatar ? <img src={mediaUrl(m.avatar)} className="w-full h-full object-cover" alt="" /> : (m.username || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={'text-sm font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{m.username || 'User'}</p>
                          <p className={'text-[10px] ' + (isLight ? 'text-nike-light' : 'text-white/30')}>{m.role === 'admin' ? 'Admin' : 'Member'}</p>
                        </div>
                      </div>
                      {groupDetail.created_by === user.id && m.user !== user.id && (
                        <button
                          onClick={() => removeMember(m.user)}
                          className={'text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all border ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-red hover:text-white hover:border-nike-red' : 'border-white/10 text-white/40 hover:bg-nike-red hover:text-white hover:border-nike-red')}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pending Invites */}
                {pendingInvites.length > 0 && (
                  <div className={'mt-4 pt-4 border-t ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
                    <button
                      onClick={() => setShowPendingInvites(!showPendingInvites)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <p className={'text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-light' : 'text-white/40')}>Pending Invites ({pendingInvites.length})</p>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'w-4 h-4 transition-transform ' + (showPendingInvites ? 'rotate-180' : '') + ' ' + (isLight ? 'text-nike-light' : 'text-white/40')}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {showPendingInvites && (
                      <div className="space-y-1 mt-3 max-h-40 overflow-y-auto">
                        {pendingInvites.map((m) => (
                          <div key={m.id || m.user} className={'flex items-center justify-between p-3 rounded-xl transition-colors ' + (isLight ? 'hover:bg-nike-gray/20' : 'hover:bg-white/5')}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-nike-gray/30 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--color-nike-light)' }}>
                                {m.avatar ? <img src={mediaUrl(m.avatar)} className="w-full h-full object-cover" alt="" /> : (m.username || '?')[0].toUpperCase()}
                              </div>
                              <p className={'text-sm font-bold truncate ' + (isLight ? 'text-nike-black' : 'text-white')}>{m.username || 'User'}</p>
                            </div>
                            <button
                              onClick={() => cancelInvite(m.user)}
                              className={'text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all border ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-red hover:text-white hover:border-nike-red' : 'border-white/10 text-white/40 hover:bg-nike-red hover:text-white hover:border-nike-red')}
                            >
                              Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Edit name/description (creator only) */}
              {groupDetail.created_by === user?.id && (
                <div className={'pb-4 border-b ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
                  <button
                    onClick={() => setShowEditGroup(!showEditGroup)}
                    className="flex items-center gap-2 text-xs tracking-widest uppercase font-bold transition-colors"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Group
                    <svg className={'w-3 h-3 ml-auto transition-transform ' + (showEditGroup ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showEditGroup && (
                    <div className="mt-3 space-y-3">
                      {/* Avatar */}
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => groupAvatarInputRef.current?.click()}
                          className={'relative w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-bold text-lg ring-2 transition-all hover:ring-nike-red/50 ' + (isLight ? 'ring-nike-gray bg-nike-gray/20' : 'ring-white/10 bg-white/5')}
                        >
                          {groupEditAvatarPreview ? (
                            <img src={groupEditAvatarPreview} className="w-full h-full object-cover" alt="" />
                          ) : groupDetail.avatar ? (
                            <img src={mediaUrl(groupDetail.avatar)} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className={'text-base ' + (isLight ? 'text-nike-light' : 'text-white/40')}>{(groupDetail.name || 'G')[0].toUpperCase()}</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={'text-xs font-bold ' + (isLight ? 'text-nike-black' : 'text-white')}>Group Avatar</p>
                          <p className={'text-[10px] mt-0.5 ' + (isLight ? 'text-nike-light' : 'text-white/30')}>Click to upload a new image</p>
                        </div>
                        <input
                          ref={groupAvatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setGroupEditAvatar(file)
                              setGroupEditAvatarPreview(URL.createObjectURL(file))
                            }
                          }}
                          className="hidden"
                        />
                        {groupEditAvatarPreview && (
                          <button
                            onClick={() => { setGroupEditAvatar(null); setGroupEditAvatarPreview(null) }}
                            className={'text-xs px-2 py-1 rounded-lg transition-colors ' + (isLight ? 'text-nike-light hover:bg-nike-gray/30' : 'text-white/40 hover:bg-white/10')}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        value={groupEditName}
                        onChange={(e) => setGroupEditName(e.target.value)}
                        placeholder="Group name"
                        className={'w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ' + (isLight ? 'bg-nike-gray/30 text-nike-black border-nike-gray focus:border-nike-red/50' : 'bg-white/5 text-white border-white/10 focus:border-white/40')}
                      />
                      <textarea
                        value={groupEditDescription}
                        onChange={(e) => setGroupEditDescription(e.target.value)}
                        placeholder="Group description"
                        rows={2}
                        className={'w-full px-4 py-2.5 rounded-xl text-sm outline-none border resize-none transition-all ' + (isLight ? 'bg-nike-gray/30 text-nike-black border-nike-gray focus:border-nike-red/50' : 'bg-white/5 text-white border-white/10 focus:border-white/40')}
                      />
                      <button
                        onClick={handleSaveGroupEdit}
                        disabled={savingGroupEdit}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-nike-red text-white hover:bg-white hover:text-nike-black transition-all disabled:opacity-50"
                      >
                        {savingGroupEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Leave / Delete / Block group */}
              <div className={'pt-4 border-t flex gap-3 ' + (isLight ? 'border-nike-gray' : 'border-white/5')}>
                {groupDetail.created_by === user?.id ? (
                  <button
                    onClick={handleDeleteGroup}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase border border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white transition-all"
                  >
                    Delete Group
                  </button>
                ) : (
                  <button
                    onClick={handleLeaveGroup}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase border border-nike-red/30 text-nike-red hover:bg-nike-red hover:text-white transition-all"
                  >
                    Leave Group
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!confirm('Block this group? You will leave it and it will be hidden.')) return
                    handleBlockGroup()
                  }}
                  className={'flex-1 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:bg-nike-red hover:text-white hover:border-nike-red' : 'border-white/10 text-white/40 hover:bg-nike-red hover:text-white hover:border-nike-red')}
                >
                  Block Group
                </button>
              </div>
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
