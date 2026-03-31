export function HeartIcon({ size = 16, className = '' }) {
  return (
    <img
      src="/heart.png"
      alt=""
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', outline: 'none' }}
    />
  )
}
