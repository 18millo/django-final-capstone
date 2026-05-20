import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { mediaUrl } from '../utils/media'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function VendorAbout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/vendors/' + id + '/')
      .then((res) => {
        setVendor(res.data.vendor)
        setProducts(res.data.products || [])
      })
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className={'min-h-screen flex items-center justify-center ' + (isLight ? 'bg-white' : 'bg-nike-black')}><Spinner /></div>
  if (!vendor) return null

  const p = vendor.profile || {}
  const textClass = isLight ? 'text-nike-black' : 'text-white'
  const mutedClass = isLight ? 'text-nike-light' : 'text-white/40'
  const borderClass = isLight ? 'border-nike-gray' : 'border-white/10'
  const cardBg = 'liquid-glass-card'

  return (
    <div className={'min-h-screen ' + (isLight ? 'bg-nike-gray/20' : 'bg-nike-black')}>
      {/* Header */}
      <div className={'border-b ' + borderClass}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link to="/shop" className={'text-xs tracking-widest uppercase font-bold transition-colors ' + mutedClass + ' hover:' + (isLight ? 'text-nike-black' : 'text-white')}>
            ← Back to Shop
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mt-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-nike-gray/20">
                {p.avatar ? (
                  <img src={mediaUrl(p.avatar)} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🏪</div>
                )}
              </div>
              <div>
                <h1 className={'text-3xl font-black tracking-tight ' + textClass}>{p.business_name || vendor.username}</h1>
                <p className={'text-sm mt-1 ' + mutedClass}>
                  {p.business_location && <span>{p.business_location} · </span>}
                  {products.length} product{products.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-8">
        {/* About section */}
        <div className="md:col-span-2 space-y-6">
          <div className={'p-6 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <h2 className={'text-xs tracking-widest uppercase font-bold mb-4 ' + mutedClass}>About</h2>
            <p className={'text-sm leading-relaxed ' + textClass}>
              {p.business_description || 'No description provided.'}
            </p>
          </div>

          {/* Products */}
          <div>
            <h2 className={'text-xs tracking-widest uppercase font-bold mb-4 ' + mutedClass}>Products</h2>
            {products.length === 0 ? (
              <p className={'text-sm ' + mutedClass}>No products yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={'/shop/' + product.id}
                    className={'group rounded-xl overflow-hidden border transition-all hover:scale-[1.02] ' + borderClass + ' ' + cardBg}
                  >
                    <div className="aspect-square overflow-hidden">
                      <img src={product.images?.[0] || ''} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-3">
                      <p className={'text-xs font-bold truncate ' + textClass}>{product.name}</p>
                      <p className="text-xs font-black text-nike-red mt-1">${parseFloat(product.price).toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map sidebar */}
        <div className="space-y-6">
          {p.latitude && p.longitude && (
            <div className={'rounded-2xl overflow-hidden border ' + borderClass} style={{ height: '250px' }}>
              <MapContainer center={[p.latitude, p.longitude]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[p.latitude, p.longitude]} />
              </MapContainer>
            </div>
          )}
          <div className={'p-6 rounded-2xl border ' + borderClass + ' ' + cardBg}>
            <h3 className={'text-xs tracking-widest uppercase font-bold mb-3 ' + mutedClass}>Contact</h3>
            <p className={'text-sm ' + textClass}>{vendor.username}</p>
            {p.phone && <p className={'text-sm mt-1 ' + textClass}>{p.phone}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
