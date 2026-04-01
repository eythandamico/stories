import { useRef, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { feed } from '../data/feed.js'
import { ProfileMenu } from '../components/profile-menu.jsx'
import { NoHeartsModal } from '../components/no-hearts-modal.jsx'
import { BuyHeartsModal } from '../components/buy-hearts-modal.jsx'
import { StreakModal } from '../components/streak-modal.jsx'
import { Onboarding, shouldShowOnboarding } from '../components/onboarding.jsx'
import { useGameState } from '../lib/use-game-state.js'
import { hapticLight, hapticError } from '../lib/haptics.js'
import { posterUrl } from '../lib/config.js'
import PrismaticBurst from '../components/prismatic-burst.jsx'
import Icon from '../lib/icon.jsx'
import { HeartIcon } from '../components/heart-icon.jsx'
import { FlameIcon } from '../components/flame-icon.jsx'

// Only mount video elements for cards within this range of the active card
const RENDER_WINDOW = 2

function FeedCard({ item, i, isActive, isNearby, shaderReady, shaderVisible, onPlay }) {
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
            poster={posterUrl(item.preview)}
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
        onClick={(e) => e.stopPropagation()}
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
          style={{
            opacity: isActive ? 1 : 0,
            transitionDelay: isActive ? '0.5s' : '0s',
          }}
        >
          <div className="flex items-center">
            <div className="flex" style={{ paddingLeft: 10 }}>
              {[
                `https://i.pravatar.cc/80?img=${(i * 7 + 1) % 70}`,
                `https://i.pravatar.cc/80?img=${(i * 7 + 14) % 70}`,
                `https://i.pravatar.cc/80?img=${(i * 7 + 29) % 70}`,
                `https://i.pravatar.cc/80?img=${(i * 7 + 43) % 70}`,
              ].map((src, j) => (
                <div
                  key={j}
                  className="rounded-full"
                  style={{
                    width: 32, height: 32,
                    marginLeft: j === 0 ? 0 : -10,
                    zIndex: j,
                    position: 'relative',
                    padding: 2,
                    background: 'transparent',
                    clipPath: 'circle(50%)',
                  }}
                >
                  <img src={src} alt="" className="w-full h-full rounded-full object-cover" loading="lazy" />
                </div>
              ))}
              <div
                className="rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center"
                style={{
                  width: 44, height: 32,
                  marginLeft: -10,
                  zIndex: 5,
                  position: 'relative',
                  clipPath: 'inset(0 round 999px)',
                }}
              >
                <span className="text-white/70 text-[11px] font-semibold">+{[17, 24, 9, 31, 12][i % 5]}k</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showNoHearts, setShowNoHearts] = useState(false)
  const [showBuyHearts, setShowBuyHearts] = useState(false)
  const [showStreak, setShowStreak] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding())
  const [shaderReady, setShaderReady] = useState(false)
  const [shaderVisible, setShaderVisible] = useState(false)
  const { hearts, maxHearts, nextHeartTime, spendHeart, purchaseHearts, purchasePerks, recordPlay, streak } = useGameState()

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
  }, [])

  const handlePlay = (item) => {
    if (!spendHeart()) {
      hapticError()
      setShowNoHearts(true)
      return
    }
    hapticLight()
    recordPlay()
    navigate(item.route)
  }

  return (
    <>
      {/* Top scrim */}
      <div
        className="fixed top-0 left-0 right-0 h-40 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(rgba(0,0,0,0.7) 20%, transparent)' }}
        aria-hidden="true"
      />

      {/* Profile avatar */}
      <div className="fixed top-[env(safe-area-inset-top,20px)] left-5 mt-5 z-30">
        <ProfileMenu
          avatarUrl="/profile.jpg"
          profile={{ name: 'Leo', email: 'leo@example.com' }}
          profileItems={[
            { icon: 'settings', label: 'Settings', onAction: () => navigate('/settings') },
            { icon: 'user', label: 'Edit Profile', onAction: () => {} },
            { icon: 'logout', label: 'Sign Out', danger: true, onAction: () => {} },
          ]}
          placement="bottom-left"
          size={40}
          rounded="full"
        />
      </div>

      {/* Tokens */}
      <div className="fixed top-[env(safe-area-inset-top,20px)] right-5 mt-5 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowStreak(true)}
          className="flex items-center gap-2 px-3 h-10 rounded-full bg-white/10 backdrop-blur-xl cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] hover:bg-white/15"
        >
          <FlameIcon size={28} />
          <span className="text-white/80 text-[16px] font-semibold tabular-nums">{streak.current || 0}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowBuyHearts(true)}
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
        style={{ scrollSnapType: 'y mandatory' }}
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
      <StreakModal
        isOpen={showStreak}
        onClose={() => setShowStreak(false)}
        streak={streak}
        onClaimReward={(count) => purchaseHearts(count)}
      />
      <NoHeartsModal
        isOpen={showNoHearts}
        onClose={() => setShowNoHearts(false)}
        nextHeartTime={nextHeartTime}
        onBuy={() => { setShowNoHearts(false); setShowBuyHearts(true) }}
      />
      <BuyHeartsModal
        isOpen={showBuyHearts}
        onClose={() => setShowBuyHearts(false)}
        onPurchase={(count) => purchaseHearts(count)}
        onPurchasePerks={(type, count) => purchasePerks(type, count)}
      />
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
    </>
  )
}
