import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import './tokens/theme.css'
import { BottomNav } from './components/bottom-nav.jsx'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import Settings from './pages/Settings.jsx'
import StoryPlayer from './pages/StoryPlayer.jsx'

const tabs = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'explore', label: 'Explore', icon: 'search' },
]

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()

  const hideNav = location.pathname === '/play'
  const isHome = location.pathname === '/'

  const tabRoutes = { '/': 'home', '/explore': 'explore' }
  const activeTab = tabRoutes[location.pathname] || 'home'

  const handleTabChange = (tabId) => {
    if (tabId === 'home') navigate('/')
    if (tabId === 'explore') navigate('/explore')
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/play" element={<StoryPlayer />} />
      </Routes>

      {!hideNav && (
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
      <AppShell />
    </BrowserRouter>
  )
}
