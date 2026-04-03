import { useNavigate } from 'react-router-dom'
import Icon from '../lib/icon.jsx'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <main className="fixed inset-0 bg-[var(--inv-bg)] overflow-y-auto animate-page-enter">
      <div className="px-5 pt-[calc(env(safe-area-inset-top,20px)+20px)] pb-2">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-[var(--inv-nav-hover-bg)] active:scale-[0.96]"
            aria-label="Go back"
          >
            <Icon name="arrow-left" size={20} className="text-[var(--inv-heading)]" />
          </button>
          <h1 className="inv-title">Privacy Policy</h1>
        </div>
      </div>

      <div className="px-6 text-[15px] leading-relaxed text-[var(--inv-body)]">
        <p className="text-[var(--inv-muted)] mb-6">Last updated: April 2, 2026</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Information We Collect</h2>
        <p className="mb-4">When you create an account, we collect your email address and display name. If you sign in with Apple or Google, we receive your name and email from those services.</p>
        <p className="mb-6">We also collect gameplay data including story progress, choices made, hearts, streaks, and endings discovered to provide the game experience.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">How We Use Your Information</h2>
        <p className="mb-4">We use your information to provide and improve the app experience, including saving your progress, tracking streaks, and showing community choice percentages.</p>
        <p className="mb-6">We do not sell your personal information to third parties.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Data Storage</h2>
        <p className="mb-6">Your data is stored securely using Firebase Authentication and Cloudflare D1. Game progress is stored locally on your device and synced to our servers when you are signed in.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Push Notifications</h2>
        <p className="mb-6">With your permission, we send push notifications for streak reminders and new story alerts. You can disable notifications at any time in your device settings.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Account Deletion</h2>
        <p className="mb-6">You can delete your account at any time from Settings. This permanently removes all your data from our servers.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Contact</h2>
        <p className="mb-6">If you have questions about this privacy policy, contact us at <span className="text-[var(--inv-accent)]">support@narrative.app</span></p>
      </div>
    </main>
  )
}
