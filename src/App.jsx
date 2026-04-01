import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import './tokens/theme.css'
import { AuthProvider, useAuth } from './lib/use-auth.jsx'
import { BottomNav } from './components/bottom-nav.jsx'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import Settings from './pages/Settings.jsx'
import StoryPlayer from './pages/StoryPlayer.jsx'
import Auth from './pages/Auth.jsx'
import SetupUsername from './pages/SetupUsername.jsx'

const tabs = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'explore', label: 'Explore', icon: 'search' },
]

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  if (!user.displayName && !localStorage.getItem('narrative-username-set')) {
    return <Navigate to="/setup" replace />
  }
  return children
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const hideNav = location.pathname === '/play' || location.pathname === '/auth' || location.pathname === '/setup'

  const tabRoutes = { '/': 'home', '/explore': 'explore' }
  const activeTab = tabRoutes[location.pathname] || 'home'

  const handleTabChange = (tabId) => {
    if (tabId === 'home') navigate('/')
    if (tabId === 'explore') navigate('/explore')
  }

  return (
    <>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/setup" element={user ? <SetupUsername /> : <Navigate to="/auth" replace />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/play" element={<ProtectedRoute><StoryPlayer /></ProtectedRoute>} />
      </Routes>

      {!hideNav && user && (
        <BottomNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}
    </>
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
