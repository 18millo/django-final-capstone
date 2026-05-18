import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { playClick, playSuccess } from '../utils/sounds'
import { toast } from '../components/ui/Toast'

export default function VendorProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const isEdit = Boolean(id)
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', slug: '', description: '', brand: '', category: '', price: '', stock: 50,
    images: '', discount_active: false, discount_percent: '',
    limited_edition: false, featured: false, serial_number: '',
  })

  useEffect(() => {
    api.get('/categories/')
      .then((res) => setCategories(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    api.get('/vendor/products/' + id + '/')
      .then((res) => {
        const p = res.data
        setForm({
          name: p.name || '',
          slug: p.slug || '',
          description: p.description || '',
          brand: p.brand || '',
          category: p.category?.id || p.category || '',
          price: p.price || '',
          stock: p.stock ?? 50,
          images: Array.isArray(p.images) ? p.images.join('\n') : (p.images || ''),
          discount_active: p.discount_active || false,
          discount_percent: p.discount_percent || '',
          limited_edition: p.limited_edition || false,
          featured: p.featured || false,
          serial_number: p.serial_number || '',
        })
      })
      .catch(() => toast('Failed to load product', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    playClick()
    try {
      const fd = new FormData()
      fd.append('image', file)
      // Get category slug for organizing images
      const selectedCategory = categories.find(c => c.id === form.category)
      if (selectedCategory) {
        fd.append('category', selectedCategory.slug)
      }
      const res = await api.post('/vendor/upload/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data.url
      setForm((prev) => ({ ...prev, images: prev.images ? prev.images + '\n' + url : url }))
      playSuccess()
      toast('Image uploaded!', 'success')
    } catch {
      toast('Upload failed', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = (idx) => {
    setForm((prev) => {
      const urls = prev.images.split('\n').filter(Boolean)
      urls.splice(idx, 1)
      return { ...prev, images: urls.join('\n') }
    })
  }

   const handleSubmit = async (e) => {
     e.preventDefault()
     playClick()
     setSaving(true)

     // Safely convert values, handling both string and number types
     const priceValue = typeof form.price === 'string' ? (form.price.trim() === '' ? 0 : parseFloat(form.price)) : (form.price || 0)
     const stockValue = typeof form.stock === 'string' ? (form.stock.trim() === '' ? 0 : parseInt(form.stock, 10)) : (form.stock || 0)
     const categoryValue = typeof form.category === 'string' ? (form.category.trim() === '' ? null : parseInt(form.category, 10)) : (form.category || null)
     const discountPercentValue = typeof form.discount_percent === 'string' ? (form.discount_percent.trim() === '' ? null : parseFloat(form.discount_percent)) : (form.discount_percent || null)

      const payload = {
        ...form,
        price: priceValue,
        stock: stockValue,
        discount_percent: discountPercentValue,
        images: form.images ? form.images.split('\n').map((s) => s.trim()).filter(Boolean) : [],
        category: categoryValue,
      };
      
      // Remove slug from payload if empty to let serializer generate it
      if (payload.slug === '') {
        delete payload.slug;
      }

     try {
       if (isEdit) {
         await api.patch('/vendor/products/' + id + '/', payload)
         playSuccess()
         toast('Product updated!', 'success')
       } else {
         await api.post('/vendor/products/', payload)
         playSuccess()
         toast('Product created!', 'success')
       }
       navigate('/vendor')
     } catch (err) {
       toast(err?.response?.data?.error || 'Save failed', 'error')
     } finally {
       setSaving(false)
     }
   }

   const textClass = isLight ? 'text-nike-black' : 'text-white'
   const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
   const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
   const inputClass = 'w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ' + (isLight
     ? 'bg-nike-gray/10 border-nike-gray text-nike-black placeholder:text-nike-light focus:border-nike-red/50'
     : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30')
   const selectClass = 'w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-colors appearance-none ' + (isLight
      ? 'bg-nike-gray/10 border-nike-gray text-nike-black focus:border-nike-red/50'
      : 'bg-white/5 border-white/10 text-white focus:border-white/30')

  if (loading) return <div className={'min-h-screen flex items-center justify-center ' + (isLight ? 'bg-white' : 'bg-nike-black')}><Spinner /></div>

  const imageList = form.images ? form.images.split('\n').filter(Boolean) : []

  return (
    <div className={'min-h-[calc(100vh-4rem)] ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      <div className={'border-b ' + borderClass}>
        <div className="max-w-3xl mx-auto px-6 py-6">
          <button onClick={() => { playClick(); navigate('/vendor') }} className={'text-xs tracking-widest uppercase font-bold transition-colors ' + mutedClass + ' hover:' + (isLight ? 'text-nike-black' : 'text-white')}>
            ← Back to Dashboard
          </button>
          <h1 className={'text-2xl font-black tracking-tight mt-2 ' + textClass}>{isEdit ? 'Edit Product' : 'New Product'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className={'rounded-2xl border p-6 space-y-5 ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
          <h2 className={'text-sm font-black tracking-widest uppercase ' + textClass}>Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={'block text-xs font-bold mb-1.5 ' + mutedClass}>Product Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className={inputClass} placeholder="e.g. T3 Boxing Gloves" />
            </div>
            <div>
              <label className={'block text-xs font-bold mb-1.5 ' + mutedClass}>Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange} className={inputClass} placeholder="e.g. Hayabusa" />
            </div>
             <div>
               <label className={'block text-xs font-bold mb-1.5 ' + mutedClass}>Category</label>
               <select name="category" value={form.category} onChange={handleChange} className={selectClass}>
                 <option value="">Select category</option>
                 {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
             </div>
            <div>
              <label className={'block text-xs font-bold mb-1.5 ' + mutedClass}>Price ($)</label>
              <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className={'block text-xs font-bold mb-1.5 ' + mutedClass}>Stock</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={'block text-xs font-bold mb-1.5 ' + mutedClass}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={inputClass + ' resize-none'} placeholder="Product description..." />
          </div>
        </div>

        <div className={'rounded-2xl border p-6 space-y-5 ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
          <h2 className={'text-sm font-black tracking-widest uppercase ' + textClass}>Images</h2>

          <div className="flex flex-wrap gap-3">
            {imageList.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden group bg-nike-gray/20">
                <img src={url} alt={''} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                <div className="hidden w-full h-full items-center justify-center text-2xl">🥊</div>
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-nike-red text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
              </div>
            ))}
            <label className={'w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ' + (isLight ? 'border-nike-gray hover:border-nike-red text-nike-light' : 'border-white/20 hover:border-white/40 text-white/30')}>
              {uploading ? (
                <Spinner />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span className="text-[8px] mt-0.5">Upload</span>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className={'block text-xs font-bold mb-1.5 ' + mutedClass}>Image URLs (one per line)</label>
            <textarea name="images" value={form.images} onChange={handleChange} rows={3} className={inputClass + ' resize-none font-mono text-xs'} placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" />
          </div>
        </div>

        <div className={'rounded-2xl border p-6 space-y-5 ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
          <h2 className={'text-sm font-black tracking-widest uppercase ' + textClass}>Discount</h2>

          <label className={'flex items-center gap-3 cursor-pointer ' + textClass}>
            <input type="checkbox" name="discount_active" checked={form.discount_active} onChange={handleChange} className="accent-nike-red w-4 h-4" />
            <span className="text-sm font-bold">Enable Discount</span>
          </label>

          {form.discount_active && (
            <div className="max-w-xs">
              <label className={'block text-xs font-bold mb-1.5 ' + mutedClass}>Discount Percentage (%)</label>
              <input name="discount_percent" type="number" min="0" max="100" step="0.01" value={form.discount_percent} onChange={handleChange} className={inputClass} placeholder="e.g. 20" />
            </div>
          )}
        </div>

        <div className={'rounded-2xl border p-6 space-y-5 ' + (isLight ? 'bg-white border-nike-gray shadow-sm' : 'bg-nike-dark border-white/5')}>
          <h2 className={'text-sm font-black tracking-widest uppercase ' + textClass}>Extras</h2>

          <div className="flex items-center gap-6">
            <label className={'flex items-center gap-2 cursor-pointer ' + textClass}>
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="accent-nike-red" />
              <span className="text-sm">Featured</span>
            </label>
            <label className={'flex items-center gap-2 cursor-pointer ' + textClass}>
              <input type="checkbox" name="limited_edition" checked={form.limited_edition} onChange={handleChange} className="accent-nike-red" />
              <span className="text-sm">Limited Edition</span>
            </label>
          </div>

          <div className="max-w-xs">
            <label className={'block text-xs font-bold mb-1.5 ' + mutedClass}>Serial Number</label>
            <input name="serial_number" value={form.serial_number} onChange={handleChange} className={inputClass} placeholder="Optional" />
          </div>
        </div>

        <div className="flex items-center gap-3 pb-12">
          <button type="submit" disabled={saving} className="bg-nike-red text-white hover:bg-white hover:text-nike-black px-8 py-3 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-300 shadow-lg shadow-nike-red/30 disabled:opacity-50">
            {saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
          <button type="button" onClick={() => navigate('/vendor')} className={'px-8 py-3 rounded-xl text-xs tracking-widest uppercase font-bold border transition-all ' + (isLight ? 'border-nike-gray text-nike-light hover:text-nike-black' : 'border-white/10 text-white/40 hover:text-white')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
