import { useEffect, useState } from 'react'

// Stage size based on the *small* viewport height so layouts don't jump when
// mobile browser toolbars show/hide. Only re-measures on real size changes.
function measure() {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:100vh;height:100svh;visibility:hidden;pointer-events:none'
  document.body.appendChild(probe)
  const h = probe.offsetHeight || window.innerHeight
  probe.remove()
  return { w: document.documentElement.clientWidth || window.innerWidth, h }
}

export function useViewport() {
  const [vp, setVp] = useState(() => (typeof window === 'undefined' ? { w: 1440, h: 900 } : measure()))
  useEffect(() => {
    let t
    const onResize = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const next = measure()
        setVp((prev) => (prev.w !== next.w || Math.abs(prev.h - next.h) > 120 ? next : prev))
      }, 150)
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])
  return vp
}
