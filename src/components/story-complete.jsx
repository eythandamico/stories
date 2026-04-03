import Icon from '../lib/icon.jsx'
import { HeartIcon } from './heart-icon.jsx'
import { shareEnding } from '../lib/share.js'

export function StoryComplete({
  isOpen, endingTitle, endingDescription, connectionPct, storyTitle,
  isNewEnding, endingsFound, totalEndings, onReplay, onHome, onBuyNext, onBuySeries,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[55] flex flex-col" onClick={(e) => e.stopPropagation()}>
      {/* Progressive blur */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          maskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 85%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 45%, transparent 75%)' }}
      />

      {/* Share button — top right */}
      <button
        type="button"
        onClick={() => shareEnding(endingTitle, Math.round(connectionPct), storyTitle || 'Narrative')}
        className="absolute z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:scale-[0.96]"
        style={{
          top: 'calc(env(safe-area-inset-top, 20px) + 20px)',
          right: 20,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(255,255,255,0.12)',
        }}
        aria-label="Share"
      >
        <Icon name="share" size={18} className="text-white/80" />
      </button>

      {/* Content — bottom aligned */}
      <div className="relative flex-1 flex flex-col justify-end px-6 pb-[max(env(safe-area-inset-bottom),32px)]">
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
        <div className="flex items-center justify-center gap-6 mb-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
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

        {/* Heart earned */}
        {isNewEnding && (
          <div className="flex items-center justify-center gap-2 mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <HeartIcon size={18} />
            <span className="text-pink-400 text-[15px] font-medium">+1 Heart earned</span>
          </div>
        )}

        {/* Buy buttons */}
        <div className="flex gap-2.5 mb-3 animate-fade-up" style={{ animationDelay: '0.25s' }}>
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
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.35), rgba(168,85,247,0.35))', color: 'white' }}
          >
            <span className="font-semibold text-[15px]">Full Series</span>
            <span className="text-[12px] font-medium text-white/60">$4.99</span>
          </button>
        </div>

        {/* Replay / Home */}
        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
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
