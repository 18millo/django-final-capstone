import { useState, useEffect } from 'react'
import api from '../api'

export default function Brands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/shop/brands/')
      .then(({ data }) => setBrands(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    setError('')
    try {
      const { data } = await api.post('/shop/brands/', { name: name.trim(), description: description.trim() })
      setBrands((prev) => [...prev, data])
      setShowModal(false)
      setName('')
      setDescription('')
    } catch {
      setError('Failed to create brand')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>Brands</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm tracking-wider transition-colors"
        >
          + New Brand
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm py-12 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading brands...</div>
      ) : brands.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>No brands registered yet.</p>
          <p className="text-xs mt-2" style={{ color: 'var(--theme-text-muted)' }}>Create a brand to use in your products.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {brands.map((b) => (
            <div
              key={b.id}
              className="rounded-xl p-4 animate-slideUp"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
            >
              <h3 className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>{b.name}</h3>
              {b.description && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--theme-text-secondary)' }}>{b.description}</p>
              )}
              <p className="text-[10px] mt-2 uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                {b.is_approved ? 'Approved' : 'Pending'}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div
            className="rounded-2xl p-6 w-full max-w-md mx-4 animate-slideUp"
            style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black mb-4" style={{ color: 'var(--theme-text)' }}>Register Brand</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>Brand Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hayabusa"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 resize-none"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm tracking-wider transition-colors"
              >
                {creating ? 'Creating...' : 'Register'}
              </button>
              <button
                onClick={() => { setShowModal(false); setName(''); setDescription('') }}
                className="px-6 py-2.5 rounded-lg text-sm transition-colors"
                style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
