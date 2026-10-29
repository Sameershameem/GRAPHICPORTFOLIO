// Headline wrapper for the heading swap transitions (see lib/echo.js).
export default function Echo({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`echo ${className}`} {...rest}>
      <span className="block">{children}</span>
    </Tag>
  )
}
