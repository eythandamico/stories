import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/use-auth.jsx'
import { logout, isFirebaseConfigured } from '../lib/firebase.js'
import { useGameState } from '../lib/use-game-state.js'
import { Stack } from '../components/stack.jsx'
import { Surface } from '../components/surface.jsx'
import { Row } from '../components/row.jsx'
import { HeartIcon } from '../components/heart-icon.jsx'
import { FlameIcon } from '../components/flame-icon.jsx'
import Icon from '../lib/icon.jsx'

function ToggleItem({ icon, label, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full text-left px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-colors duration-150 hover:bg-[var(--inv-nav-hover-bg)] active:scale-[0.96]"
    >
      <Icon name={icon} size={18} className="text-[var(--inv-muted)]" />
      <span className="flex-1 text-[16px] font-medium text-[var(--inv-heading)]">{label}</span>
      <span
        className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${
          value ? 'bg-[var(--inv-accent)]' : 'bg-[var(--inv-bg-alt)]'
        }`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            value ? 'translate-x-[18px]' : ''
          }`}
        />
      </span>
    </button>
  )
}

function SettingsItem({ icon, label, value, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-colors duration-150 hover:bg-[var(--inv-nav-hover-bg)] active:scale-[0.96] ${
        danger ? 'text-red-400' : ''
      }`}
    >
      <Icon name={icon} size={18} className={danger ? 'text-red-400' : 'text-[var(--inv-muted)]'} />
      <span className={`flex-1 text-[16px] font-medium ${danger ? 'text-red-400' : 'text-[var(--inv-heading)]'}`}>
        {label}
      </span>
      {value && <span className="text-[16px] text-[var(--inv-muted)]">{value}</span>}
      {!danger && <Icon name="chevron-right" size={16} className="text-[var(--inv-muted)]" />}
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { hearts, maxHearts, streak } = useGameState()

  const [sound, setSound] = useState(() => localStorage.getItem('narrative-sound') !== 'off')
  const [autoplay, setAutoplay] = useState(() => localStorage.getItem('narrative-autoplay') !== 'off')
  const [notifications, setNotifications] = useState(() => localStorage.getItem('narrative-notifs') !== 'off')
  const [theme, setTheme] = useState(() => localStorage.getItem('narrative-theme') || 'dark')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('narrative-theme', theme)
  }, [theme])

  useEffect(() => { localStorage.setItem('narrative-sound', sound ? 'on' : 'off') }, [sound])
  useEffect(() => { localStorage.setItem('narrative-autoplay', autoplay ? 'on' : 'off') }, [autoplay])
  useEffect(() => { localStorage.setItem('narrative-notifs', notifications ? 'on' : 'off') }, [notifications])

  const handleSignOut = async () => {
    if (isFirebaseConfigured) await logout()
    localStorage.removeItem('narrative-game-state')
    localStorage.removeItem('narrative-onboarding-complete')
    navigate('/auth')
  }

  const handleDeleteAccount = () => {
    // TODO: implement account deletion via API
    handleSignOut()
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--inv-bg)] pb-28 animate-page-enter">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <Row gap="md" className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-[var(--inv-nav-hover-bg)] active:scale-[0.96]"
            aria-label="Go back"
          >
            <Icon name="arrow-left" size={20} className="text-[var(--inv-heading)]" />
          </button>
          <h1 className="inv-title">Settings</h1>
        </Row>
      </div>

      <div className="px-6">
        <Stack gap="lg">
          {/* Profile */}
          <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <p className="inv-overline mb-3 px-1">Profile</p>
            <Surface padding="none" elevation="sm" className="overflow-hidden">
              <div className="px-4 py-4 flex items-center gap-3">
                <img
                  src={user?.photoURL || '/profile.jpg'}
                  alt="Profile"
                  className="w-14 h-14 rounded-xl object-cover"
                  style={{ boxShadow: 'var(--inv-shadow-sm)' }}
                />
                <div className="flex-1">
                  <p className="inv-heading">{user?.displayName || 'User'}</p>
                  <p className="inv-caption">{user?.email || ''}</p>
                </div>
              </div>
            </Surface>
          </div>

          {/* Stats */}
          <div className="animate-fade-up" style={{ animationDelay: '0.08s' }}>
            <p className="inv-overline mb-3 px-1">Stats</p>
            <div className="grid grid-cols-3 gap-3">
              <Surface padding="sm" elevation="sm" className="text-center">
                <HeartIcon size={20} className="mx-auto mb-1" />
                <p className="text-[18px] font-semibold text-[var(--inv-heading)] tabular-nums">{hearts}</p>
                <p className="inv-caption">Hearts</p>
              </Surface>
              <Surface padding="sm" elevation="sm" className="text-center">
                <FlameIcon size={20} className="mx-auto mb-1" />
                <p className="text-[18px] font-semibold text-[var(--inv-heading)] tabular-nums">{streak.current}</p>
                <p className="inv-caption">Streak</p>
              </Surface>
              <Surface padding="sm" elevation="sm" className="text-center">
                <Icon name="trophy" size={20} className="text-yellow-500 mx-auto mb-1" />
                <p className="text-[18px] font-semibold text-[var(--inv-heading)] tabular-nums">{streak.best}</p>
                <p className="inv-caption">Best</p>
              </Surface>
            </div>
          </div>

          {/* Preferences */}
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <p className="inv-overline mb-3 px-1">Preferences</p>
            <Surface padding="none" elevation="sm" className="overflow-hidden divide-y divide-[var(--inv-border)]">
              <ToggleItem icon="volume" label="Sound Effects" value={sound} onChange={setSound} />
              <ToggleItem icon="play" label="Autoplay Videos" value={autoplay} onChange={setAutoplay} />
              <ToggleItem icon="bell" label="Notifications" value={notifications} onChange={setNotifications} />
              <button
                type="button"
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                className="w-full text-left px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-colors duration-150 hover:bg-[var(--inv-nav-hover-bg)] active:scale-[0.96]"
              >
                <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} className="text-[var(--inv-muted)]" />
                <span className="flex-1 text-[16px] font-medium text-[var(--inv-heading)]">Theme</span>
                <span className="text-[16px] text-[var(--inv-muted)]">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                <span
                  className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${
                    theme === 'dark' ? 'bg-[var(--inv-accent)]' : 'bg-[var(--inv-bg-alt)]'
                  }`}
                >
                  <span className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${theme === 'dark' ? 'translate-x-[18px]' : ''}`} />
                </span>
              </button>
            </Surface>
          </div>

          {/* Support */}
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <p className="inv-overline mb-3 px-1">Support</p>
            <Surface padding="none" elevation="sm" className="overflow-hidden divide-y divide-[var(--inv-border)]">
              <SettingsItem icon="message" label="Send Feedback" onClick={() => window.open('mailto:support@narrative.app')} />
              <SettingsItem icon="shield" label="Privacy Policy" onClick={() => window.open('/privacy')} />
              <SettingsItem icon="file-text" label="Terms of Service" onClick={() => window.open('/terms')} />
            </Surface>
          </div>

          {/* Account */}
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Surface padding="none" elevation="sm" className="overflow-hidden divide-y divide-[var(--inv-border)]">
              <SettingsItem icon="logout" label="Sign Out" danger onClick={handleSignOut} />
            </Surface>
          </div>

          <p className="inv-caption text-center pb-4">Narrative v1.0.0</p>
        </Stack>
      </div>
    </main>
  )
}
