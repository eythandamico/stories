import { useEffect, useRef, useState } from 'react'

export function Progress({ value = 0, max = 100, label, showValue = false, size = 'default', animated = true, className = '' }) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const fromRef = useRef(0)
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0

  useEffect(() => {
    if (!animated || !showValue) { setDisplayValue(value); return }
    fromRef.current = displayValue
    startRef.current = null
    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / 600, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(fromRef.current + (value - fromRef.current) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, animated, showValue])

  const heights = { small: 'h-1', default: 'h-2', large: 'h-3' }
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-[13px] font-medium text-[var(--inv-heading)]">{label}</span>}
          {showValue && <span className="text-[13px] font-medium text-[var(--inv-muted)] tabular-nums">{displayValue}%</span>}
        </div>
      )}
      <div className={`w-full ${heights[size] || heights.default} rounded-full bg-[var(--inv-bg-alt)] overflow-hidden`}>
        <div className="h-full rounded-full relative overflow-hidden" style={{ width: `${pct}%`, backgroundColor: 'var(--inv-heading)', transition: animated ? 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none' }}>
          {animated && pct > 0 && pct < 100 && (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'inv-progress-shimmer 2s ease-in-out infinite' }} />
          )}
        </div>
      </div>
      <style>{`@keyframes inv-progress-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  )
}
