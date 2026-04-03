import { useRef, useState, useEffect, useMemo, memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchFeed, clearCache } from '../lib/data.js'
import { useAuth } from '../lib/use-auth.jsx'
import { NoHeartsModal } from '../components/no-hearts-modal.jsx'
import { Onboarding, shouldShowOnboarding } from '../components/onboarding.jsx'
import { useGameState } from '../lib/use-game-state.js'
import { hapticLight, hapticError } from '../lib/haptics.js'
import { shareStory } from '../lib/share.js'
import PrismaticBurst from '../components/prismatic-burst.jsx'
import { FeedSkeleton } from '../components/skeleton.jsx'
import Icon from '../lib/icon.jsx'
import { HeartIcon } from '../components/heart-icon.jsx'
import { FlameIcon } from '../components/flame-icon.jsx'

// Only mount video elements for cards within this range of the active card
const RENDER_WINDOW = 2

const FeedCard = memo(function FeedCard({ item, i, isActive, isNearby, shaderReady, shaderVisible, onPlay }) {
  const videoRef = useRef(null)

  // Play/pause based on active state
  useEffect(() => {
    if (!videoRef.current) return
    if (isActive) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
      if (!isNearby) videoRef.current.currentTime = 0
    }
  }, [isActive, isNearby])

  return (
    <div
      data-index={i}
      role={item.route ? 'button' : undefined}
      tabIndex={item.route ? 0 : undefined}
      aria-label={item.route ? `Play ${item.title}` : `${item.title} — coming soon`}
      className="relative w-full h-[100dvh] snap-start snap-always flex items-center justify-center focus-visible:outline-none"
      onClick={() => item.route && onPlay(item)}
      onKeyDown={(e) => { if (item.route && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPlay(item) } }}
    >
      {/* Video — only mount when nearby */}
      {isNearby ? (
        <>
          <div className="absolute inset-0 video-shimmer" aria-hidden="true" />
          <video
            ref={videoRef}
            src={item.preview}
            poster={item.poster || ''}
            className="w-full h-full object-cover transition-opacity duration-500"
            aria-label={`${item.title} preview`}
            loop
            muted
            playsInline
            preload={isActive ? 'auto' : 'none'}
            onLoadedData={(e) => { e.target.style.opacity = 1 }}
            style={{ opacity: 0 }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black" />
      )}


      {/* Prismatic burst on trending */}
      {item.trending && isActive && shaderReady && (
        <div
          className="absolute inset-0 z-[7] pointer-events-none transition-opacity duration-1000"
          style={{ opacity: shaderVisible ? 0.8 : 0, mixBlendMode: 'lighten' }}
        >
          <PrismaticBurst
            intensity={2}
            speed={0.4}
            animationType="rotate3d"
            mixBlendMode="normal"
            offset={{ x: 0, y: -(window.innerHeight * 0.55) }}
          />
        </div>
      )}

      {/* Bottom blur + gradient — only render when active */}
      {isActive && (
        <>
          <div
            className="absolute bottom-0 left-0 right-0 h-[60%] z-[8] pointer-events-none animate-fade-up"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              maskImage: 'linear-gradient(to top, black 20%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 100%)',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[60%] z-[8] pointer-events-none animate-fade-up"
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Share button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); shareStory(item) }}
        className="absolute top-[env(safe-area-inset-top,20px)] right-5 mt-5 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-[0.96] hover:bg-white/15 transition-[opacity,transform] duration-300"
        style={{
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'translateY(0)' : 'translateY(-8px)',
          transitionDelay: isActive ? '0.3s' : '0s',
          pointerEvents: isActive ? 'auto' : 'none',
        }}
        aria-label="Share"
      >
        <Icon name="share" size={18} className="text-white/80" />
      </button>

      {/* Bottom content */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-8 pb-32 pt-24"
        style={{
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'translateY(0)' : 'translateY(24px)',
          transition: isActive
            ? 'opacity 0.6s ease-out 0.15s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s'
            : 'opacity 0.3s ease-in, transform 0.3s ease-in',
          pointerEvents: isActive ? 'auto' : 'none',
        }}
      >
        {/* Meta pills */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {item.trending && (
            <span className="px-3 py-1 rounded-lg text-[16px] font-semibold iridescent-text">
              Trending
            </span>
          )}
          <span className="px-3 py-1 rounded-lg bg-white/12 backdrop-blur-md text-white/85 text-[16px] font-medium">
            {item.genre}
          </span>
          {!item.route && (
            <span className="px-3 py-1 rounded-lg bg-white/8 text-white/50 text-[16px] font-medium">
              Coming Soon
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          className="text-white font-semibold leading-[0.95] tracking-[-0.02em] mb-3 text-center"
          style={{ fontSize: 'clamp(32px, 9vw, 44px)' }}
        >
          {item.title}
        </h2>

        {/* Description */}
        <p className="text-white/60 text-[16px] leading-[1.5] text-center mx-auto max-w-[85%]">
          {item.description}
        </p>

        {/* Social proof */}
        <div
          className="flex items-center justify-center mt-5 transition-opacity duration-500"
          style={{ opacity: isActive ? 1 : 0, transitionDelay: isActive ? '0.5s' : '0s' }}
        >
          <div className="flex items-center">
            <div className="flex" style={{ paddingLeft: 8 }}>
              {[
                `https://i.pravatar.cc/80?img=${(i * 7 + 1) % 70}`,
                `https://i.pravatar.cc/80?img=${(i * 7 + 14) % 70}`,
                `https://i.pravatar.cc/80?img=${(i * 7 + 29) % 70}`,
              ].map((src, j) => (
                <div
                  key={j}
                  className="rounded-full"
                  style={{
                    width: 28, height: 28,
                    marginLeft: j === 0 ? 0 : -8,
                    zIndex: j,
                    position: 'relative',
                    padding: 2,
                    clipPath: 'circle(50%)',
                  }}
                >
                  <img src={src} alt="" className="w-full h-full rounded-full object-cover" loading="lazy" />
                </div>
              ))}
              <div
                className="rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center"
                style={{
                  height: 28, paddingLeft: 8, paddingRight: 8,
                  marginLeft: -8, zIndex: 4, position: 'relative',
                  clipPath: 'inset(0 round 999px)',
                }}
              >
                <span className="text-white/70 text-[11px] font-semibold">+{[17, 24, 9, 31, 12][i % 5]}k</span>
              </div>
            </div>
          </div>
        </div>

        {/* Start / Resume button */}
        {item.route && (() => {
          const saved = localStorage.getItem(`narrative-progress-${item.storyId || item.id}`)
          const hasProgress = saved && (() => { try { const p = JSON.parse(saved); return Date.now() - p.savedAt < 86400000 } catch { return false } })()
          return (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPlay(item) }}
              className="mt-4 w-full h-[52px] rounded-2xl bg-white/15 backdrop-blur-md text-white cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] flex items-center justify-center gap-2"
              style={{
                opacity: isActive ? 1 : 0,
                transitionDelay: isActive ? '0.6s' : '0s',
              }}
            >
              {hasProgress ? (
                <>
                  <Icon name="play" size={18} />
                  <span className="font-semibold text-[16px]">Resume</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>
                  <span className="font-semibold text-[16px]">Start</span>
                </>
              )}
            </button>
          )
        })()}
      </div>
    </div>
  )
})

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const containerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [feed, setFeed] = useState([])
  const [feedLoaded, setFeedLoaded] = useState(false)
  const [showNoHearts, setShowNoHearts] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding())
  const [shaderReady, setShaderReady] = useState(false)
  const [shaderVisible, setShaderVisible] = useState(false)
  const { hearts, nextHeartTime, spendHeart, recordPlay, streak } = useGameState()

  // Load feed from API
  useEffect(() => {
    fetchFeed().then(data => { setFeed(data); setFeedLoaded(true) }).catch(() => setFeedLoaded(true))
  }, [])

  // Delay shader mount
  useEffect(() => {
    const t1 = setTimeout(() => setShaderReady(true), 2000)
    const t2 = setTimeout(() => setShaderVisible(true), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Snap scroll observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(Number(entry.target.dataset.index))
          }
        })
      },
      { root: container, threshold: 0.6 }
    )

    const items = container.querySelectorAll('[data-index]')
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [feed])

  const handlePlay = useCallback((item) => {
    if (!spendHeart()) {
      hapticError()
      setShowNoHearts(true)
      return
    }
    hapticLight()
    recordPlay()
    navigate(`/play/${item.storyId || item.id}`)
  }, [spendHeart, recordPlay, navigate])

  if (!feedLoaded) return <FeedSkeleton />

  if (feedLoaded && feed.length === 0) return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-8 text-center">
      <Icon name="play" size={48} className="text-white/20 mb-4" />
      <h2 className="text-white text-[22px] font-semibold mb-2">No stories yet</h2>
      <p className="text-white/40 text-[16px] mb-6">New stories are coming soon. Check back later.</p>
      <button
        type="button"
        onClick={() => { clearCache(); setFeedLoaded(false); fetchFeed().then(data => { setFeed(data); setFeedLoaded(true) }).catch(() => setFeedLoaded(true)) }}
        className="px-6 h-[44px] rounded-2xl bg-white/10 text-white font-medium text-[15px] cursor-pointer active:scale-[0.96]"
      >
        Refresh
      </button>
    </div>
  )

  return (
    <>
      {/* Top scrim */}
      <div
        className="fixed top-0 left-0 right-0 h-40 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(rgba(0,0,0,0.7) 20%, transparent)' }}
        aria-hidden="true"
      />

      {/* Profile avatar → settings */}
      <button
        type="button"
        onClick={() => navigate('/settings')}
        className="fixed top-[env(safe-area-inset-top,20px)] left-5 mt-5 z-30 w-10 h-10 rounded-full cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] hover:opacity-90"
        aria-label="Settings"
      >
        <img
          src={user?.photoURL || '/profile.jpg'}
          alt={`${user?.displayName || 'User'}'s profile`}
          className="w-full h-full rounded-full object-cover"
        />
        <span className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }} />
      </button>

      {/* Tokens */}
      <div className="fixed top-[env(safe-area-inset-top,20px)] right-5 mt-5 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/streaks')}
          className="flex items-center gap-2 px-3 h-10 rounded-full bg-white/10 backdrop-blur-xl cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] hover:bg-white/15"
        >
          <FlameIcon size={28} />
          <span className="text-white/80 text-[16px] font-semibold tabular-nums">{streak.current || 0}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/store')}
          className="flex items-center gap-2 px-3 h-10 rounded-full bg-white/10 backdrop-blur-xl cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] hover:bg-white/15"
        >
          <HeartIcon size={28} />
          <span className="text-white/80 text-[16px] font-semibold tabular-nums">{hearts}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white/40"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11 11H7V13H11V17H13V13H17V11H13V7H11V11Z"></path></svg>
        </button>
      </div>

      {/* Feed */}
      <div
        ref={containerRef}
        role="main"
        aria-label="Story feed"
        className="fixed inset-0 bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {feed.map((item, i) => (
          <FeedCard
            key={item.id}
            item={item}
            i={i}
            isActive={i === activeIndex}
            isNearby={Math.abs(i - activeIndex) <= RENDER_WINDOW}
            shaderReady={shaderReady}
            shaderVisible={shaderVisible}
            onPlay={handlePlay}
          />
        ))}
      </div>

      {/* Modals */}
      <NoHeartsModal
        isOpen={showNoHearts}
        onClose={() => setShowNoHearts(false)}
        nextHeartTime={nextHeartTime}
        onBuy={() => { setShowNoHearts(false); navigate('/store') }}
      />
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
    </>
  )
}
