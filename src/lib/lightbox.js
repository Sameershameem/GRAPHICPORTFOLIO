// Tiny event bus so any card on the page can open the lightbox.
export const openWork = (id) => window.dispatchEvent(new CustomEvent('open-work', { detail: id }))

// Observe theme switches (data-theme on <html>).
export function onThemeChange(cb) {
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}
