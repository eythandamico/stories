import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchStory, fetchChoiceStats } from '../lib/data.js'
import { api } from '../lib/api.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { useGameState } from '../lib/use-game-state.js'
import { StoryComplete } from '../components/story-complete.jsx'
import { Stack } from '../components/stack.jsx'
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../lib/haptics.js'
import { soundClick, soundPositive, soundNeutral, soundConnection, soundTick, soundTimerWarn, soundTimerExpired, soundEndingDiscovered, startHeartbeat, stopHeartbeat } from '../lib/sounds.js'
import Icon from '../lib/icon.jsx'
import { HeartIcon } from '../components/heart-icon.jsx'
import { BuyHeartsModal } from '../components/buy-hearts-modal.jsx'

const MAX_CONNECTION = 5

const DEFAULT_PARAMS = {
  blurHeight: 390,
  blurAmount: 21,
  blurMaskEnd: 90,
  blurMaskSolid: 40,
  gradAngle: 190,
  gradPink: 0.7,
  gradOrange: 0.15,
  gradPurple: 0.25,
  gradMaskSolid: 35,
  pillPink: 0.3,
  pillOrange: 0.2,
  pillBorder: 0,
  pillGlow: 0,
  animDuration: 2.3,
}

function ConnectionBurst({ connection, onDevToggle }) {
  const [p] = useState(DEFAULT_PARAMS)
  const [showing, setShowing] = useState(false)
  const [visible, setVisible] = useState(true)

  // Mount → fade in (next frame) → hold → fade out → unmount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShowing(true))
    const holdMs = p.animDuration * 0.7 * 1000
    const totalMs = p.animDuration * 1000
    const t1 = setTimeout(() => setShowing(false), holdMs)
    const t2 = setTimeout(() => setVisible(false), totalMs)
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-[46] pointer-events-none">
        {/* Background blur — static blur, opacity controlled */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: p.blurHeight,
            backdropFilter: `blur(${p.blurAmount}px)`,
            WebkitBackdropFilter: `blur(${p.blurAmount}px)`,
            maskImage: `linear-gradient(to bottom, black 0%, black ${p.blurMaskSolid}%, transparent ${p.blurMaskEnd}%)`,
            WebkitMaskImage: `linear-gradient(to bottom, black 0%, black ${p.blurMaskSolid}%, transparent ${p.blurMaskEnd}%)`,
            opacity: showing ? 1 : 0,
            transition: `opacity ${showing ? '0.4s ease-out' : '0.6s ease-in'}`,
          }}
        />
        {/* Gradient overlay — same opacity pattern */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: p.blurHeight,
            background: `linear-gradient(${p.gradAngle}deg, rgba(236,72,153,${p.gradPink}) 0%, rgba(249,115,22,${p.gradOrange}) 40%, rgba(168,85,247,${p.gradPurple}) 70%, transparent 100%)`,
            maskImage: `linear-gradient(to bottom, black 0%, black ${p.gradMaskSolid}%, transparent 100%)`,
            WebkitMaskImage: `linear-gradient(to bottom, black 0%, black ${p.gradMaskSolid}%, transparent 100%)`,
            opacity: showing ? 1 : 0,
            transition: `opacity ${showing ? '0.4s ease-out' : '0.6s ease-in'}`,
          }}
        />
        {/* Pill blur — static blur, opacity controlled */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center"
          style={{
            top: 'calc(env(safe-area-inset-top, 20px) + 20px)',
            opacity: showing ? 1 : 0,
            transition: `opacity ${showing ? '0.4s ease-out' : '0.6s ease-in'}`,
          }}
        >
          <div
            className="h-10 px-3.5 rounded-full flex items-center"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              background: 'rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center gap-1.5 opacity-0">
              <HeartIcon size={20} />
              <span className="text-[16px] font-semibold">+{connection * 5}</span>
            </div>
          </div>
        </div>
        {/* Pill content — scales with transform (no backdrop-filter needed) */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center"
          style={{
            top: 'calc(env(safe-area-inset-top, 20px) + 20px)',
            opacity: showing ? 1 : 0,
            transform: showing ? 'scale(1)' : 'scale(0)',
            transition: showing
              ? 'opacity 0.3s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'opacity 0.6s ease-in, transform 0.6s ease-in',
          }}
        >
          <div className="h-10 flex items-center gap-1.5 px-3.5 rounded-full">
            <HeartIcon size={20} />
            <span className="text-white text-[16px] font-semibold">+{connection * 5}</span>
          </div>
        </div>
      </div>

    </>
  )
}

