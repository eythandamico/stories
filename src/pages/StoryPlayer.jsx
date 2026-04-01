import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { story } from '../data/story.js'
import { useGameState } from '../lib/use-game-state.js'
import { StoryComplete } from '../components/story-complete.jsx'
import { Stack } from '../components/stack.jsx'
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../lib/haptics.js'
import { soundClick, soundPositive, soundNeutral, soundConnection, soundTick, soundTimerWarn, soundTimerExpired, soundEndingDiscovered, startHeartbeat, stopHeartbeat } from '../lib/sounds.js'
import Icon from '../lib/icon.jsx'
import { HeartIcon } from '../components/heart-icon.jsx'
import { posterUrl } from '../lib/config.js'
import { BuyHeartsModal } from '../components/buy-hearts-modal.jsx'

const MAX_CONNECTION = 5
const allEndings = Object.values(story.nodes).filter((n) => n.ending)

export default function StoryPlayer() {
  const navigate = useNavigate()
  const { addEnding, endingsFound, hearts, spendHeart, perks, usePerk, purchasePerks } = useGameState()
  const videoRef = useRef(null)
  const [newEnding, setNewEnding] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [hintActive, setHintActive] = useState(false)
  const [freezeActive, setFreezeActive] = useState(false)
  const [showBuyPerks, setShowBuyPerks] = useState(false)
  const [perkFlash, setPerkFlash] = useState(null)
  const [choicesExiting, setChoicesExiting] = useState(false)
  const [showConnectionBurst, setShowConnectionBurst] = useState(false)
  const [burstParams, setBurstParams] = useState({
    size: 300,
    blur: 8,
    opacity: 0.35,
    heartSize: 90,
    textSize: 40,
    top: 25,
  })
  const [currentNodeId, setCurrentNodeId] = useState(story.startNodeId)
  const [showChoices, setShowChoices] = useState(false)
  const [chosenIndex, setChosenIndex] = useState(null)
  const [showPercentages, setShowPercentages] = useState(false)
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

  const node = story.nodes[currentNodeId]

  // Reset state on node change
  useEffect(() => {
    setProgress(0)
    setIsPlaying(false)
    setShowControls(true)
    setChosenIndex(null)
    setShowPercentages(false)
    setTimerActive(false)
    setTimerExtended(false)
    setHintActive(false)
    setFreezeActive(false)
    stopHeartbeat()
    if (videoRef.current) {
      videoRef.current.muted = false
      videoRef.current.loop = false
    }
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

  const handleVideoEnd = useCallback(() => {
    setShowChoices(true)
    setShowControls(true)
    if (videoRef.current) {
      videoRef.current.muted = true
      videoRef.current.loop = true
      videoRef.current.play().catch(() => {})
    }

    const currentNode = story.nodes[currentNodeId]

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
        // DEV: burst stays on — remove this comment and uncomment below to re-enable timeout
        // setTimeout(() => setShowConnectionBurst(false), 1500)
      } else {
        soundNeutral()
      }
    }, 200)

    // Fade out, then transition
    setTimeout(() => {
      setChoicesExiting(true)
    }, 2500)
    setTimeout(() => {
      setHistory((prev) => [...prev, currentNodeId])
      setShowChoices(false)
      setChoicesExiting(false)
      setCurrentNodeId(choice.nextNodeId)
    }, 3100)
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

  if (!node) return null

  const currentScene = history.length + 1
  const connectionPct = (connection / MAX_CONNECTION) * 100
  const timerPct = timerTotal > 0 ? (timeLeft / timerTotal) * 100 : 100

  return (
    <main
      className="fixed inset-0 bg-black flex items-center justify-center"
      onClick={() => { setShowControls(true); togglePlay() }}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay() } }}
      tabIndex={0}
      aria-label={`Playing: ${node.title}`}
    >
      <div className="absolute inset-0 video-shimmer" aria-hidden="true" />

      <video
        ref={videoRef}
        key={currentNodeId}
        src={node.video}
        poster={posterUrl(node.video)}
        aria-label={node.title}
        className="w-full h-full object-cover animate-crossfade"
        onEnded={handleVideoEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay
        playsInline
        preload="auto"
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)' }}
        aria-hidden="true"
      />

      {/* Connection burst — upper area with radial glow */}
      {showConnectionBurst && (
        <div className="fixed inset-0 z-[45] pointer-events-none">
          {/* Pink-orange radial glow rays */}
          <div
            style={{
              position: 'absolute',
              top: `${burstParams.top}%`, left: '50%', transform: 'translate(-50%, -50%)',
              width: burstParams.size, height: burstParams.size,
              background: `conic-gradient(from 0deg, rgba(236,72,153,${burstParams.opacity}), rgba(249,115,22,${burstParams.opacity * 0.7}), transparent 12%, transparent 18%, rgba(244,114,182,${burstParams.opacity * 0.85}), rgba(251,146,60,${burstParams.opacity * 0.6}), transparent 30%, transparent 36%, rgba(236,72,153,${burstParams.opacity}), rgba(249,115,22,${burstParams.opacity * 0.7}), transparent 48%, transparent 54%, rgba(244,114,182,${burstParams.opacity * 0.7}), transparent 66%, transparent 72%, rgba(236,72,153,${burstParams.opacity * 0.85}), transparent 84%, transparent 90%, rgba(249,115,22,${burstParams.opacity * 0.6}), transparent)`,
              filter: `blur(${burstParams.blur}px)`,
              mixBlendMode: 'screen',
              borderRadius: '50%',
            }}
          />
          {/* Heart + number */}
          <div style={{ position: 'absolute', top: `${burstParams.top}%`, left: 0, right: 0, transform: 'translateY(-50%)' }} className="flex flex-col items-center">
            <HeartIcon size={burstParams.heartSize} className="mb-3" />
            <span className="text-white font-semibold" style={{ fontSize: burstParams.textSize, textShadow: '0 0 40px rgba(236,72,153,0.6), 0 0 80px rgba(249,115,22,0.3)' }}>+{connection * 5}</span>
          </div>
        </div>
      )}

      {/* DEV: burst controls */}
      <div className="fixed bottom-20 right-3 z-[60] flex flex-col gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => setShowConnectionBurst(prev => !prev)}
          className="w-10 h-10 rounded-full bg-pink-500/30 backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-90"
        >
          <HeartIcon size={20} />
        </button>
        {showConnectionBurst && (
          <div className="bg-black/80 backdrop-blur-md rounded-xl p-3 text-[12px] text-white/70 w-48" onClick={e => e.stopPropagation()}>
            {[
              { label: 'Size', key: 'size', min: 100, max: 800, step: 20 },
              { label: 'Blur', key: 'blur', min: 0, max: 40, step: 2 },
              { label: 'Opacity', key: 'opacity', min: 0.05, max: 1, step: 0.05 },
              { label: 'Heart', key: 'heartSize', min: 40, max: 150, step: 5 },
              { label: 'Text', key: 'textSize', min: 20, max: 60, step: 2 },
              { label: 'Top %', key: 'top', min: 10, max: 50, step: 1 },
            ].map(({ label, key, min, max, step }) => (
              <div key={key} className="flex items-center gap-2 mb-1.5">
                <span className="w-12 shrink-0">{label}</span>
                <input
                  type="range" min={min} max={max} step={step}
                  value={burstParams[key]}
                  onChange={e => setBurstParams(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
                  className="flex-1 h-1 accent-pink-400"
                />
                <span className="w-8 text-right tabular-nums">{burstParams[key]}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const json = JSON.stringify(burstParams)
                navigator.clipboard?.writeText(json)
                alert(json)
              }}
              className="w-full mt-2 py-1.5 rounded-lg bg-pink-500/20 text-pink-400 text-[12px] font-medium cursor-pointer active:scale-95"
            >
              Copy Params
            </button>
          </div>
        )}
      </div>

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

      {/* Connection bar blur + glow */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 z-[19] pointer-events-none transition-opacity duration-700"
        style={{
          opacity: showConnectionBar ? 1 : 0, width: 140, height: 260,
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          maskImage: 'radial-gradient(ellipse at center right, black 15%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center right, black 15%, transparent 65%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 z-[19] pointer-events-none transition-opacity duration-700"
        style={{
          opacity: showConnectionBar ? 1 : 0, width: 140, height: 260,
          background: connectionPct >= 80
            ? 'radial-gradient(ellipse at center right, rgba(236,72,153,0.2), transparent 65%)'
            : connectionPct >= 40
              ? 'radial-gradient(ellipse at center right, rgba(244,114,182,0.15), transparent 65%)'
              : 'radial-gradient(ellipse at center right, rgba(0,0,0,0.3), transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* Connection bar */}
      <div
        className="absolute right-5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3 pointer-events-none transition-[opacity,transform,color] duration-700 ease-out"
        style={{
          opacity: showConnectionBar ? 1 : 0,
          transform: showConnectionBar ? 'translateX(0) translateY(-50%)' : 'translateX(16px) translateY(-50%)',
        }}
        aria-hidden="true"
      >
        <span className="text-[16px] font-semibold animate-count-up" key={connection}
          style={{ color: connectionPct >= 80 ? '#ec4899' : connectionPct >= 40 ? '#f472b6' : 'rgba(255,255,255,0.7)' }}
        >+{connection}</span>
        <div className="relative w-3 h-36 rounded-full bg-white/20 overflow-hidden backdrop-blur-xl">
          <div className="absolute bottom-0 left-0 right-0 rounded-full transition-[height,background-color] duration-1000 ease-out"
            style={{
              height: `${connectionPct}%`,
              background: connectionPct >= 80 ? 'linear-gradient(to top, #f472b6, #ec4899)' : connectionPct >= 40 ? 'linear-gradient(to top, #fb923c, #f472b6)' : 'linear-gradient(to top, rgba(255,255,255,0.4), rgba(255,255,255,0.7))',
              ...(connectionPct >= 100 ? { animation: 'bar-pulse 2s ease-in-out infinite' } : {}),
            }}
          />
        </div>
        <HeartIcon size={24} />
      </div>

      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 px-5 pt-[calc(env(safe-area-inset-top,20px)+20px)] pb-6 flex items-center justify-between transition-[opacity,transform] duration-500 ${
          showComplete ? 'opacity-0 pointer-events-none' : (showControls || showChoices) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'linear-gradient(rgba(0,0,0,0.4), transparent)' }}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white/[0.14] backdrop-blur-md flex items-center justify-center cursor-pointer transition-[opacity,transform,background-color] duration-200 active:scale-[0.96] hover:bg-white/15"
          aria-label="Close"
        >
          <Icon name="close" size={18} className="text-white/80" />
        </button>

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

      {/* Play button */}
      {!isPlaying && !showChoices && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none animate-scale-in">
          <div className="rounded-full bg-white/12 backdrop-blur-md  flex items-center justify-center" style={{ width: 72, height: 72 }}>
            <Icon name="play" size={28} className="text-white ml-1" />
          </div>
        </div>
      )}

      {/* Bottom content */}
      <div
        className={`fixed inset-0 z-10 flex flex-col justify-end transition-opacity duration-500 ease-out ${
          showComplete ? 'opacity-0 pointer-events-none' : (showChoices && !choicesExiting) ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', maskImage: 'linear-gradient(to top, black 40%, transparent 80%)', WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 80%)' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(transparent 20%, rgba(0,0,0,0.8))' }}
          aria-hidden="true"
        />

        <div className="relative px-5 pb-[max(env(safe-area-inset-bottom),16px)] text-center">

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
                      {/* Percentage fill bar (always rendered, animates from 0) */}
                      <div
                        className="absolute top-0 left-0 bottom-0 rounded-2xl"
                        style={{
                          width: showPercentages ? `${choice.communityPct}%` : '0%',
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
                        {showPercentages ? `${choice.communityPct}%` : ''}
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

                {/* Progress bar below perks */}
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
