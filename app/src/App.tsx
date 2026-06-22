import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WeekProvider } from './contexts/WeekContext'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Department from './pages/Department'
import ReportView from './pages/ReportView'
import AMDashboardPage from './pages/AMDashboardPage'
import Leadership from './pages/Leadership'
import Admin from './pages/Admin'
import UpdateBanner from './components/shared/UpdateBanner'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-sb-navy flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-sb-sky border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user || !profile) return <Navigate to="/login" replace />
  if (!profile.is_active) return <Navigate to="/login?error=inactive" replace />
  if (roles && !roles.includes(profile.role)) {
    // Redirect to role-appropriate home
    if (profile.role === 'area_manager') return <Navigate to="/am-dashboard" replace />
    if (profile.role === 'director')     return <Navigate to="/leadership" replace />
    if (profile.role === 'admin')        return <Navigate to="/admin" replace />
    return <Navigate to="/department" replace />
  }

  return <>{children}</>
}

function RoleHome() {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role === 'area_manager') return <Navigate to="/am-dashboard" replace />
  if (profile.role === 'director')     return <Navigate to="/leadership" replace />
  if (profile.role === 'admin')        return <Navigate to="/admin" replace />
  return <Navigate to="/department" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={
        <ProtectedRoute>
          <RoleHome />
        </ProtectedRoute>
      } />

      <Route path="/department" element={
        <ProtectedRoute roles={['department', 'admin']}>
          <AppShell><Department /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/report/:slug" element={
        <ProtectedRoute>
          <AppShell><ReportView /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/am-dashboard" element={
        <ProtectedRoute roles={['area_manager', 'admin']}>
          <AppShell><AMDashboardPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/leadership" element={
        <ProtectedRoute roles={['director', 'admin']}>
          <AppShell><Leadership /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <AppShell><Admin /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <WeekProvider>
        <HashRouter>
          <AppRoutes />
          <UpdateBanner />
        </HashRouter>
      </WeekProvider>
    </AuthProvider>
  )
}
