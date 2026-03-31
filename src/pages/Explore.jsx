import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { feed } from '../data/feed.js'
import Icon from '../lib/icon.jsx'

const categories = [
  { id: 'romance', label: 'Romance', emoji: '💕', stories: feed.filter(s => s.genre === 'Romance') },
  { id: 'thriller', label: 'Thriller', emoji: '🔪', stories: feed.filter(s => s.genre === 'Thriller') },
  { id: 'sci-fi', label: 'Sci-Fi', emoji: '🚀', stories: feed.filter(s => s.genre === 'Sci-Fi') },
  { id: 'horror', label: 'Horror', emoji: '👻', stories: feed.filter(s => s.genre === 'Horror') },
  { id: 'drama', label: 'Drama', emoji: '🎭', stories: feed.filter(s => s.genre === 'Drama') },
  { id: 'fantasy', label: 'Fantasy', emoji: '⚔️', stories: feed.filter(s => s.genre === 'Fantasy') },
]

export default function Explore() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const videoRefs = useRef({})

  const filteredCategories = search
    ? categories.map(cat => ({
        ...cat,
        stories: cat.stories.filter(s =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.stories.length > 0)
    : categories.filter(cat => cat.stories.length > 0)

  const handleMouseEnter = (key) => {
    videoRefs.current[key]?.play().catch(() => {})
  }
  const handleMouseLeave = (key) => {
    const v = videoRefs.current[key]
    if (v) { v.pause(); v.currentTime = 0 }
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--inv-bg)] pb-28 animate-page-enter">
      {/* Search bar */}
      <div className="px-6 pt-14 mb-6 animate-fade-down">
        <div className="relative">
          <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--inv-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories..."
            className="w-full h-[44px] pl-10 pr-4 rounded-2xl bg-[var(--inv-surface)] border border-[var(--inv-border)] text-[16px] text-[var(--inv-heading)] placeholder-[var(--inv-muted)] outline-none transition-all duration-200 focus:border-[var(--inv-accent)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--inv-bg-alt)] flex items-center justify-center cursor-pointer"
            >
              <Icon name="close" size={12} className="text-[var(--inv-muted)]" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      {filteredCategories.length === 0 ? (
        <div className="py-16 text-center animate-fade-up">
          <Icon name="search" size={32} className="text-[var(--inv-muted)] mx-auto mb-3" />
          <p className="inv-heading mb-1">No stories found</p>
          <p className="inv-body-sm text-[var(--inv-muted)]">Try a different search</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {filteredCategories.map((cat, catIdx) => (
            <div
              key={cat.id}
              className="animate-fade-up"
              style={{ animationDelay: `${0.05 + catIdx * 0.06}s` }}
            >
              {/* Category header */}
              <div className="flex items-center justify-between px-6 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{cat.emoji}</span>
                  <h2 className="text-[18px] font-semibold text-[var(--inv-heading)]">{cat.label}</h2>
                </div>
                <span className="text-[14px] text-[var(--inv-muted)]">{cat.stories.length} stories</span>
              </div>

              {/* Horizontal scroll of cards */}
              <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-6">
                {cat.stories.map((item, i) => {
                  const key = `${cat.id}-${i}`
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.route ? navigate(item.route) : null}
                      className="shrink-0 text-left cursor-pointer group"
                      style={{ width: 160 }}
                      onMouseEnter={() => handleMouseEnter(key)}
                      onMouseLeave={() => handleMouseLeave(key)}
                    >
                      {/* Card */}
                      <div className="relative mb-0 rounded-[20px] overflow-hidden aspect-[3/4] bg-[var(--inv-bg-alt)] transition-transform duration-300 group-hover:scale-[1.03] group-active:scale-[0.97]">
                        {/* Video */}
                        <video
                          ref={(el) => { videoRefs.current[key] = el }}
                          src={item.preview}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        />

                        {/* Bottom gradient */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.75))' }}
                        />

                        {/* Title on card */}
                        <div className="absolute bottom-0 left-0 right-0 p-3.5">
                          <p className="text-white font-semibold text-[16px] leading-snug line-clamp-2">
                            {item.title}
                          </p>
                          <p className="text-white/40 text-[12px] mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        </div>

                        {/* Locked overlay */}
                        {!item.route && (
                          <div className="absolute top-3 right-3">
                            <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                              <Icon name="lock" size={12} className="text-white/60" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
