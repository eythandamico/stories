import Icon from '../lib/icon.jsx'

export function ChoiceCard({ label, index, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-[var(--inv-surface)] border border-[var(--inv-border)] cursor-pointer transition-all duration-200 ease-out hover:border-[var(--inv-accent)] hover:bg-[var(--inv-accent-soft)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--inv-accent)] focus-visible:outline-none group"
      style={{ boxShadow: 'var(--inv-shadow-sm)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--inv-bg-alt)] flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:bg-[var(--inv-accent)] group-hover:text-white">
          <span className="text-[var(--inv-text-sm)] font-medium text-[var(--inv-muted)] group-hover:text-white">
            {String.fromCharCode(65 + index)}
          </span>
        </div>
        <span className="inv-subheading flex-1">{label}</span>
        <Icon name="chevron-right" size={18} className="text-[var(--inv-muted)] transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </button>
  )
}
