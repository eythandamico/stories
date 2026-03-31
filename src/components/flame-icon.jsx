export function FlameIcon({ size = 16, className = '' }) {
  return (
    <img
      src="/flame.png"
      alt=""
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', outline: 'none' }}
    />
  )
}
