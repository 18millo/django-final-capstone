import { useState } from 'react'
import { IconCheck } from '../components/Icons'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setForm({ name: '', email: '', subject: '', message: '' })
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-10">
        <p className="text-nike-red text-xs font-bold tracking-[0.25em] uppercase mb-2">Contact</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Get in Touch</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>Questions, feedback, or partnership inquiries</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="liquid-glass-card rounded-2xl p-6" style={{ border: '1px solid var(--theme-border)' }}>
          {sent ? (
            <div className="text-center py-12">
              <div className="mb-4"><IconCheck size={24} /></div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>Message Sent!</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-nike-red/50 transition-all duration-300"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                  placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-nike-red/50 transition-all duration-300"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                  placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Subject</label>
                <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-nike-red/50 transition-all duration-300"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                  placeholder="How can we help?" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Message</label>
                <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-nike-red/50 transition-all duration-300 resize-none"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                  placeholder="Tell us more..." />
              </div>
              <button type="submit" className="w-full bg-nike-red hover:bg-white hover:text-nike-black text-white font-bold py-3 rounded-xl text-sm tracking-wider transition-all duration-300">
                Send Message
              </button>
            </form>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="liquid-glass-card rounded-2xl p-6" style={{ border: '1px solid var(--theme-border)' }}>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Location</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>123 Combat Lane<br />Fight City, FC 10001<br />United States</p>
          </div>
          <div className="liquid-glass-card rounded-2xl p-6" style={{ border: '1px solid var(--theme-border)' }}>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Email</h3>
            <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>support@combathub.com</p>
            <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>sales@combathub.com</p>
          </div>
          <div className="liquid-glass-card rounded-2xl p-6" style={{ border: '1px solid var(--theme-border)' }}>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Hours</h3>
            <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Mon–Fri: 9am – 6pm EST</p>
            <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Sat: 10am – 4pm EST</p>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Sun: Closed</p>
          </div>
          <div className="liquid-glass-card rounded-2xl p-6" style={{ border: '1px solid var(--theme-border)' }}>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Follow Us</h3>
            <div className="flex gap-4 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              <span className="hover:[color:var(--theme-text)] cursor-pointer transition-colors">Instagram</span>
              <span className="hover:[color:var(--theme-text)] cursor-pointer transition-colors">X</span>
              <span className="hover:[color:var(--theme-text)] cursor-pointer transition-colors">YouTube</span>
              <span className="hover:[color:var(--theme-text)] cursor-pointer transition-colors">TikTok</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
