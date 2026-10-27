import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, scroller, isTouch, reducedMotion } from './motion'

export function useSmoothScroll() {
  useEffect(() => {
    if (isTouch || reducedMotion) return
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true })
    scroller.lenis = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      scroller.lenis = null
    }
  }, [])
}
