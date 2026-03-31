import { useState } from 'react'
import { popoverStyle } from '../lib/popover.js'

export function ProfileAvatar({ name, avatarUrl, size = 40, rounded = 'xl', alert = false, grouped = false, onClick }) {
  const [hovered, setHovered] = useState(false)
  const radiusClass = rounded === 'full' ? 'rounded-full' : 'rounded-xl'

  if (!avatarUrl) return null

  return (
    <div className="relative inline-flex" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        type="button"
        onClick={onClick}
        className={`relative ${radiusClass} cursor-pointer transition-[scale] duration-200 ease-out active:scale-[0.96] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--inv-accent)] focus-visible:ring-offset-2`}
        aria-label={name}
        style={{ width: size, height: size, boxShadow: grouped ? 'none' : 'var(--inv-shadow)', outline: grouped ? '3px solid var(--inv-bg)' : 'none' }}
      >
        <img src={avatarUrl} alt="" className={`w-full h-full ${radiusClass} object-cover`} />
        <span className={`absolute inset-0 ${radiusClass} pointer-events-none`} style={{ boxShadow: 'inset 0 0 0 1px var(--inv-outline)' }} />
        {alert && (
          <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-3 h-3 rounded-full bg-red-500 ring-2 ring-[var(--inv-bg)]" />
        )}
      </button>
      {name && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 rounded-xl bg-[var(--inv-nav)] text-[var(--inv-nav-text-active)] text-[15px] font-medium whitespace-nowrap pointer-events-none"
          style={{ ...popoverStyle(hovered, 'bottom center'), boxShadow: 'var(--inv-shadow)' }}
        >
          {name}
        </div>
      )}
    </div>
  )
}
