// Headline with ghost copies for the echo/smear transition (see lib/echo.js).
export default function Echo({ as: Tag = 'div', className = '', children, ghosts = 3, ...rest }) {
  return (
    <Tag className={`echo ${className}`} {...rest}>
      <span className="block">{children}</span>
      {Array.from({ length: ghosts }, (_, i) => (
        <span key={i} aria-hidden="true" className="echo-ghost block" style={{ visibility: 'hidden', opacity: 0 }}>
          {children}
        </span>
      ))}
    </Tag>
  )
}
