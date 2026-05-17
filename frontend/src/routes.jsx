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
  if (user && !window.location.pathname.includes('username-setup')) return <Navigate to="/" />
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
        <Route path="/username-setup" element={<PublicRoute><AuthLayout><UsernameSetup /></AuthLayout></PublicRoute>} />
      </Route>
      <Route path="/login" element={<PublicRoute><AuthLayout><Login /></AuthLayout></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><AuthLayout><Register /></AuthLayout></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><AuthLayout><ForgotPassword /></AuthLayout></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><AuthLayout><ResetPassword /></AuthLayout></PublicRoute>} />
    </Routes>
  )
}
