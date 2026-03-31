import { useState, useEffect } from 'react'
import Icon from '../lib/icon.jsx'
import { FlameIcon } from './flame-icon.jsx'

const MILESTONES = [
  { days: 3, reward: 1, label: '3 Days' },
  { days: 7, reward: 3, label: '1 Week' },
  { days: 14, reward: 5, label: '2 Weeks' },
  { days: 30, reward: 10, label: '1 Month' },
]

function getRecentDays(lastPlayDate, currentStreak) {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' })
    const dayNum = d.getDate()

    // Determine if this day was a play day
    let played = false
    if (lastPlayDate && currentStreak > 0) {
      const lastDate = new Date(lastPlayDate)
      lastDate.setHours(0, 0, 0, 0)
      const streakStart = new Date(lastDate)
      streakStart.setDate(streakStart.getDate() - (currentStreak - 1))
      played = d >= streakStart && d <= lastDate
    }

    const isToday = i === 0
    days.push({ dateStr, dayLabel, dayNum, played, isToday })
  }
  return days
}

export function StreakModal({ isOpen, onClose, streak, onClaimReward }) {
  const [claimed, setClaimed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('narrative-streak-claimed') || '[]')
    } catch { return [] }
  })

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const days = getRecentDays(streak.lastPlayDate, streak.current)

  const handleClaim = (milestone) => {
    const newClaimed = [...claimed, milestone.days]
    setClaimed(newClaimed)
    localStorage.setItem('narrative-streak-claimed', JSON.stringify(newClaimed))
    onClaimReward?.(milestone.reward)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative max-w-sm w-full rounded-2xl bg-[var(--inv-surface)] p-6 animate-scale-in"
        style={{ boxShadow: 'var(--inv-shadow)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
            <FlameIcon size={44} />
          </div>
          <h2 className="text-[22px] font-semibold text-[var(--inv-heading)]">
            {streak.current > 0 ? `${streak.current} Day Streak!` : 'Start a Streak'}
          </h2>
          <p className="text-[16px] text-[var(--inv-muted)] mt-1">
            {streak.current > 0
              ? `Best: ${streak.best} days`
              : 'Play a story every day to build your streak'
            }
          </p>
        </div>

        {/* Week calendar */}
        <div className="flex justify-between mb-6 px-1">
          {days.map((day) => (
            <div key={day.dateStr} className="flex flex-col items-center gap-1.5">
              <span className="text-[12px] text-[var(--inv-muted)] font-medium">{day.dayLabel}</span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-[16px] font-semibold transition-all duration-300 ${
                  day.played
                    ? 'bg-orange-400 text-black'
                    : day.isToday
                      ? 'bg-[var(--inv-bg-alt)] text-[var(--inv-heading)] border-2 border-dashed border-[var(--inv-border)]'
                      : 'bg-[var(--inv-bg-alt)] text-[var(--inv-muted)]'
                }`}
              >
                {day.played ? (
                  <Icon name="check" size={16} />
                ) : (
                  day.dayNum
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <p className="inv-overline mb-3">Rewards</p>
        <div className="flex flex-col gap-2 mb-5">
          {MILESTONES.map((m) => {
            const reached = streak.current >= m.days || streak.best >= m.days
            const isClaimed = claimed.includes(m.days)
            const canClaim = reached && !isClaimed

            return (
              <div
                key={m.days}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  reached ? 'bg-orange-400/8' : 'bg-[var(--inv-bg-alt)] opacity-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  reached ? 'bg-orange-400/15' : 'bg-[var(--inv-surface)]'
                }`}>
                  <Icon
                    name={reached ? 'check' : 'lock'}
                    size={16}
                    className={reached ? 'text-orange-400' : 'text-[var(--inv-muted)]'}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-medium text-[var(--inv-heading)]">{m.label}</p>
                  <p className="text-[14px] text-[var(--inv-muted)]">+{m.reward} hearts</p>
                </div>
                {canClaim && (
                  <button
                    type="button"
                    onClick={() => handleClaim(m)}
                    className="px-3 py-1.5 rounded-xl bg-orange-400 text-black text-[14px] font-semibold cursor-pointer transition-all duration-200 active:scale-95"
                  >
                    Claim
                  </button>
                )}
                {isClaimed && (
                  <span className="text-[14px] text-orange-400 font-medium">Claimed</span>
                )}
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-[44px] rounded-2xl bg-[var(--inv-heading)] text-[var(--inv-bg)] font-medium text-[16px] cursor-pointer transition-all duration-200 active:scale-[0.97]"
        >
          Close
        </button>
      </div>
    </div>
  )
}
