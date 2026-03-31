export function Row({ gap = 'md', align = 'center', justify = 'start', wrap = false, className = '', children, ...rest }) {
  const gaps = { xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-10' }
  const aligns = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch', baseline: 'items-baseline' }
  const justifies = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between', around: 'justify-around' }
  return (
    <div className={`flex ${gaps[gap] || gaps.md} ${aligns[align]} ${justifies[justify]} ${wrap ? 'flex-wrap' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}
