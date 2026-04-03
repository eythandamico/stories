import { lazy, Suspense, useEffect, Component } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import './tokens/theme.css'
import { AuthProvider, useAuth } from './lib/use-auth.jsx'
import { initPushNotifications } from './lib/notifications.js'
import { BottomNav } from './components/bottom-nav.jsx'
import Icon from './lib/icon.jsx'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home.jsx'))
const Explore = lazy(() => import('./pages/Explore.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const StoryPlayer = lazy(() => import('./pages/StoryPlayer.jsx'))
const Auth = lazy(() => import('./pages/Auth.jsx'))
const SetupUsername = lazy(() => import('./pages/SetupUsername.jsx'))
const Store = lazy(() => import('./pages/Store.jsx'))
const Streaks = lazy(() => import('./pages/Streaks.jsx'))

const tabs = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'explore', label: 'Explore', icon: 'search' },
]

class ErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { console.error('App crash:', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-8 text-center">
          <Icon name="alert-triangle" size={40} className="text-white/40 mb-4" />
          <h1 className="text-white text-[22px] font-semibold mb-2">Something went wrong</h1>
          <p className="text-white/50 text-[16px] mb-6">The app ran into an error.</p>
          <button
            type="button"
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
            className="h-[48px] px-8 rounded-2xl bg-white text-black font-semibold text-[16px] cursor-pointer active:scale-[0.96]"
          >
            Restart
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

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

  useEffect(() => { if (user) initPushNotifications() }, [user])

  const hideNav = location.pathname.startsWith('/play') || location.pathname === '/auth' || location.pathname === '/setup' || location.pathname === '/store' || location.pathname === '/streaks'

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
        <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
        <Route path="/streaks" element={<ProtectedRoute><Streaks /></ProtectedRoute>} />
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
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
