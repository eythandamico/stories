import Icon from '../lib/icon.jsx'

const PERK_CONFIG = {
  freeze: { icon: 'clock', label: 'Freeze Time', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
  hint: { icon: 'sparkle', label: 'Hint', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  rewind: { icon: 'rotate-ccw', label: 'Rewind', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
}

export function PerkIcon({ type, size = 20 }) {
  const config = PERK_CONFIG[type]
  if (!config) return null
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0"
      style={{ width: size + 8, height: size + 8, background: config.bg }}
    >
      <Icon name={config.icon} size={size} style={{ color: config.color }} />
    </div>
  )
}

export function PerkPill({ type, count, onClick }) {
  const config = PERK_CONFIG[type]
  if (!config) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 h-10 rounded-full bg-white/10 backdrop-blur-xl cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] hover:bg-white/15"
    >
      <Icon name={config.icon} size={18} style={{ color: config.color }} />
      <span className="text-white/80 text-[16px] font-semibold tabular-nums">{count}</span>
    </button>
  )
}

export { PERK_CONFIG }
