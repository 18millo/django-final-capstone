import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import UsernameSetup from './pages/UsernameSetup'
import ProfileView from './pages/ProfileEdit'
import Settings from './pages/Settings'
import About from './pages/About'
import Community from './pages/Community'
import Messages from './pages/Messages'
import PublicProfile from './pages/PublicProfile'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'
import OrderDetail from './pages/OrderDetail'
import VendorDashboard from './pages/VendorDashboard'
import VendorProductForm from './pages/VendorProductForm'
import CoachDashboard from './pages/CoachDashboard'
import VerifyLogin from './pages/VerifyLogin'
import VerifyAccessCode from './pages/VerifyAccessCode'
import TotpSetup from './pages/TotpSetup'
import VendorAbout from './pages/VendorAbout'
import CommunityGuidelines from './pages/CommunityGuidelines'
import Spinner from './components/ui/Spinner'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (!user) return <Navigate to="/login" />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (user) {
    const skip = ['username-setup', 'verify-login']
    if (!skip.some((p) => window.location.pathname.includes(p))) return <Navigate to="/" />
  }
  return children
}

function VendorRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (!user || user.role !== 'vendor') return <Navigate to="/" />
  return children
}

function CoachRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (!user || user.role !== 'coach') return <Navigate to="/" />
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/vendor" element={<VendorRoute><VendorDashboard /></VendorRoute>} />
        <Route path="/vendor/products/new" element={<VendorRoute><VendorProductForm /></VendorRoute>} />
        <Route path="/vendor/products/:id/edit" element={<VendorRoute><VendorProductForm /></VendorRoute>} />
        <Route path="/vendor/:id" element={<VendorAbout />} />
        <Route path="/coach" element={<CoachRoute><CoachDashboard /></CoachRoute>} />
        <Route path="/guidelines" element={<CommunityGuidelines />} />
        <Route path="/2fa/setup" element={<ProtectedRoute><TotpSetup /></ProtectedRoute>} />
        <Route path="/username-setup" element={<PublicRoute><AuthLayout><UsernameSetup /></AuthLayout></PublicRoute>} />
      </Route>
      <Route path="/login" element={<PublicRoute><AuthLayout><Login /></AuthLayout></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><AuthLayout><Register /></AuthLayout></PublicRoute>} />
      <Route path="/verify-login" element={<PublicRoute><AuthLayout><VerifyLogin /></AuthLayout></PublicRoute>} />
      <Route path="/verify-access-code" element={<PublicRoute><AuthLayout><VerifyAccessCode /></AuthLayout></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><AuthLayout><ForgotPassword /></AuthLayout></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><AuthLayout><ResetPassword /></AuthLayout></PublicRoute>} />
    </Routes>
  )
}
