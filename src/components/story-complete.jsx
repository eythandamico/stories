import Icon from '../lib/icon.jsx'
import { HeartIcon } from './heart-icon.jsx'

export function StoryComplete({
  isOpen, endingTitle, endingDescription, connectionPct,
  isNewEnding, endingsFound, totalEndings, onReplay, onHome,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center pt-[15vh] px-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onHome} />
      <div
        className="relative max-w-sm w-full rounded-2xl bg-[var(--inv-surface)] p-6 animate-scale-in"
        style={{ boxShadow: 'var(--inv-shadow)' }}
      >
        {/* New ending badge */}
        {isNewEnding && (
          <div className="flex items-center justify-center gap-2 mb-4 animate-fade-up">
            <Icon name="sparkle" size={16} className="text-pink-400" />
            <span className="text-pink-400 text-[16px] font-semibold">New Ending Discovered!</span>
            <Icon name="sparkle" size={16} className="text-pink-400" />
          </div>
        )}

        {/* Ending info */}
        <h2 className="text-[24px] font-semibold text-[var(--inv-heading)] mb-2 text-center">{endingTitle}</h2>
        <p className="text-[16px] text-[var(--inv-muted)] text-center mb-5">{endingDescription}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-[var(--inv-bg-alt)] p-3 text-center">
            <HeartIcon size={28} />
            <p className="text-[20px] font-semibold text-[var(--inv-heading)] tabular-nums">{Math.round(connectionPct)}%</p>
            <p className="text-[16px] text-[var(--inv-muted)]">Connection</p>
          </div>
          <div className="rounded-xl bg-[var(--inv-bg-alt)] p-3 text-center">
            <Icon name="trophy" size={20} className="text-yellow-500 mx-auto mb-1" />
            <p className="text-[20px] font-semibold text-[var(--inv-heading)] tabular-nums">{endingsFound}/{totalEndings}</p>
            <p className="text-[16px] text-[var(--inv-muted)]">Endings</p>
          </div>
        </div>

        {/* Endings progress */}
        <div className="w-full h-2 rounded-full bg-[var(--inv-bg-alt)] overflow-hidden mb-5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(endingsFound / totalEndings) * 100}%`,
              background: 'linear-gradient(90deg, #ec4899, #f472b6)',
            }}
          />
        </div>

        {isNewEnding && (
          <div className="flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-xl bg-pink-500/10">
            <HeartIcon size={20} />
            <span className="text-pink-400 text-[16px] font-medium">+1 Heart earned!</span>
          </div>
        )}

        {/* Actions */}
        <button
          type="button"
          onClick={onReplay}
          className="w-full h-[48px] rounded-2xl bg-[var(--inv-heading)] text-[var(--inv-bg)] font-semibold text-[16px] cursor-pointer transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 mb-3"
        >
          <Icon name="rotate-ccw" size={18} /> Play Again
        </button>
        <button
          type="button"
          onClick={onHome}
          className="w-full h-[48px] rounded-2xl bg-[var(--inv-bg-alt)] text-[var(--inv-heading)] font-medium text-[16px] cursor-pointer transition-all duration-200 active:scale-[0.97] hover:opacity-80 flex items-center justify-center gap-2"
        >
          <Icon name="home" size={18} /> Home
        </button>
      </div>
    </div>
  )
}
