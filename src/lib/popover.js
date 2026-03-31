const SPRING = 'cubic-bezier(0.34, 1.3, 0.64, 1)'
const EASE_OUT = 'cubic-bezier(0.4, 0, 1, 1)'

const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

const reduced = (isOpen) => ({
  opacity: isOpen ? 1 : 0,
  pointerEvents: isOpen ? 'auto' : 'none',
})

export function popoverStyle(isOpen, origin) {
  if (prefersReducedMotion) return reduced(isOpen)
  return {
    transformOrigin: origin,
    scale: isOpen ? '1' : '0.85',
    opacity: isOpen ? 1 : 0,
    filter: isOpen ? 'blur(0px)' : 'blur(8px)',
    transition: isOpen
      ? `scale 0.3s ${SPRING}, opacity 0.2s ease-out, filter 0.3s ${SPRING}`
      : `scale 0.15s ${EASE_OUT}, opacity 0.12s ease-in, filter 0.15s ${EASE_OUT}`,
    pointerEvents: isOpen ? 'auto' : 'none',
  }
}

export function slideStyle(isOpen, placement = 'bottom-center') {
  if (prefersReducedMotion) return reduced(isOpen)
  const SLIDE_OFFSETS = {
    'bottom-center': { x: '0', y: '-8px', origin: 'top center' },
    'top-center': { x: '0', y: '8px', origin: 'bottom center' },
  }
  const offset = SLIDE_OFFSETS[placement] || SLIDE_OFFSETS['bottom-center']
  return {
    transformOrigin: offset.origin,
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translate(0, 0)' : `translate(${offset.x}, ${offset.y})`,
    filter: isOpen ? 'blur(0px)' : 'blur(8px)',
    transition: isOpen
      ? `opacity 0.2s ease-out, transform 0.3s ${SPRING}, filter 0.3s ${SPRING}`
      : `opacity 0.12s ease-in, transform 0.15s ${EASE_OUT}, filter 0.15s ${EASE_OUT}`,
    pointerEvents: isOpen ? 'auto' : 'none',
  }
}

export const menuShadow = { boxShadow: 'var(--inv-menu-shadow)' }
