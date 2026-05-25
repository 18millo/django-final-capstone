import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState({
    name: '',
    description: '',
    brand: '',
    price: '',
    stock: '',
    category: '',
    sport_tags: '',
    images: '',
    limited_edition: false,
    discount_active: false,
    discount_percent: '',
    drop_date: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [brands, setBrands] = useState([])
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandDesc, setNewBrandDesc] = useState('')
  const [localPreviews, setLocalPreviews] = useState([])
  const [creatingBrand, setCreatingBrand] = useState(false)

  const uploadFiles = async (files) => {
    const uploaded = []
    for (const file of files) {
      try {
        const fd = new FormData()
        fd.append('image', file)
        const { data } = await api.post('/shop/upload/', fd)
        uploaded.push(data.url)
      } catch (err) {
        const msg = err.response?.data?.detail || err.response?.data?.error || 'Upload failed'
        setError(typeof msg === 'string' ? msg : 'Upload failed')
      }
    }
    return uploaded
  }

  useEffect(() => {
    api.get('/shop/brands/')
      .then(({ data }) => setBrands(data.results || data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEditing) return
    api.get(`/shop/products/${id}/`)
      .then(({ data }) => {
        setForm({
          name: data.name || '',
          description: data.description || '',
          brand: data.brand || '',
          price: data.price || '',
          stock: data.stock ?? '',
          category: data.category || '',
          sport_tags: Array.isArray(data.sport_tags) ? data.sport_tags.join(', ') : (data.sport_tags || ''),
          images: Array.isArray(data.images) ? data.images.join('\n') : (data.images || ''),
          limited_edition: data.limited_edition || false,
          discount_active: data.discount_active || false,
          discount_percent: data.discount_percent || '',
          drop_date: data.drop_date ? data.drop_date.slice(0, 16) : '',
        })
      })
      .catch(() => navigate('/vendor/products'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock) || 0,
      sport_tags: form.sport_tags ? form.sport_tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      images: form.images ? form.images.split('\n').map((u) => u.trim()).filter(Boolean) : [],
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
      drop_date: form.drop_date || null,
    }

    try {
      if (isEditing) {
        await api.put(`/shop/products/${id}/`, payload)
      } else {
        await api.post('/shop/products/', payload)
      }
      navigate('/vendor/products')
    } catch (err) {
      const data = err.response?.data
      const msg = data?.error?.[0] || data?.detail || data?.message || 'Failed to save product'
      setError(typeof msg === 'string' ? msg : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return
    setCreatingBrand(true)
    try {
      const { data } = await api.post('/shop/brands/', { name: newBrandName.trim(), description: newBrandDesc.trim() })
      setBrands((prev) => [...prev, data])
      setForm((prev) => ({ ...prev, brand: data.name }))
      setShowBrandModal(false)
      setNewBrandName('')
      setNewBrandDesc('')
    } catch {
      setError('Failed to create brand')
    } finally {
      setCreatingBrand(false)
    }
  }

  if (loading) {
    return <div className="text-sm py-12 text-center" style={{ color: 'var(--theme-text-secondary)' }}>Loading...</div>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--theme-text)' }}>
        {isEditing ? 'Edit Product' : 'New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 animate-slideUp">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Price *</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Stock</label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Brand</label>
            <div className="flex gap-2">
              <select
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 appearance-none"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
              >
                <option value="" style={{ color: 'var(--theme-text-muted)' }}>Select a brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowBrandModal(true)}
                className="px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors hover:opacity-80"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
              >
                + Register
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Category ID (optional)</label>
            <input
              name="category"
              type="number"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 resize-none"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Sport Tags (comma separated)</label>
            <input
              name="sport_tags"
              value={form.sport_tags}
              onChange={handleChange}
              placeholder="boxing, mma, bjj"
              className="w-full rounded-lg px-4 py-2.5 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Photos</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.images.split('\n').filter(Boolean).map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--theme-border)' }}>
                  <img src={url.startsWith('http') ? url : `http://localhost:8000${url.startsWith('/') ? url : '/media/' + url}`} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const urls = form.images.split('\n').filter(Boolean)
                      urls.splice(i, 1)
                      setForm((prev) => ({ ...prev, images: urls.join('\n') }))
                    }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors hover:opacity-80" style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Add Photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files)
                    if (!files.length) return
                    const previews = files.map((f) => URL.createObjectURL(f))
                    setLocalPreviews((prev) => [...prev, ...previews])
                    const uploaded = await uploadFiles(files)
                    if (uploaded.length) {
                      const existing = form.images ? form.images.split('\n').filter(Boolean) : []
                      setForm((prev) => ({ ...prev, images: [...existing, ...uploaded].join('\n') }))
                    }
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter image URL:')
                  if (url && url.trim()) {
                    const existing = form.images ? form.images.split('\n').filter(Boolean) : []
                    setForm((prev) => ({ ...prev, images: [...existing, url.trim()].join('\n') }))
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-80"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Add URL
              </button>
            </div>
            <textarea
              name="images"
              value={form.images}
              onChange={handleChange}
              rows={2}
              placeholder="...or paste image URLs (one per line)"
              className="w-full rounded-lg px-4 py-2 text-sm placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-red-500/50 resize-none font-mono text-xs mt-2"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>Discount %</label>
            <input
              name="discount_percent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.discount_percent}
              onChange={handleChange}
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
              style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
            />
          </div>

          <div className="flex items-center gap-6 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                name="limited_edition"
                type="checkbox"
                checked={form.limited_edition}
                onChange={handleChange}
                className="w-4 h-4 rounded text-red-500 focus:ring-red-500/50"
                style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)' }}
              />
              <span className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>Limited Edition</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                name="discount_active"
                type="checkbox"
                checked={form.discount_active}
                onChange={handleChange}
                className="w-4 h-4 rounded text-red-500 focus:ring-red-500/50"
                style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)' }}
              />
              <span className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>Discount Active</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm tracking-wider transition-colors"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/vendor/products')}
            className="px-6 py-2.5 rounded-lg text-sm transition-colors"
            style={{ background: 'var(--theme-surface)', color: 'var(--theme-text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Register Brand Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowBrandModal(false)}>
          <div
            className="rounded-2xl p-6 w-full max-w-md mx-4 animate-slideUp"
            style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black mb-4" style={{ color: 'var(--theme-text)' }}>Register New Brand</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>Brand Name *</label>
                <input
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Hayabusa"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-secondary)' }}>Description (optional)</label>
                <textarea
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 resize-none"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleCreateBrand}
                disabled={creatingBrand || !newBrandName.trim()}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm tracking-wider transition-colors"
              >
                {creatingBrand ? 'Creating...' : 'Register'}
              </button>
              <button
                onClick={() => { setShowBrandModal(false); setNewBrandName(''); setNewBrandDesc('') }}
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
