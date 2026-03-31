import { useState } from 'react'
import Icon from '../lib/icon.jsx'
import { slideStyle, menuShadow } from '../lib/popover.js'
import { useClickOutside } from '../lib/use-click-outside.js'

const POSITION_CLASSES = {
  'bottom-left': 'top-full left-0 mt-2',
  'bottom-center': 'top-full left-1/2 -translate-x-1/2 mt-2',
  'bottom-right': 'top-full right-0 mt-2',
  'top-left': 'bottom-full left-0 mb-2',
  'top-center': 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  'top-right': 'bottom-full right-0 mb-2',
}

export function ProfileMenu({ avatarUrl, profile, profileItems = [], placement = 'top-center', size = 36, rounded = 'xl' }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useClickOutside(menuOpen, () => setMenuOpen(false))

  if (!avatarUrl) return null

  const posClass = POSITION_CLASSES[placement] || POSITION_CLASSES['top-center']

  return (
    <div className="relative flex-shrink-0" onMouseDown={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setMenuOpen(prev => !prev)}
        className={`relative cursor-pointer transition-[scale,opacity] duration-150 ease-out active:scale-[0.96] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--inv-accent)] focus-visible:ring-offset-1 ${rounded === 'full' ? 'rounded-full' : 'rounded-xl'}`}
        style={{ width: size, height: size }}
        aria-label="Profile menu"
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <img src={avatarUrl} alt="" className={`w-full h-full object-cover ${rounded === 'full' ? 'rounded-full' : 'rounded-xl'}`} />
        <span className={`absolute inset-0 pointer-events-none ${rounded === 'full' ? 'rounded-full' : 'rounded-xl'}`} style={{ boxShadow: 'inset 0 0 0 1px var(--inv-outline)' }} />
      </button>

      <div
        className={`absolute z-10 ${posClass}`}
        style={slideStyle(menuOpen, placement)}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="rounded-[20px] bg-[var(--inv-menu-bg)]/90 backdrop-blur-xl py-2 px-2 w-56" role="menu" style={menuShadow}>
          {profile && (
            <>
              <div className="px-2 py-1.5">
                <div className="text-[15px] font-semibold text-[var(--inv-menu-text-active)] truncate">{profile.name}</div>
                <div className="text-[13px] text-[var(--inv-menu-text)] truncate">{profile.email}</div>
              </div>
              <div className="border-t border-[var(--inv-menu-divider)] mx-2.5 my-1" aria-hidden="true" />
            </>
          )}
          {profileItems.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={() => { setMenuOpen(false); item.onAction?.() }}
              className={`w-full text-left px-2 py-1.5 text-[15px] hover:bg-[var(--inv-menu-hover-bg)] rounded-xl transition-[color,background-color,scale] duration-150 ease-out cursor-pointer flex items-center gap-2.5 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[var(--inv-accent)] focus-visible:ring-offset-1 ${
                item.danger ? 'text-red-400 hover:text-red-300' : 'text-[var(--inv-menu-text-active)] hover:text-[var(--inv-menu-text-active)]'
              }`}
            >
              <Icon name={item.icon} size={18} className={item.danger ? 'text-red-400' : 'text-[var(--inv-menu-text)]'} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
