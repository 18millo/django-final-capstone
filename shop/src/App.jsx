import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'
import { CartProvider } from './providers/CartProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import ShopLayout from './layouts/ShopLayout'
import CustomerLayout from './layouts/CustomerLayout'
import Login from './pages/Login'
import Activate from './pages/Activate'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Settings from './pages/Settings'
import VendorPremium from './pages/VendorPremium'
import Brands from './pages/Brands'
import VendorEvents from './pages/VendorEvents'
import Gallery from './pages/Gallery'
import GalleryDetail from './pages/GalleryDetail'
import Landing from './pages/Landing'
import Shop from './pages/Shop'
import AccessGate from './pages/AccessGate'
import LoadingScreen from './components/LoadingScreen'
import ProductView from './pages/ProductView'
import Categories from './pages/Categories'
import Contact from './pages/Contact'
import CustomerSettings from './pages/CustomerSettings'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'
import CustomerOrderDetail from './pages/CustomerOrderDetail'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <AccessGate />
  if (user.role === 'vendor') return <Navigate to="/vendor/dashboard" replace />
  return children
}

function VendorRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'vendor') return <Navigate to="/" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to={user.role === 'vendor' ? '/vendor/dashboard' : '/shop'} replace />
  return children
}

function VendorRedirect({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user && user.role === 'vendor') return <Navigate to="/vendor/dashboard" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<VendorRedirect><Landing /></VendorRedirect>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/activate" element={<Activate />} />

        {/* Customer routes */}
        <Route path="/shop" element={<ProtectedRoute><CartProvider><CustomerLayout /></CartProvider></ProtectedRoute>}>
          <Route index element={<Shop />} />
          <Route path="products/:id" element={<ProductView />} />
          <Route path="categories" element={<Categories />} />
          <Route path="contact" element={<Contact />} />
          <Route path="settings" element={<CustomerSettings />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="orders/:id" element={<CustomerOrderDetail />} />
        </Route>

        {/* Vendor routes */}
        <Route path="/vendor" element={<VendorRoute><ShopLayout /></VendorRoute>}>
          <Route index element={<Navigate to="/vendor/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="brands" element={<Brands />} />
          <Route path="events" element={<VendorEvents />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="gallery/:id" element={<GalleryDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="premium" element={<VendorPremium />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}
