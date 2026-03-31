import { useRef, useState, useEffect } from 'react'
import Icon from '../lib/icon.jsx'

export function VideoPlayer({ src, onEnded, autoPlay = true }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const hideTimer = useRef(null)

  useEffect(() => {
    setProgress(0)
    setIsPlaying(false)
    setShowControls(true)
  }, [src])

  useEffect(() => {
    if (showControls && isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000)
    }
    return () => clearTimeout(hideTimer.current)
  }, [showControls, isPlaying])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100
    setProgress(pct)
  }

  const handleSeek = (e) => {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pct * videoRef.current.duration
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setShowControls(true)
    onEnded?.()
  }

  return (
    <div
      className="relative w-full bg-[var(--inv-bg-alt)] rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => { setShowControls(true); togglePlay() }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-auto block"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay={autoPlay}
        playsInline
        preload="auto"
      />

      {/* Play/Pause overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(transparent 60%, rgba(0,0,0,0.6))' }}
      >
        {!isPlaying && (
          <div className="w-16 h-16 rounded-full bg-[var(--inv-surface)]/80 backdrop-blur-sm flex items-center justify-center" style={{ boxShadow: 'var(--inv-shadow)' }}>
            <Icon name="play" size={24} className="text-[var(--inv-heading)] ml-1" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-4 pb-3 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full h-1.5 rounded-full bg-[var(--inv-surface)]/30 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full bg-[var(--inv-surface)] transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* No video fallback */}
      {!src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Icon name="play" size={24} className="text-[var(--inv-muted)] mx-auto mb-2" />
            <span className="inv-body-sm text-[var(--inv-muted)]">No video loaded</span>
          </div>
        </div>
      )}
    </div>
  )
}
