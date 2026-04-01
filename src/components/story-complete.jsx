import Icon from '../lib/icon.jsx'
import { HeartIcon } from './heart-icon.jsx'

export function StoryComplete({
  isOpen, endingTitle, endingDescription, connectionPct,
  isNewEnding, endingsFound, totalEndings, onReplay, onHome, onBuyNext, onBuySeries,
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

        {/* Buy options */}
        <div className="animate-fade-up mb-4" style={{ animationDelay: '0.3s' }}>
          <p className="text-white/30 text-[12px] font-medium tracking-widest uppercase text-center mb-3">Continue the story</p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onBuyNext}
              className="flex-1 h-[52px] rounded-2xl bg-white text-black font-semibold text-[15px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] flex flex-col items-center justify-center"
            >
              <span>Next Chapter</span>
              <span className="text-[12px] font-medium text-black/50">$1.99</span>
            </button>
            <button
              type="button"
              onClick={onBuySeries}
              className="flex-1 h-[52px] rounded-2xl cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(168,85,247,0.3))', color: 'white' }}
            >
              <span className="font-semibold text-[15px]">Full Series</span>
              <span className="text-[12px] font-medium text-white/60">$4.99</span>
            </button>
          </div>
        </div>

        {/* Other buttons */}
        <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
          <button
            type="button"
            onClick={onReplay}
            className="w-full h-[48px] rounded-2xl bg-white/10 text-white/70 font-medium text-[16px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] hover:bg-white/15 flex items-center justify-center gap-2 mb-2.5"
          >
            <Icon name="rotate-ccw" size={16} /> Play Again
          </button>
          <button
            type="button"
            onClick={onHome}
            className="w-full h-[44px] rounded-2xl text-white/40 font-medium text-[15px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] flex items-center justify-center gap-2"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
