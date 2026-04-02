import { useState, useEffect } from 'react'
import { HeartIcon } from './heart-icon.jsx'

export function NoHeartsModal({ isOpen, onClose, nextHeartTime, onBuy }) {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    if (!isOpen || !nextHeartTime) return
    const tick = () => {
      const diff = Math.max(0, nextHeartTime - Date.now())
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setCountdown(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isOpen, nextHeartTime])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative max-w-sm w-full rounded-2xl bg-[var(--inv-surface)] p-8 text-center animate-scale-in"
        style={{ boxShadow: 'var(--inv-shadow)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-5">
          <HeartIcon size={52} />
        </div>
        <h2 className="text-[24px] font-semibold text-[var(--inv-heading)] mb-2">Out of Hearts</h2>
        <p className="text-[16px] text-[var(--inv-muted)] mb-5">
          Hearts regenerate over time, or get more now!
        </p>
        {nextHeartTime && (
          <div className="mb-5">
            <p className="text-[16px] text-[var(--inv-muted)] mb-1">Next heart in</p>
            <p className="text-[32px] font-semibold text-[var(--inv-heading)] tabular-nums">{countdown}</p>
          </div>
        )}
        <button
          type="button"
          onClick={onBuy}
          className="w-full h-[48px] rounded-2xl bg-pink-500 text-white font-semibold text-[16px] cursor-pointer transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 mb-3"
        >
          <HeartIcon size={22} /> Get Hearts
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-[44px] rounded-2xl bg-transparent text-[var(--inv-muted)] font-medium text-[16px] cursor-pointer transition-all duration-200 active:scale-[0.97]"
        >
          Wait for free hearts
        </button>
      </div>
    </div>
  )
}
