import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack } from '../components/stack.jsx'
import { Surface } from '../components/surface.jsx'
import { Row } from '../components/row.jsx'
import Icon from '../lib/icon.jsx'

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
      <Icon name="chevron-right" size={16} className="text-[var(--inv-muted)]" />
    </button>
  )
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('narrative-theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('narrative-theme', theme)
  }, [theme])

  const cycle = () => {
    setTheme((t) => t === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="w-full text-left px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-colors duration-150 hover:bg-[var(--inv-nav-hover-bg)] active:scale-[0.96]"
    >
      <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} className="text-[var(--inv-muted)]" />
      <span className="flex-1 text-[16px] font-medium text-[var(--inv-heading)]">Appearance</span>
      <span className="text-[16px] text-[var(--inv-muted)]">{theme === 'dark' ? 'Dark' : 'Light'}</span>
      <span
        className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${
          theme === 'dark' ? 'bg-[var(--inv-accent)]' : 'bg-[var(--inv-bg-alt)]'
        }`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            theme === 'dark' ? 'translate-x-[18px]' : ''
          }`}
        />
      </span>
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()

  return (
    <main className="min-h-[100dvh] bg-[var(--inv-bg)] pb-28 animate-page-enter">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <Row gap="md" className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-[var(--inv-nav-hover-bg)] active:scale-95"
            aria-label="Go back"
          >
            <Icon name="arrow-left" size={20} className="text-[var(--inv-heading)]" />
          </button>
          <h1 className="inv-title">Settings</h1>
        </Row>
      </div>

      <div className="px-6">
        <Stack gap="lg">
          {/* Profile section */}
          <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <p className="inv-overline mb-3 px-1">Profile</p>
            <Surface padding="none" elevation="sm" className="overflow-hidden">
              <div className="px-4 py-4 flex items-center gap-3">
                <img
                  src="/profile.jpg"
                  alt="Profile picture"
                  className="w-14 h-14 rounded-xl object-cover"
                  style={{ boxShadow: 'var(--inv-shadow-sm)' }}
                />
                <div className="flex-1">
                  <p className="inv-heading">Leo</p>
                  <p className="inv-caption">leo@example.com</p>
                </div>
              </div>
            </Surface>
          </div>

          {/* Preferences */}
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <p className="inv-overline mb-3 px-1">Preferences</p>
            <Surface padding="none" elevation="sm" className="overflow-hidden divide-y divide-[var(--inv-border)]">
              <SettingsItem icon="globe" label="Language" value="English" />
              <SettingsItem icon="volume" label="Sound" value="On" />
              <ThemeToggle />
              <SettingsItem icon="bell" label="Notifications" value="On" />
            </Surface>
          </div>

          {/* Playback */}
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <p className="inv-overline mb-3 px-1">Playback</p>
            <Surface padding="none" elevation="sm" className="overflow-hidden divide-y divide-[var(--inv-border)]">
              <SettingsItem icon="play" label="Autoplay Videos" value="On" />
              <SettingsItem icon="speed" label="Video Quality" value="Auto" />
            </Surface>
          </div>

          {/* About */}
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <p className="inv-overline mb-3 px-1">About</p>
            <Surface padding="none" elevation="sm" className="overflow-hidden divide-y divide-[var(--inv-border)]">
              <SettingsItem icon="file-text" label="Terms of Service" />
              <SettingsItem icon="shield" label="Privacy Policy" />
              <SettingsItem icon="message" label="Send Feedback" />
            </Surface>
          </div>

          {/* Danger zone */}
          <Surface padding="none" elevation="sm" className="overflow-hidden">
            <SettingsItem icon="logout" label="Sign Out" danger />
          </Surface>

          <p className="inv-caption text-center pb-4">Version 1.0.0</p>
        </Stack>
      </div>
    </main>
  )
}
