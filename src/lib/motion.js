import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
gsap.config({ force3D: true, nullTargetWarn: false })
ScrollTrigger.config({ ignoreMobileResize: true })

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

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
// Maps v from [a,b] to [0,1], clamped.
export const range = (v, a, b) => clamp((v - a) / (b - a))
