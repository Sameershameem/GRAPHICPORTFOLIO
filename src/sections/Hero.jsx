import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, isTouch, reducedMotion, scrollToTarget } from '../lib/motion'
import { Vortex } from '../lib/vortex'
import { works, atlasInfo } from '../data/works'
import { site } from '../data/site'
import WordPill from '../components/WordPill'
import ThemeToggle from '../components/ThemeToggle'
import { ArrowDown } from '../components/Icons'

const audiences = ['restaurants', 'schools', 'jewellers', 'travel brands', 'agencies', 'startups']

export default function Hero() {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const title = useRef(null)
  const corners = useRef(null)

  // Vortex canvas
  useEffect(() => {
    const el = canvas.current
    const mobile = window.innerWidth < 768 || isTouch
    let vortex
    let raf = 0
    let last = 0
    let visible = true
    let disposed = false

    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      const dt = last ? (t - last) / 1000 : 0.016
      last = t
      vortex.update(reducedMotion ? dt * 0.15 : dt)
      vortex.draw()
    }
    const start = () => {
      if (!raf && visible && !document.hidden && vortex) {
        last = 0
        raf = requestAnimationFrame(loop)
      }
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const img = new Image()
    img.decoding = 'async'
    img.src = atlasInfo.src
    img
      .decode()
      .catch(() => new Promise((r) => (img.complete ? r() : (img.onload = r))))
      .then(() => {
        if (disposed) return
        vortex = new Vortex(el, img, works, { mobile })
        if (reducedMotion) vortex.intro = 0
        gsap.to(el, { opacity: 1, duration: 1.2, ease: 'power2.out' })
        start()
      })

    const onResize = () => vortex && vortex.resize()
    const onMove = (e) => vortex && vortex.pointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5)
    const onVis = () => (document.hidden ? stop() : start())
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      visible ? start() : stop()
    })
    io.observe(wrap.current)
    window.addEventListener('resize', onResize)
    if (!isTouch) window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVis)

    const st = ScrollTrigger.create({
      trigger: wrap.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (!vortex) return
        const p = self.progress
        vortex.warp = p
        vortex.alpha = 1 - gsap.utils.clamp(0, 1, (p - 0.55) / 0.38)
      },
    })

    return () => {
      disposed = true
      stop()
      io.disconnect()
      st.kill()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // Title intro + scroll-out
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        title.current.children,
        { autoAlpha: 0, filter: 'blur(14px)', y: 14 },
        { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 1.4, ease: 'power3.out', stagger: 0.12, delay: 0.15 },
      )
      gsap.fromTo(corners.current.children, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 0.8 })

      const tl = gsap.timeline({
        scrollTrigger: { trigger: wrap.current, start: 'top top', end: '20% top', scrub: true },
      })
      tl.to(title.current, { scale: 0.94, autoAlpha: 0, filter: 'blur(16px)', ease: 'power1.in', duration: 1 }, 0)
      tl.to(corners.current, { autoAlpha: 0, duration: 0.3 }, 0)
    })
    return () => ctx.revert()
  }, [])

  return (
    <section id="top" ref={wrap} className="relative h-[170vh]">
      <div className="sticky top-0 h-lvh w-full overflow-hidden">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0" aria-hidden="true" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-svh items-center justify-center px-4">
          <div ref={title} className="pointer-events-auto flex flex-col items-center text-center will-change-transform">
            <h1 className="text-glow font-display text-[clamp(40px,15vw,128px)] font-[650] leading-[0.9] tracking-[-0.045em] sm:text-[clamp(40px,8.1vw,150px)]">
              <span className="sr-only">{site.name}, {site.role}</span>
              <span aria-hidden="true" className="block max-[520px]:hidden">
                {site.wordmark}
                <sup className="ml-[0.06em] align-[0.95em] text-[0.26em] font-semibold tracking-normal">©</sup>
              </span>
              <span aria-hidden="true" className="hidden max-[520px]:block">
                SAIMA
                <br />
                AHMED
                <sup className="ml-[0.06em] align-[0.95em] text-[0.26em] font-semibold tracking-normal">©</sup>
              </span>
            </h1>
            <p className="soft-glow mt-[clamp(14px,1.6vw,22px)] flex items-center gap-[0.45em] text-[clamp(13px,1.28vw,20px)] font-semibold tracking-[-0.01em]">
              A graphic designer for <WordPill words={audiences} interval={2400} delay={600} />
            </p>
          </div>
        </div>

        <div ref={corners}>
          <div className="absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-4 sm:left-5">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => scrollToTarget('#work')}
            className="absolute bottom-[max(18px,env(safe-area-inset-bottom))] right-4 flex items-center gap-2.5 text-[11px] font-semibold sm:right-5 sm:text-[clamp(11px,0.9vw,14px)]"
          >
            <span className="text-fg/80">Scroll to explore</span>
            <span className="btn-glow grid size-[2em] place-items-center rounded-[0.6em]">
              <ArrowDown className="size-3 animate-bounce [animation-duration:1.6s]" />
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
