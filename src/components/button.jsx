import { forwardRef } from 'react'
import Icon from '../lib/icon.jsx'

export const Button = forwardRef(function Button({
  label, variant = 'primary', size = 'default', iconLeft, iconRight,
  disabled = false, loading = false, className = '', onClick, ...rest
}, ref) {
  const variants = {
    primary: 'bg-[var(--inv-heading)] text-[var(--inv-bg)] hover:opacity-90',
    secondary: 'bg-[var(--inv-surface)] text-[var(--inv-heading)] hover:bg-[var(--inv-nav-hover-bg)]',
    ghost: 'bg-transparent text-[var(--inv-heading)] hover:bg-[var(--inv-nav-hover-bg)]',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }
  const sizes = {
    small: 'h-9 px-3 text-[13px] gap-1.5',
    default: 'h-11 px-4 text-[15px] gap-2',
    large: 'h-12 px-5 text-[15px] gap-2.5',
  }
  const iconSize = size === 'small' ? 16 : 18
  return (
    <button
      ref={ref} type="button" onClick={onClick} disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-xl cursor-pointer transition-[opacity,background-color,scale,box-shadow] duration-200 ease-out active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[var(--inv-accent)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${variant === 'secondary' ? '[box-shadow:var(--inv-shadow-sm)]' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" className="animate-spin">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="24" strokeLinecap="round" />
        </svg>
      ) : iconLeft && <Icon name={iconLeft} size={iconSize} />}
      {label}
      {!loading && iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  )
})
