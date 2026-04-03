import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/error-boundary.jsx'

// Apply saved theme before render to prevent flash
const savedTheme = localStorage.getItem('narrative-theme') || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

// Force status bar to overlay content on iOS
if (Capacitor.isNativePlatform()) {
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setOverlaysWebView({ overlay: true })
    StatusBar.setStyle({ style: Style.Dark })
  }).catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
