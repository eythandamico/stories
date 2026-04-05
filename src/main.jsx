import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/error-boundary.jsx'

// Apply saved theme before render to prevent flash
const savedTheme = localStorage.getItem('narrative-theme') || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

// iOS native setup
if (Capacitor.isNativePlatform()) {
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setOverlaysWebView({ overlay: true })
    StatusBar.setStyle({ style: Style.Dark })
  }).catch(() => {})

  import('@capacitor/keyboard').then(({ Keyboard }) => {
    Keyboard.setAccessoryBarVisible({ isVisible: false })
  }).catch(() => {})

  // Dismiss splash screen after app loads (fallback for logged-in users who skip Auth)
  setTimeout(() => {
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
      SplashScreen.hide({ fadeOutDuration: 300 })
    }).catch(() => {})
  }, 1500)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
