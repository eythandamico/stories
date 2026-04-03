import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameState } from '../lib/use-game-state.js'
import Icon from '../lib/icon.jsx'
import { FlameIcon } from '../components/flame-icon.jsx'
import { HeartIcon } from '../components/heart-icon.jsx'

const MILESTONES = [
  { days: 3, reward: 1, label: '3 Days' },
  { days: 7, reward: 3, label: '1 Week' },
  { days: 14, reward: 5, label: '2 Weeks' },
  { days: 30, reward: 10, label: '1 Month' },
  { days: 60, reward: 20, label: '2 Months' },
  { days: 100, reward: 50, label: '100 Days' },
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

export default function Streaks() {
  const navigate = useNavigate()
  const { streak, purchaseHearts } = useGameState()
  const [claimed, setClaimed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('narrative-streak-claimed') || '[]') }
    catch { return [] }
  })

  const days = getRecentDays(streak.lastPlayDate, streak.current)

  const handleClaim = (milestone) => {
    const newClaimed = [...claimed, milestone.days]
    setClaimed(newClaimed)
    localStorage.setItem('narrative-streak-claimed', JSON.stringify(newClaimed))
    purchaseHearts(milestone.reward)
  }

  const nextMilestone = MILESTONES.find(m => streak.current < m.days)
  const daysUntilNext = nextMilestone ? nextMilestone.days - streak.current : 0

  return (
    <main className="min-h-[100dvh] bg-[var(--inv-bg)] pb-28 animate-page-enter">
      {/* Header */}
      <div className="px-5 pt-[calc(env(safe-area-inset-top,20px)+20px)] pb-2">
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-[var(--inv-nav-hover-bg)] active:scale-[0.96]"
            aria-label="Go back"
          >
            <Icon name="arrow-left" size={20} className="text-[var(--inv-heading)]" />
          </button>
          <h1 className="inv-title flex-1">Streaks</h1>
        </div>
      </div>

      <div className="px-6">
        {/* Hero */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <FlameIcon size={64} />
          </div>
          <h2 className="text-[40px] font-semibold text-[var(--inv-heading)] tabular-nums leading-none mb-1">
            {streak.current}
          </h2>
          <p className="text-[18px] text-[var(--inv-muted)]">
            {streak.current === 1 ? 'day streak' : 'day streak'}
          </p>
          {streak.best > 0 && (
            <p className="text-[14px] text-[var(--inv-muted)] mt-1">
              Personal best: {streak.best} days
            </p>
          )}
        </div>

        {/* Week calendar */}
        <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <p className="text-[14px] font-medium text-[var(--inv-muted)] tracking-widest uppercase mb-3">This Week</p>
          <div className="flex justify-between mb-8 bg-[var(--inv-surface)] rounded-2xl p-4">
            {days.map((day) => (
              <div key={day.dateStr} className="flex flex-col items-center gap-2">
                <span className="text-[13px] text-[var(--inv-muted)] font-medium">{day.dayLabel}</span>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-[16px] font-semibold transition-all duration-300 ${
                    day.played
                      ? 'bg-orange-400 text-black'
                      : day.isToday
                        ? 'bg-[var(--inv-bg)] text-[var(--inv-heading)] border-2 border-dashed border-orange-400/40'
                        : 'bg-[var(--inv-bg)] text-[var(--inv-muted)]'
                  }`}
                >
                  {day.played ? <Icon name="check" size={18} /> : day.dayNum}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next milestone */}
        {nextMilestone && (
          <div className="animate-fade-up mb-6" style={{ animationDelay: '0.1s' }}>
            <div className="p-4 rounded-2xl bg-orange-500/8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[16px] font-semibold text-[var(--inv-heading)]">Next: {nextMilestone.label}</p>
                <div className="flex items-center gap-1">
                  <HeartIcon size={16} />
                  <span className="text-[14px] font-medium text-pink-400">+{nextMilestone.reward}</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--inv-bg)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-400 transition-[width] duration-700"
                  style={{ width: `${Math.min((streak.current / nextMilestone.days) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[13px] text-[var(--inv-muted)] mt-1.5">
                {daysUntilNext} {daysUntilNext === 1 ? 'day' : 'days'} to go
              </p>
            </div>
          </div>
        )}

        {/* Milestones */}
        <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <p className="text-[14px] font-medium text-[var(--inv-muted)] tracking-widest uppercase mb-3">Rewards</p>
          <div className="flex flex-col gap-2.5">
            {MILESTONES.map((m) => {
              const reached = streak.current >= m.days || streak.best >= m.days
              const isClaimed = claimed.includes(m.days)
              const canClaim = reached && !isClaimed

              return (
                <div
                  key={m.days}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 ${
                    reached ? 'bg-[var(--inv-surface)]' : 'bg-[var(--inv-surface)] opacity-40'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    reached ? 'bg-orange-400/15' : 'bg-[var(--inv-bg-alt)]'
                  }`}>
                    {reached ? (
                      <FlameIcon size={24} />
                    ) : (
                      <Icon name="lock" size={16} className="text-[var(--inv-muted)]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-semibold text-[var(--inv-heading)]">{m.label}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <HeartIcon size={14} />
                      <span className="text-[14px] text-[var(--inv-muted)]">+{m.reward} hearts</span>
                    </div>
                  </div>
                  {canClaim && (
                    <button
                      type="button"
                      onClick={() => handleClaim(m)}
                      className="px-4 py-2 rounded-xl bg-orange-400 text-black text-[14px] font-semibold cursor-pointer transition-all duration-200 active:scale-[0.95]"
                    >
                      Claim
                    </button>
                  )}
                  {isClaimed && (
                    <span className="text-[14px] text-orange-400 font-medium">Claimed</span>
                  )}
                  {!reached && !isClaimed && (
                    <span className="text-[14px] text-[var(--inv-muted)]">{m.days - streak.current}d left</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
