import { useState, useEffect, useRef, useCallback } from 'react'
import Icon from '../lib/icon.jsx'
import { hapticLight } from '../lib/haptics.js'

export function BottomNav({ tabs = [], activeTab, onTabChange }) {
  const barRef = useRef(null)
  const activeIndicatorRef = useRef(null)
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const getTabOffset = useCallback((idx) => idx * 48, [])

  useEffect(() => {
    const el = activeIndicatorRef.current
    if (!el) return
    const idx = tabs.findIndex(t => t.id === activeTab)
    if (idx < 0) return
    el.style.transform = `translateX(${getTabOffset(idx)}px)`
    el.style.opacity = '1'
  }, [activeTab, tabs, getTabOffset])

  return (
    <>
      {/* Progressive blur backdrop */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 h-32 pointer-events-none"
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          maskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      <nav
        ref={barRef}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--inv-surface)]/60 backdrop-blur-3xl rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
        aria-label="Navigation"
      >
        <div className="flex items-center px-1 py-1">
          <div
            className="relative flex items-center"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Active pill indicator */}
            <div
              ref={activeIndicatorRef}
              className="absolute top-0 left-0 w-[48px] h-[44px] rounded-[14px] bg-white/[0.12] pointer-events-none"
              style={{ transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s', opacity: 0 }}
              aria-hidden="true"
            />

            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { hapticLight(); onTabChange?.(tab.id) }}
                  onMouseEnter={() => setHoveredIdx(isActive ? null : idx)}
                  className={`relative z-10 flex items-center justify-center w-[48px] h-[44px] rounded-[14px] cursor-pointer transition-[color,transform] duration-200 ease-out active:scale-[0.96] ${
                    isActive
                      ? 'text-white'
                      : `text-white/40 hover:text-white/70 ${hoveredIdx === idx ? 'bg-white/[0.06]' : ''}`
                  }`}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon name={tab.icon} size={21} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
