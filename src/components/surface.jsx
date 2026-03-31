export function Surface({ padding = 'md', elevation = 'sm', className = '', children, ...rest }) {
  const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-8' }
  const shadows = { none: '', sm: 'var(--inv-shadow-sm)', md: 'var(--inv-shadow)' }
  return (
    <div
      className={`rounded-2xl bg-[var(--inv-surface)] ${paddings[padding] || ''} ${className}`}
      style={shadows[elevation] ? { boxShadow: shadows[elevation] } : undefined}
      {...rest}
    >
      {children}
    </div>
  )
}
