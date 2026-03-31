export function Stack({ gap = 'md', as: Tag = 'div', className = '', children, ...rest }) {
  const gaps = { xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-10' }
  return (
    <Tag className={`flex flex-col ${gaps[gap] || gaps.md} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
