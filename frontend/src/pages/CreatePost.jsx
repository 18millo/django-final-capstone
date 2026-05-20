import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Button from '../components/ui/Button'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

const BG = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1920&q=80'

function isVideo(name) {
  return /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(name)
}

export default function CreatePost() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'
  const fileRef = useRef(null)
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'

  const isVideoFile = file && isVideo(file.name)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setFilePreview(URL.createObjectURL(f))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    playClick()
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('content', content)
      if (file) fd.append('file', file)
      const res = await api.post('/auth/posts/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      playSuccess()
      toast('Post created!', 'success')
      navigate('/forum/' + res.data.id)
    } catch (err) {
      const msg = err?.response?.data?.detail || ''
      if (msg.toLowerCase().includes('premium')) {
        navigate('/premium')
        return
      }
      toast(msg || 'Failed to create post', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(' + BG + ')' }} />
      <div className={'fixed inset-0 ' + (isLight ? 'bg-white/85' : 'bg-nike-black/85')} />
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        <Link to="/forum" className={'text-xs tracking-widest uppercase font-bold transition-colors mb-6 inline-block ' + mutedClass + ' hover:text-nike-red'}>← Back to Forum</Link>

        <div className={'rounded-2xl border p-6 liquid-glass-card ' + (isLight ? 'bg-white border-nike-gray' : 'bg-nike-dark border-white/5')}>
          <h1 className={'text-xl font-black tracking-tight mb-1 ' + textClass}>New Post</h1>
          <p className={'text-sm mb-6 ' + mutedClass}>Start a discussion with the community</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className={'block text-xs tracking-widest uppercase font-bold ' + mutedClass}>Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={6}
                required
                className={'w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-300 resize-none ' +
                  (isLight ? 'bg-nike-gray/10 border border-nike-gray text-nike-black placeholder:text-nike-light focus:border-nike-red/50' : 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/40')}
              />
            </div>

            <div className="space-y-1.5">
              <label className={'block text-xs tracking-widest uppercase font-bold ' + mutedClass}>Attachment (optional)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ' +
                  (isLight ? 'border-nike-gray hover:border-nike-red' : 'border-white/20 hover:border-white/40')}
              >
                {filePreview ? (
                  <div className="relative">
                    {isVideoFile ? (
                      <video src={filePreview} controls className="max-h-48 mx-auto rounded-lg" />
                    ) : (
                      <img src={filePreview} alt="" className="max-h-48 mx-auto rounded-lg" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setFilePreview('') }}
                      className="absolute top-2 right-2 bg-nike-red text-white w-6 h-6 rounded-full text-xs hover:bg-white hover:text-nike-black transition-all"
                    >
                      ×
                    </button>
                    <p className={'text-[10px] mt-1 ' + mutedClass}>{file?.name}</p>
                  </div>
                ) : (
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'w-8 h-8 mx-auto mb-2 ' + mutedClass}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <p className={'text-sm ' + mutedClass}>Upload an image, video, or GIF</p>
                    <p className={'text-[10px] mt-1 ' + mutedClass}>Any file type accepted</p>
                  </div>
                )}
                <input ref={fileRef} type="file" onChange={handleFileChange} className="hidden" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" loading={submitting} disabled={!content.trim()}>Publish</Button>
              <button
                type="button"
                onClick={() => navigate('/forum')}
                className={'px-6 py-2.5 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + borderClass + ' ' + mutedClass + ' hover:text-nike-red'}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}