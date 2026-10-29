import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
gsap.config({ force3D: true, nullTargetWarn: false })
ScrollTrigger.config({ ignoreMobileResize: true })

// Tween with { blur: px } instead of filter: 'blur(...)'. The filter is
// removed entirely at 0 (a leftover blur(0px) still costs the browser a render
// pass), and blur only shows on the 'high' quality tier (lib/perf.js), where
// it's cheap to draw.
gsap.registerPlugin({
  name: 'blur',
  init(target, value) {
    this.target = target
    target._blur = target._blur || 0 // must exist, or GSAP would write an attribute
    this.add(target, '_blur', target._blur, +value)
  },
  render(ratio, data) {
    for (let pt = data._pt; pt; pt = pt._next) pt.r(ratio, pt.d)
    const el = data.target
    const v = el._blur
    const css = v > 0.05 && document.documentElement.dataset.quality === 'high' ? `blur(${v}px)` : ''
    if (el._blurCss !== css) {
      el._blurCss = css
      el.style.filter = css
    }
  },
})

export { gsap, ScrollTrigger }

export const isBrowser = typeof window !== 'undefined'
export const isTouch = isBrowser && window.matchMedia('(hover: none), (pointer: coarse)').matches
export const reducedMotion = isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Shared smooth-scroll instance (set by useSmoothScroll); null on touch devices
// where native momentum scrolling is smoother than any JS emulation.
export const scroller = { lenis: null }

export function scrollToTarget(target, offset = 0) {
  if (scroller.lenis) scroller.lenis.scrollTo(target, { offset, duration: 1.6 })
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    const y = typeof target === 'number' ? target : el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

// Per-frame style writes: skip the ones whose value didn't change, so the
// browser doesn't redo style work for them on every scroll tick.
export function setStyle(el, prop, v) {
  const k = `_${prop}`
  if (el[k] !== v) {
    el[k] = v
    el.style[prop] = v
  }
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
// Maps v from [a,b] to [0,1], clamped.
export const range = (v, a, b) => clamp((v - a) / (b - a))
