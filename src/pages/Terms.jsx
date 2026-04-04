import { useNavigate } from 'react-router-dom'
import Icon from '../lib/icon.jsx'

export default function Terms() {
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
          <h1 className="inv-title">Terms of Service</h1>
        </div>
      </div>

      <div className="px-6 text-[15px] leading-relaxed text-[var(--inv-body)]">
        <p className="text-[var(--inv-muted)] mb-6">Last updated: April 2, 2026</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Acceptance of Terms</h2>
        <p className="mb-6">By using Loop, you agree to these Terms of Service. If you do not agree, please do not use the app.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Use of the App</h2>
        <p className="mb-4">Loop is an interactive storytelling app. You may use it for personal, non-commercial purposes. You agree not to misuse the service, attempt to gain unauthorized access, or interfere with other users' experience.</p>
        <p className="mb-6">You must be at least 13 years old to use Loop.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Accounts</h2>
        <p className="mb-6">You are responsible for maintaining the security of your account. We reserve the right to suspend or terminate accounts that violate these terms.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">In-App Purchases</h2>
        <p className="mb-6">Loop may offer in-app purchases for hearts, perks, and story content. All purchases are final and non-refundable except as required by applicable law. Virtual currency and items have no real-world monetary value.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Content</h2>
        <p className="mb-6">All stories, videos, and content within Loop are owned by us or our licensors. You may not copy, distribute, or create derivative works from our content without permission.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Limitation of Liability</h2>
        <p className="mb-6">Loop is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the app.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Changes</h2>
        <p className="mb-6">We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.</p>

        <h2 className="text-[18px] font-semibold text-[var(--inv-heading)] mb-3">Contact</h2>
        <p className="mb-6">Questions? Contact us at <span className="text-[var(--inv-accent)]">me@eythandami.co</span></p>
      </div>
    </main>
  )
}
