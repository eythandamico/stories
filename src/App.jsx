import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import './tokens/theme.css'
import { AuthProvider, useAuth } from './lib/use-auth.jsx'
import { BottomNav } from './components/bottom-nav.jsx'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home.jsx'))
const Explore = lazy(() => import('./pages/Explore.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const StoryPlayer = lazy(() => import('./pages/StoryPlayer.jsx'))
const Auth = lazy(() => import('./pages/Auth.jsx'))
const SetupUsername = lazy(() => import('./pages/SetupUsername.jsx'))

const tabs = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'explore', label: 'Explore', icon: 'search' },
]

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[var(--inv-bg)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  if (!user.displayName && !localStorage.getItem('narrative-username-set')) {
    return <Navigate to="/setup" replace />
  }
  return children
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const hideNav = location.pathname.startsWith('/play') || location.pathname === '/auth' || location.pathname === '/setup'

  const tabRoutes = { '/': 'home', '/explore': 'explore' }
  const activeTab = tabRoutes[location.pathname] || 'home'

  const handleTabChange = (tabId) => {
    if (tabId === 'home') navigate('/')
    if (tabId === 'explore') navigate('/explore')
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/setup" element={user ? <SetupUsername /> : <Navigate to="/auth" replace />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/play/:storyId?" element={<ProtectedRoute><StoryPlayer /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideNav && user && (
        <BottomNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
