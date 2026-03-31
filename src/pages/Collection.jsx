import { useNavigate } from 'react-router-dom'
import { useGameState } from '../lib/use-game-state.js'
import { story } from '../data/story.js'
import Icon from '../lib/icon.jsx'
import { HeartIcon } from '../components/heart-icon.jsx'
import { FlameIcon } from '../components/flame-icon.jsx'

const allEndings = Object.values(story.nodes).filter((n) => n.ending)

export default function Collection() {
  const navigate = useNavigate()
  const { endingsFound, streak, hearts, maxHearts } = useGameState()

  const foundIds = new Set(endingsFound.map((e) => e.endingId))
  const hasAnyProgress = endingsFound.length > 0 || streak.current > 0
  const completionPct = Math.round((endingsFound.length / allEndings.length) * 100)

  return (
    <main className="min-h-[100dvh] bg-[var(--inv-bg)] pb-28 animate-page-enter">
      {/* Compact top area */}
      <div className="pt-14 px-6 pb-5">
        {/* Stats strip */}
        <div className="flex items-center gap-5 animate-fade-down">
          <div className="flex items-center gap-1.5">
            <HeartIcon size={20} />
            <span className="text-[14px] font-semibold text-[var(--inv-heading)] tabular-nums">{hearts}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FlameIcon size={20} />
            <span className="text-[14px] font-semibold text-[var(--inv-heading)] tabular-nums">{streak.current}d</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon name="trophy" size={14} className="text-yellow-500" />
            <span className="text-[14px] font-semibold text-[var(--inv-heading)] tabular-nums">{streak.best}d best</span>
          </div>
          <div className="flex-1" />
          <span className="text-[14px] text-[var(--inv-muted)] tabular-nums">{endingsFound.length}/{allEndings.length}</span>
        </div>
      </div>

      {/* Ring progress + completion */}
      <div className="flex flex-col items-center mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative w-32 h-32 mb-4">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="var(--inv-bg-alt)"
              strokeWidth="6"
            />
            {/* Fill */}
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="url(#ring-gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - completionPct / 100)}`}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            <defs>
              <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-semibold text-[var(--inv-heading)] tabular-nums leading-none">{completionPct}%</span>
            <span className="text-[12px] text-[var(--inv-muted)] mt-1 tracking-wider uppercase">Complete</span>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!hasAnyProgress && (
        <div className="animate-fade-up px-6 py-6 text-center" style={{ animationDelay: '0.1s' }}>
          <p className="text-[16px] text-[var(--inv-muted)] mb-5 max-w-[260px] mx-auto leading-relaxed">
            Play stories and make choices to discover endings and build your collection
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 h-[44px] rounded-2xl bg-[var(--inv-heading)] text-[var(--inv-bg)] font-medium text-[16px] cursor-pointer transition-all duration-200 active:scale-[0.97] inline-flex items-center gap-2"
          >
            <Icon name="play" size={16} className="ml-0.5" /> Start Playing
          </button>
        </div>
      )}

      {/* Endings grid */}
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          {allEndings.map((ending, i) => {
            const found = foundIds.has(ending.id)
            const foundData = endingsFound.find((e) => e.endingId === ending.id)

            return (
              <div
                key={ending.id}
                className="animate-fade-up"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div
                  className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${
                    found ? '' : 'opacity-35'
                  }`}
                  style={{
                    background: found
                      ? 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(244,114,182,0.04))'
                      : 'var(--inv-surface)',
                    boxShadow: found ? 'var(--inv-shadow-sm)' : 'none',
                  }}
                >
                  {/* Card content */}
                  <div className="p-4 min-h-[130px] flex flex-col justify-between">
                    {/* Top: icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                      found ? 'bg-pink-500/15' : 'bg-[var(--inv-bg-alt)]'
                    }`}>
                      {found ? (
                        <Icon name="trophy" size={16} className="text-pink-400" />
                      ) : (
                        <Icon name="lock" size={16} className="text-[var(--inv-muted)]" />
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <p className="text-[16px] font-semibold text-[var(--inv-heading)] leading-snug mb-1">
                        {found ? ending.endingTitle : '???'}
                      </p>
                      {found ? (
                        <p className="text-[12px] text-[var(--inv-muted)] leading-relaxed line-clamp-2">
                          {ending.endingDescription}
                        </p>
                      ) : (
                        <p className="text-[12px] text-[var(--inv-muted)] italic">
                          Undiscovered
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date stamp for found endings */}
                  {found && foundData && (
                    <div className="px-4 pb-3">
                      <span className="text-[11px] text-[var(--inv-muted)] tracking-wider uppercase">
                        {new Date(foundData.foundAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Subtle top accent line for found */}
                  {found && (
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: 'linear-gradient(90deg, #ec4899, #f472b6)' }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