export default function StoryPlayer() {
  const navigate = useNavigate()
  const { storyId } = useParams()
  const { addEnding, endingsFound, hearts, spendHeart, perks, usePerk, purchasePerks } = useGameState()

  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const videoRef = useRef(null)
  const [transitioning, setTransitioning] = useState(false)
  const [newEnding, setNewEnding] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [hintActive, setHintActive] = useState(false)
  const [freezeActive, setFreezeActive] = useState(false)
  const [showBuyPerks, setShowBuyPerks] = useState(false)
  const [perkFlash, setPerkFlash] = useState(null)
  const [choicesExiting, setChoicesExiting] = useState(false)
  const [showConnectionBurst, setShowConnectionBurst] = useState(false)
  const [currentNodeId, setCurrentNodeId] = useState(null)
  const [videoError, setVideoError] = useState(false)

  // Save progress to localStorage
  const saveProgress = useCallback((nodeId, hist, conn) => {
    const id = storyId || 'romantic-adventure'
    localStorage.setItem(`narrative-progress-${id}`, JSON.stringify({
      nodeId, history: hist, connection: conn, savedAt: Date.now(),
    }))
  }, [storyId])

  const clearProgress = useCallback(() => {
    const id = storyId || 'romantic-adventure'
    localStorage.removeItem(`narrative-progress-${id}`)
  }, [storyId])

  // Load story from API, resume if saved progress exists
  useEffect(() => {
    const id = storyId || 'romantic-adventure'
    fetchStory(id).then(s => {
      setStory(s)
      const saved = localStorage.getItem(`narrative-progress-${id}`)
      if (saved) {
        try {
          const p = JSON.parse(saved)
          // Only resume if save is less than 24h old and node exists
          if (p.nodeId && s.nodes[p.nodeId] && Date.now() - p.savedAt < 86400000) {
            setCurrentNodeId(p.nodeId)
            setHistory(p.history || [])
            setConnection(p.connection || 0)
            setLoading(false)
            return
          }
        } catch {}
      }
      setCurrentNodeId(s.startNodeId)
      setLoading(false)
    })
  }, [storyId])

  const allEndings = story ? Object.values(story.nodes).filter(n => n.ending) : []
  const [showChoices, setShowChoices] = useState(false)
  const [chosenIndex, setChosenIndex] = useState(null)
  const [showPercentages, setShowPercentages] = useState(false)
  const [liveStats, setLiveStats] = useState(null) // { 0: 78, 1: 22 }
  const [history, setHistory] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [connection, setConnection] = useState(0)
  const [showConnectionBar, setShowConnectionBar] = useState(false)

  // Timer state
  const [timerActive, setTimerActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const [timerExtended, setTimerExtended] = useState(false)

  const hideTimer = useRef(null)
  const connectionTimer = useRef(null)
  const timerRef = useRef(null)
  const tickRef = useRef(null)

  const node = story?.nodes?.[currentNodeId]

  // Reset state on node change — swap video src without remount
  const isFirstNode = useRef(true)
  useEffect(() => {
    if (!node || !videoRef.current) return

    setProgress(0)
    setIsPlaying(true)
    setShowControls(false)
    setChosenIndex(null)
    setShowPercentages(false)
    setLiveStats(null)
    setTimerActive(false)
    setTimerExtended(false)
    setHintActive(false)
    setFreezeActive(false)
    stopHeartbeat()

    if (isFirstNode.current) {
      isFirstNode.current = false
      return // First node uses the src set in JSX
    }

    // Fade out, swap src, fade back in only when video is ready
    const video = videoRef.current
    setTransitioning(true)
    setTimeout(() => {
      video.muted = false
      video.loop = false

      // Listen for the video to be ready before fading in
      const onReady = () => {
        video.removeEventListener('canplay', onReady)
        setTransitioning(false)
      }
      video.addEventListener('canplay', onReady)

      video.src = node.video
      video.load()
      video.play().catch(() => {})

      // Safety timeout — fade in after 2s max even if canplay doesn't fire
      setTimeout(() => {
        video.removeEventListener('canplay', onReady)
        setTransitioning(false)
      }, 2000)
    }, 300)
  }, [currentNodeId])

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying && !showChoices) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000)
    }
    return () => clearTimeout(hideTimer.current)
  }, [showControls, isPlaying, showChoices])

  // Countdown timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || freezeActive) return

    // Heartbeat starts at 5 seconds
    if (timeLeft <= 5 && timeLeft > 0) startHeartbeat(timeLeft <= 3 ? 120 : 90)

    tickRef.current = setTimeout(() => {
      const next = timeLeft - 1
      setTimeLeft(next)

      if (next <= 3 && next > 0) {
        soundTimerWarn()
        hapticLight()
      } else if (next > 3) {
        soundTick()
      }

      if (next <= 0) {
        // Time expired — auto-select last choice (usually the negative one)
        soundTimerExpired()
        hapticError()
        stopHeartbeat()
        setTimerActive(false)
        const lastChoice = node.choices[node.choices.length - 1]
        handleChoiceInternal(lastChoice, node.choices.length - 1)
      }
    }, 1000)

    return () => clearTimeout(tickRef.current)
  }, [timerActive, timeLeft])

  // Cleanup heartbeat on unmount
  useEffect(() => () => stopHeartbeat(), [])

  const togglePlay = () => {
    if (!videoRef.current || showChoices) return
    if (videoRef.current.paused) {
      videoRef.current.play()
    } else {
      videoRef.current.pause()
    }
  }

  // Smooth 60fps progress tracking via rAF
  const progressRaf = useRef(null)
  const updateProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100)
    }
    progressRaf.current = requestAnimationFrame(updateProgress)
  }, [])

  useEffect(() => {
    if (isPlaying) {
      progressRaf.current = requestAnimationFrame(updateProgress)
    } else {
      cancelAnimationFrame(progressRaf.current)
    }
    return () => cancelAnimationFrame(progressRaf.current)
  }, [isPlaying, updateProgress])

  const handleSeek = (e) => {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * videoRef.current.duration
  }

  // Preload next videos when choices appear (warm the browser cache)
  const preloadNextVideos = useCallback((choices) => {
    choices?.forEach(choice => {
      const nextNode = story?.nodes?.[choice.nextNodeId]
      if (nextNode?.video) {
        fetch(nextNode.video, { mode: 'no-cors' }).catch(() => {})
      }
    })
  }, [story])

  const handleVideoEnd = useCallback(() => {
    setShowChoices(true)
    setShowControls(true)
    if (videoRef.current) {
      videoRef.current.muted = true
      videoRef.current.loop = true
      videoRef.current.play().catch(() => {})
    }

    const currentNode = story.nodes[currentNodeId]

    // Preload destination videos
    if (currentNode?.choices?.length) {
      preloadNextVideos(currentNode.choices)
    }

    // Fetch live choice stats from API
    if (currentNode?.choices?.length && !currentNode?.ending) {
      const sid = storyId || 'romantic-adventure'
      setLiveStats(null)
      fetchChoiceStats(sid, currentNodeId, currentNode.choices.length).then(pcts => {
        if (pcts) setLiveStats(pcts)
      })
    }

    // Start timer if timed
    if (currentNode?.timed && !currentNode?.ending) {
      setTimerTotal(currentNode.timerSeconds)
      setTimeLeft(currentNode.timerSeconds)
      setTimerActive(true)
    }

    // Record ending
    if (currentNode?.ending) {
      const isNew = addEnding(story.id, currentNode.id, currentNode.endingTitle)
      setNewEnding(isNew)
      if (isNew) {
        hapticSuccess()
        soundEndingDiscovered()
      }
      clearProgress()
      setShowComplete(true)
    }
  }, [currentNodeId, addEnding])

  const handleChoiceInternal = (choice, index) => {
    // Stop timer
    setTimerActive(false)
    stopHeartbeat()
    clearTimeout(tickRef.current)

    // Show selection + percentages
    setChosenIndex(index)
    setShowPercentages(true)
    soundClick()

    // Sound based on choice type
    setTimeout(() => {
      if (choice.positive) {
        soundPositive()
        setConnection((prev) => Math.min(prev + 1, MAX_CONNECTION))
        setShowConnectionBar(true)
        setShowConnectionBurst(true)
        hapticMedium()
        soundConnection()
        clearTimeout(connectionTimer.current)
        connectionTimer.current = setTimeout(() => setShowConnectionBar(false), 2000)
        setTimeout(() => setShowConnectionBurst(false), 1500)
      } else {
        soundNeutral()
      }
    }, 200)

    // Record choice to API
    if (isFirebaseConfigured) {
      const sid = storyId || 'romantic-adventure'
      api.recordChoice(sid, currentNodeId, index).catch(() => {})
    }

    // Fade out choices, then swap node after fade completes
    setTimeout(() => {
      setChoicesExiting(true)
    }, 1800)
    setTimeout(() => {
      const newHistory = [...history, currentNodeId]
      const newConnection = choice.positive ? Math.min(connection + 1, MAX_CONNECTION) : connection
      setHistory(newHistory)
      setShowChoices(false)
      setChoicesExiting(false)
      setCurrentNodeId(choice.nextNodeId)
      saveProgress(choice.nextNodeId, newHistory, newConnection)
    }, 2400)
  }

  const handleChoice = (choice, index) => {
    hapticLight()
    handleChoiceInternal(choice, index)
  }

  const handleExtendTimer = () => {
    if (!spendHeart()) {
      hapticError()
      return
    }
    hapticLight()
    soundClick()
    setTimeLeft((prev) => prev + 10)
    setTimerTotal((prev) => prev + 10)
    setTimerExtended(true)
    stopHeartbeat()
  }

  const handleRestart = () => {
    setHistory([])
    setShowChoices(false)
    setConnection(0)
    setShowComplete(false)
    setNewEnding(false)
    stopHeartbeat()
    clearProgress()
    setCurrentNodeId(story.startNodeId)
  }

  const handleGoBack = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setShowChoices(false)
    stopHeartbeat()
    setCurrentNodeId(prev)
  }

  const triggerPerkFlash = (color) => {
    setPerkFlash(color)
    setTimeout(() => setPerkFlash(null), 600)
  }

  const handleFreeze = () => {
    if (!usePerk('freeze')) return
    hapticMedium()
    soundClick()
    setFreezeActive(true)
    stopHeartbeat()
    triggerPerkFlash('#38bdf8')
  }

  const handleHint = () => {
    if (!usePerk('hint')) return
    hapticMedium()
    soundClick()
    setHintActive(true)
    triggerPerkFlash('#a78bfa')
  }

  const handleRewind = () => {
    if (history.length === 0 || !usePerk('rewind')) return
    hapticMedium()
    soundClick()
    triggerPerkFlash('#34d399')
    handleGoBack()
  }

  // Hold to skip
  const [skipping, setSkipping] = useState(false)
  const skipInterval = useRef(null)
  const holdTimeout = useRef(null)

  const handlePointerDown = () => {
    if (showChoices) return
    holdTimeout.current = setTimeout(() => {
      setSkipping(true)
      hapticLight()
      skipInterval.current = setInterval(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(
            videoRef.current.currentTime + 0.5,
            videoRef.current.duration
          )
        }
      }, 50)
    }, 300)
  }

  const handlePointerUp = () => {
    clearTimeout(holdTimeout.current)
    clearInterval(skipInterval.current)
    setSkipping(false)
  }

  if (loading || !node) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
    </div>
  )

  const currentScene = history.length + 1
  const connectionPct = (connection / MAX_CONNECTION) * 100
  const timerPct = timerTotal > 0 ? (timeLeft / timerTotal) * 100 : 100

  return (
    <main
      className="fixed inset-0 bg-black flex items-center justify-center select-none"
      style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      onClick={() => { if (!skipping) { setShowControls(true); togglePlay() } }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay() } }}
      tabIndex={0}
      aria-label={`Playing: ${node.title}`}
    >
      <div className="absolute inset-0 video-shimmer" aria-hidden="true" />

      {/* Skip indicator */}
      {skipping && (
        <div className="absolute top-[calc(env(safe-area-inset-top,20px)+70px)] left-0 right-0 z-[50] flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md animate-fade-up">
            <Icon name="skip-forward" size={16} className="text-white/70" />
            <span className="text-white/70 text-[14px] font-medium">Skipping...</span>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={node.video}
        poster={node.poster || ''}
        aria-label={node.title}
        className="w-full h-full object-cover"
        style={{
          opacity: transitioning ? 0 : 1,
          transition: transitioning
            ? 'opacity 0.25s ease-in'
            : 'opacity 0.35s ease-out',
        }}
        onEnded={handleVideoEnd}
        onPlay={() => { setIsPlaying(true); setVideoError(false) }}
        onPause={() => setIsPlaying(false)}
        onError={() => setVideoError(true)}
        autoPlay
        playsInline
        preload="auto"
      />

      {/* Video error fallback */}
      {videoError && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center bg-black/80">
          <Icon name="alert-triangle" size={32} className="text-white/40 mb-3" />
          <p className="text-white/60 text-[16px] mb-4">Video failed to load</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setVideoError(false); videoRef.current?.load() }}
            className="px-6 h-[44px] rounded-2xl bg-white/15 text-white font-medium text-[15px] cursor-pointer active:scale-[0.96]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)' }}
        aria-hidden="true"
      />

      {/* Connection burst */}
      {showConnectionBurst && (
        <ConnectionBurst connection={connection} />
      )}


      {/* Perk flash effect */}
      {perkFlash && (
        <div
          key={Date.now()}
          className="absolute inset-0 z-[30] pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${perkFlash}30 0%, transparent 70%)`,
            animation: 'perk-flash 0.6s ease-out forwards',
          }}
        />
      )}


      {/* Close button — always visible */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); navigate('/') }}
        className="absolute z-30 w-10 h-10 rounded-full bg-white/[0.14] backdrop-blur-md flex items-center justify-center cursor-pointer transition-[opacity,transform,background-color] duration-200 active:scale-[0.96] hover:bg-white/15"
        style={{ top: 'calc(env(safe-area-inset-top, 20px) + 20px)', left: 20 }}
        aria-label="Close"
      >
        <Icon name="close" size={18} className="text-white/80" />
      </button>

      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 px-5 pt-[calc(env(safe-area-inset-top,20px)+20px)] pb-6 flex items-center justify-between transition-[opacity,transform] duration-500 ${
          showComplete ? 'opacity-0 pointer-events-none' : (showControls || showChoices) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'linear-gradient(rgba(0,0,0,0.4), transparent)' }}
      >
        {/* Spacer where close button was */}
        <div className="w-10 h-10" />

        {/* Timer in top right */}
        {timerActive && showChoices && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl"
            style={{
              background: timeLeft <= 3 ? 'rgba(239,68,68,0.25)' : timeLeft <= 5 ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.1)',
            }}
          >
            <Icon name="clock" size={14} style={{ color: timeLeft <= 3 ? '#ef4444' : timeLeft <= 5 ? '#f97316' : 'rgba(255,255,255,0.6)' }} />
            <span
              className="text-[16px] font-semibold tabular-nums"
              style={{ color: timeLeft <= 3 ? '#ef4444' : timeLeft <= 5 ? '#f97316' : 'rgba(255,255,255,0.7)' }}
            >
              {timeLeft}
            </span>
          </div>
        )}
      </div>

      {/* Play button — only show when user deliberately paused */}
      {!isPlaying && !showChoices && !choicesExiting && !showComplete && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none animate-scale-in">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 56, height: 56,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              background: 'rgba(255,255,255,0.15)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}>
              <path d="M8 5.14v14l11-7-11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Bottom content */}
      {(() => {
        const visible = showChoices && !choicesExiting && !showComplete
        const hidden = showComplete || (!showChoices && !choicesExiting)
        return (
      <div
        className={`fixed inset-0 z-10 flex flex-col justify-end ${hidden ? 'pointer-events-none' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progressive blur — opacity-controlled so it fades smoothly */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            maskImage: 'linear-gradient(to top, black 0%, black 45%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 45%, transparent 85%)',
            opacity: visible ? 1 : 0,
            transition: `opacity ${choicesExiting ? '0.5s cubic-bezier(0.55, 0, 1, 0.45)' : '0.6s ease-out'}`,
          }}
          aria-hidden="true"
        />
        {/* Dark gradient on top for text legibility */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
            opacity: visible ? 1 : 0,
            transition: `opacity ${choicesExiting ? '0.5s cubic-bezier(0.55, 0, 1, 0.45)' : '0.6s ease-out'}`,
          }}
          aria-hidden="true"
        />

        <div className="relative px-5 pb-[max(env(safe-area-inset-bottom),16px)] text-center"
          style={{
            opacity: visible ? 1 : 0,
            transition: `opacity ${choicesExiting ? '0.5s cubic-bezier(0.55, 0, 1, 0.45)' : '0.6s ease-out'}`,
          }}
        >

          {(showChoices) && (
            <>
              <h1 className="text-white font-semibold text-[22px] leading-tight tracking-[-0.01em] mb-1 animate-fade-up" style={{ animationDelay: '0.05s' }}>{node.title}</h1>
              <p className="text-white/60 text-[14px] leading-relaxed mb-8 line-clamp-2 animate-fade-up" style={{ animationDelay: '0.1s' }}>{node.description}</p>
            </>
          )}

          {node.ending && showChoices ? (
            <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <div className="p-5 rounded-2xl bg-white/[0.10] backdrop-blur-md mb-4">
                <p className="text-white font-semibold text-[20px] mb-1">{node.endingTitle}</p>
                <p className="text-white/60 text-[16px] leading-relaxed">{node.endingDescription}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.08]">
                  {connection > 0 && (
                    <div className="flex items-center gap-1.5">
                      <HeartIcon size={20} />
                      <span className="text-white/70 text-[16px] font-medium">{Math.round(connectionPct)}%</span>
                    </div>
                  )}
                  {newEnding && <span className="text-pink-400 text-[16px] font-medium animate-fade-up">New ending!</span>}
                </div>
              </div>
              <button type="button" onClick={handleRestart}
                className="w-full h-[52px] rounded-2xl bg-white text-black font-semibold text-[16px] cursor-pointer transition-[opacity,transform,background-color] duration-200 active:scale-[0.97] flex items-center justify-center gap-2 mb-3">
                <Icon name="rotate-ccw" size={18} /> Play Again
              </button>
              <button type="button" onClick={() => navigate('/')}
                className="w-full h-[48px] rounded-2xl bg-white/[0.10]  text-white/70 font-medium text-[16px] cursor-pointer transition-[opacity,transform,background-color] duration-200 active:scale-[0.97] hover:bg-white/[0.1] flex items-center justify-center gap-2">
                <Icon name="home" size={18} /> Back to Home
              </button>
            </div>
          ) : showChoices ? (
            <div>
              <p className="text-white/50 text-[12px] font-medium tracking-widest uppercase mb-2 animate-fade-up" style={{ animationDelay: '0.15s' }}>
                {node.timed ? 'Decide quickly' : 'What do you do?'}
              </p>
              <Stack gap="sm">
                {node.choices.map((choice, i) => {
                  const isChosen = chosenIndex === i
                  const isOther = chosenIndex !== null && chosenIndex !== i
                  const pct = liveStats?.[i] ?? choice.communityPct ?? 50

                  return (
                    <button
                      key={choice.nextNodeId}
                      type="button"
                      onClick={() => chosenIndex === null && handleChoice(choice, i)}
                      disabled={chosenIndex !== null}
                      className={`animate-fade-up w-full px-4 py-5 rounded-2xl backdrop-blur-md cursor-pointer transition-[opacity,transform,background-color] duration-300 group flex items-center relative overflow-hidden ${
                        isChosen
                          ? 'bg-white/[0.25] ring-1 ring-white/30'
                          : isOther
                            ? 'bg-white/[0.05] opacity-50'
                            : hintActive && choice.positive
                              ? 'bg-[#a78bfa]/15 hover:bg-[#a78bfa]/25 active:scale-[0.97]'
                              : 'bg-white/[0.10] hover:bg-white/[0.15] active:scale-[0.97]'
                      }`}
                      style={{ animationDelay: `${200 + i * 100}ms` }}
                    >
                      {/* Percentage fill bar */}
                      <div
                        className="absolute top-0 left-0 bottom-0 rounded-2xl"
                        style={{
                          width: showPercentages ? `${pct}%` : '0%',
                          background: isChosen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, background-color 0.3s ease-out',
                        }}
                      />

                      {isChosen && (
                        <span className="relative w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 mr-2.5">
                          <Icon name="check" size={14} className="text-black" />
                        </span>
                      )}
                      <span className="relative text-white font-medium text-[16px] leading-snug flex-1 text-center">{choice.label}</span>

                      {/* Percentage — far right */}
                      <span
                        className={`relative text-[16px] font-semibold tabular-nums ml-2.5 shrink-0 ${isChosen ? 'text-white' : 'text-white/60'}`}
                        style={{
                          opacity: showPercentages ? 1 : 0,
                          transform: showPercentages ? 'translateX(0)' : 'translateX(8px)',
                          transition: 'opacity 0.4s ease-out 0.3s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
                        }}
                      >
                        {showPercentages ? `${pct}%` : ''}
                      </span>
                    </button>
                  )
                })}
              </Stack>

              {/* Perk action buttons */}
              <div className="flex items-stretch justify-center gap-2 mt-8 animate-fade-up" style={{ animationDelay: '0.45s' }}>
                  {[
                    node.timed && { type: 'freeze', icon: 'clock', color: '#38bdf8', label: 'Freeze', count: perks.freeze, active: freezeActive, handler: handleFreeze, disabled: freezeActive },
                    { type: 'hint', icon: 'sparkle', color: '#a78bfa', label: 'Hint', count: perks.hint, active: hintActive, handler: handleHint, disabled: hintActive },
                    history.length > 0 && { type: 'rewind', icon: 'rotate-ccw', color: '#34d399', label: 'Rewind', count: perks.rewind, active: false, handler: handleRewind, disabled: false },
                  ].filter(Boolean).map((p) => (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() => chosenIndex === null && (p.count > 0 ? p.handler() : setShowBuyPerks(true))}
                      disabled={p.disabled || chosenIndex !== null}
                      className="flex items-center justify-center gap-1.5 px-5 h-[52px] rounded-xl cursor-pointer transition-[opacity,transform,background-color] duration-200 active:scale-[0.96] disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: p.active ? `${p.color}25` : `${p.color}12` }}
                    >
                      <Icon name={p.active ? 'check' : p.icon} size={16} style={{ color: p.color }} />
                      <span className="text-[15px] font-medium" style={{ color: p.color }}>{p.active ? 'Active' : p.label}</span>
                      <span className="text-[15px] font-semibold tabular-nums" style={{ color: p.count > 0 ? p.color : 'rgba(255,255,255,0.3)' }}>
                        {p.count > 0 ? p.count : '0'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-8">
                  <div className="w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${progress}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.85))' }}
                    />
                  </div>
                </div>
            </div>
          ) : null}
        </div>
      </div>
        )
      })()}

      {/* Progress bar — always visible during playback */}
      {!showChoices && !showComplete && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-[max(env(safe-area-inset-bottom),12px)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full h-[3px] rounded-full bg-white/10 cursor-pointer overflow-hidden" onClick={handleSeek}>
            <div className="h-full rounded-full"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.85))' }}
            />
          </div>
        </div>
      )}

      <StoryComplete
        isOpen={showComplete}
        endingTitle={node.endingTitle || node.title}
        endingDescription={node.endingDescription || node.description}
        connectionPct={connectionPct}
        isNewEnding={newEnding}
        endingsFound={endingsFound.filter((e) => e.storyId === story.id).length}
        totalEndings={allEndings.length}
        onReplay={handleRestart}
        onHome={() => navigate('/')}
        onBuyNext={() => { /* TODO: payment flow */ }}
        onBuySeries={() => { /* TODO: payment flow */ }}
        storyTitle={story?.title}
      />
      <BuyHeartsModal
        isOpen={showBuyPerks}
        onClose={() => setShowBuyPerks(false)}
        onPurchase={() => {}}
        onPurchasePerks={(type, count) => purchasePerks(type, count)}
      />
    </main>
  )
}
