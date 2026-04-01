import Icon from '../lib/icon.jsx'
import { HeartIcon } from './heart-icon.jsx'

export function StoryComplete({
  isOpen, endingTitle, endingDescription, connectionPct,
  isNewEnding, endingsFound, totalEndings, onReplay, onHome,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[55] flex flex-col justify-end" onClick={(e) => e.stopPropagation()}>
      {/* Progressive blur overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          maskImage: 'linear-gradient(to top, black 40%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 80%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(transparent 20%, rgba(0,0,0,0.8))' }}
      />

      {/* Content */}
      <div className="relative px-6 pb-[max(env(safe-area-inset-bottom),32px)]">
        {/* New ending badge */}
        {isNewEnding && (
          <div className="flex items-center justify-center gap-2 mb-4 animate-fade-up">
            <Icon name="sparkle" size={14} className="text-pink-400" />
            <span className="text-pink-400 text-[15px] font-semibold tracking-wide">New Ending Discovered</span>
            <Icon name="sparkle" size={14} className="text-pink-400" />
          </div>
        )}

        {/* Title */}
        <h2 className="text-white font-semibold text-[28px] leading-tight tracking-[-0.02em] text-center mb-2 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {endingTitle}
        </h2>
        <p className="text-white/50 text-[15px] leading-relaxed text-center mb-6 max-w-[85%] mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {endingDescription}
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-6 mb-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2">
            <HeartIcon size={22} />
            <span className="text-white text-[20px] font-semibold tabular-nums">{Math.round(connectionPct)}%</span>
          </div>
          <div className="w-px h-5 bg-white/15" />
          <div className="flex items-center gap-2">
            <Icon name="trophy" size={18} className="text-yellow-500" />
            <span className="text-white text-[20px] font-semibold tabular-nums">{endingsFound}/{totalEndings}</span>
          </div>
        </div>

        {/* Endings progress */}
        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-out"
            style={{
              width: `${(endingsFound / totalEndings) * 100}%`,
              background: 'linear-gradient(90deg, #ec4899, #f472b6)',
            }}
          />
        </div>

        {/* Heart earned */}
        {isNewEnding && (
          <div className="flex items-center justify-center gap-2 mb-5 animate-fade-up" style={{ animationDelay: '0.25s' }}>
            <HeartIcon size={18} />
            <span className="text-pink-400 text-[15px] font-medium">+1 Heart earned</span>
          </div>
        )}

        {/* Buttons */}
        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <button
            type="button"
            onClick={onReplay}
            className="w-full h-[50px] rounded-2xl bg-white text-black font-semibold text-[16px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] flex items-center justify-center gap-2 mb-2.5"
          >
            <Icon name="rotate-ccw" size={18} /> Play Again
          </button>
          <button
            type="button"
            onClick={onHome}
            className="w-full h-[48px] rounded-2xl bg-white/10 text-white/70 font-medium text-[16px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] hover:bg-white/15 flex items-center justify-center gap-2"
          >
            <Icon name="home" size={18} /> Home
          </button>
        </div>
      </div>
    </div>
  )
}
