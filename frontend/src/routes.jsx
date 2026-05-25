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
import Forum from './pages/Forum'
import PostDetail from './pages/PostDetail'
import CreatePost from './pages/CreatePost'
import Messages from './pages/Messages'
import PublicProfile from './pages/PublicProfile'
import OrderHistory from './pages/OrderHistory'
import OrderDetail from './pages/OrderDetail'
import CoachDashboard from './pages/CoachDashboard'
import GymOwnerDashboard from './pages/GymOwnerDashboard'
import VerifyLogin from './pages/VerifyLogin'
import VerifyAccessCode from './pages/VerifyAccessCode'
import TotpSetup from './pages/TotpSetup'
import VendorAbout from './pages/VendorAbout'
import CommunityGuidelines from './pages/CommunityGuidelines'
import Terms from './pages/Terms'
import Gallery from './pages/Gallery'
import GalleryDetail from './pages/GalleryDetail'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import PaymentSetup from './pages/PaymentSetup'
import Premium from './pages/Premium'
import EmailVerify from './pages/EmailVerify'
import Newsletter from './pages/Newsletter'
import ContactUs from './pages/ContactUs'
import Help from './pages/Help'
import AdminPage from './pages/AdminPage'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import EventForm from './pages/EventForm'
import MyEvents from './pages/MyEvents'
import Spinner from './components/ui/Spinner'

function ProtectedRoute({ children, requireVerified }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (!user) return <Navigate to="/login" />
  if (requireVerified !== false && !user.email_verified) return <Navigate to="/verify-email" />
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

function SellerRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (!user || !['vendor', 'coach', 'gym_owner'].includes(user.role)) return <Navigate to="/" />
      if (!user.email_verified) return <Navigate to="/verify-email" />
  return children
}

function NonVendorRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (!user) return <Navigate to="/login" />
  if (user.role === 'vendor') return <Navigate to="/" />
  return children
}

function AthleteRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'athlete') return <Navigate to="/" />
  return children
}

function CoachRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (!user || user.role !== 'coach') return <Navigate to="/" />
  if (!user.email_verified) return <Navigate to="/verify-email" />
  return children
}

function VendorRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (!user || user.role !== 'vendor') return <Navigate to="/" />
  if (!user.email_verified) return <Navigate to="/verify-email" />
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/help" element={<Help />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/community" element={<ProtectedRoute><NonVendorRoute><Community /></NonVendorRoute></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><NonVendorRoute><Messages /></NonVendorRoute></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute requireVerified={false}><Settings /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/vendor/:id" element={<VendorAbout />} />
        <Route path="/coach" element={<CoachRoute><CoachDashboard /></CoachRoute>} />
        <Route path="/gym-dashboard" element={<SellerRoute><GymOwnerDashboard /></SellerRoute>} />
        <Route path="/forum" element={<ProtectedRoute><NonVendorRoute><Forum /></NonVendorRoute></ProtectedRoute>} />
        <Route path="/forum/new" element={<ProtectedRoute><NonVendorRoute><CreatePost /></NonVendorRoute></ProtectedRoute>} />
        <Route path="/forum/:id" element={<ProtectedRoute><NonVendorRoute><PostDetail /></NonVendorRoute></ProtectedRoute>} />
        <Route path="/guidelines" element={<CommunityGuidelines />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
        <Route path="/gallery/:id" element={<ProtectedRoute><GalleryDetail /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><NonVendorRoute><Groups /></NonVendorRoute></ProtectedRoute>} />
        <Route path="/groups/:id" element={<ProtectedRoute><NonVendorRoute><GroupDetail /></NonVendorRoute></ProtectedRoute>} />
        <Route path="/2fa/setup" element={<ProtectedRoute><TotpSetup /></ProtectedRoute>} />
        <Route path="/premium/setup" element={<ProtectedRoute><PaymentSetup /></ProtectedRoute>} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/new" element={<SellerRoute><EventForm /></SellerRoute>} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/edit" element={<SellerRoute><EventForm /></SellerRoute>} />
        <Route path="/my-events" element={<SellerRoute><MyEvents /></SellerRoute>} />
        <Route path="/newsletter" element={<Newsletter />} />
        <Route path="/verify-email" element={<ProtectedRoute requireVerified={false}><EmailVerify /></ProtectedRoute>} />
        <Route path="/username-setup" element={<PublicRoute><AuthLayout><UsernameSetup /></AuthLayout></PublicRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
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
