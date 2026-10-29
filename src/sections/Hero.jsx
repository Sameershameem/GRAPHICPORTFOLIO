import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, isTouch, reducedMotion, scrollToTarget } from '../lib/motion'
import { quality, onQualityChange, reportSlow } from '../lib/perf'
import { startCanvas } from '../lib/offscreen'
import { works, atlasInfo } from '../data/works'
import { site } from '../data/site'
import WordPill from '../components/WordPill'
import ThemeToggle from '../components/ThemeToggle'
import { ArrowDown } from '../components/Icons'

const audiences = ['restaurants', 'schools', 'jewellers', 'travel brands', 'agencies', 'startups']

export default function Hero() {
  const wrap = useRef(null)
  const canvasBox = useRef(null)
  const title = useRef(null)
  const corners = useRef(null)

  // Vortex canvas
  useEffect(() => {
    // A fresh canvas per run: once handed to a worker it can't be reused.
    const el = document.createElement('canvas')
    el.className = 'absolute inset-0 h-full w-full'
    canvasBox.current.appendChild(el)
    let vortex
    let visible = true
    let disposed = false
    // Small-viewport height (the title's box), stable while phone toolbars move.
    const svh = () => title.current?.parentElement?.clientHeight || window.innerHeight
    const resize = () => vortex.call('resize', el.clientWidth, el.clientHeight, svh(), Math.min(window.devicePixelRatio || 1, quality.s.dpr))
    const run = () => vortex && vortex.run(visible && !document.hidden)

    // Cards vanish around the title block (wordmark + subtitle). Measured only
    // while the title is untransformed (not mid-intro, not scrolled).
    const aim = () => {
      const h1 = title.current?.querySelector('h1')
      const sub = title.current?.querySelector('p')
      if (!vortex || !h1 || !sub || window.scrollY > 40) return
      const a = h1.getBoundingClientRect()
      const b = sub.getBoundingClientRect()
      const c = el.getBoundingClientRect()
      const x0 = Math.min(a.left, b.left)
      const y0 = Math.min(a.top, b.top)
      vortex.call('setTitle', x0 - c.left, y0 - c.top, Math.max(a.right, b.right) - x0, Math.max(a.bottom, b.bottom) - y0)
    }

    // The atlas file goes to the engine as-is and is decoded on its thread.
    fetch(atlasInfo.src)
      .then((r) => r.blob())
      .then(
        (atlas) =>
          !disposed &&
          startCanvas({
            canvas: el,
            worker: () => new Worker(new URL('../lib/vortex.worker.js', import.meta.url), { type: 'module' }),
            load: () => import('../lib/vortex'),
            onSlow: reportSlow,
            options: { atlas, works: works.map((w) => ({ rect: w.rect })), settings: quality.s, intro: reducedMotion ? 0 : 1, timeScale: reducedMotion ? 0.15 : 1 },
          }),
      )
      .then((v) => {
        if (!v) return
        if (disposed) return v.dispose()
        vortex = v
        resize()
        aim()
        document.fonts?.ready.then(aim)
        setTimeout(aim, 1800) // after the title's intro transform has settled
        update(st)
        run()
        gsap.to(canvasBox.current, { opacity: 1, duration: 1.2, ease: 'power2.out' })
      })
      .catch(() => {}) // atlas unavailable (offline): the hero still works without the cards

    // Phones fire resize whenever the toolbar slides; only real size changes matter.
    let size = ''
    const onResize = () => {
      if (!vortex) return
      const next = `${window.innerWidth}x${svh()}`
      if (next === size) return
      size = next
      resize()
      if (window.scrollY < 40) aim()
    }
    const offQuality = onQualityChange(() => {
      if (!vortex) return
      vortex.call('setSettings', quality.s)
      resize()
    })
    const onMove = (e) => vortex && vortex.call('pointer', e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      run()
    })
    io.observe(wrap.current)
    window.addEventListener('resize', onResize)
    if (!isTouch) window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', run)

    // Scrolling speeds the flow up, then the field fades out.
    const update = (self) => vortex && vortex.call('scroll', self.progress, 1 - gsap.utils.clamp(0, 1, (self.progress - 0.7) / 0.2))
    const st = ScrollTrigger.create({ trigger: wrap.current, start: 'top top', end: 'bottom bottom', onUpdate: update, onRefresh: update })

    return () => {
      disposed = true
      vortex && vortex.dispose()
      el.remove()
      offQuality()
      io.disconnect()
      st.kill()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', run)
    }
  }, [])

  // Title intro + scroll-out
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        title.current.children,
        { autoAlpha: 0, y: 14, blur: 14 },
        { autoAlpha: 1, y: 0, blur: 0, duration: 1.4, ease: 'power3.out', stagger: 0.12, delay: 0.15 },
      )
      gsap.fromTo(corners.current.children, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 0.8 })

      const tl = gsap.timeline({
        scrollTrigger: { trigger: wrap.current, start: 'top top', end: '16% top', scrub: true },
      })
      tl.to(title.current, { scale: 0.86, autoAlpha: 0, blur: 5, ease: 'power1.in', duration: 1 }, 0)
      tl.to(corners.current, { autoAlpha: 0, duration: 0.3 }, 0)
    })
    return () => ctx.revert()
  }, [])

  return (
    <section id="top" ref={wrap} className="relative h-[170vh]">
      <div className="sticky top-0 h-lvh w-full overflow-hidden">
        <div ref={canvasBox} className="absolute inset-0 opacity-0" aria-hidden="true" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-svh items-center justify-center px-4">
          <div ref={title} className="pointer-events-auto flex flex-col items-center text-center will-change-transform">
            <h1 className="text-glow font-display text-[clamp(40px,15vw,128px)] font-[650] leading-[0.9] tracking-[-0.045em] sm:text-[clamp(40px,6.6vw,124px)]">
              <span className="sr-only">{site.name}, {site.role}</span>
              <span aria-hidden="true" className="block max-[520px]:hidden">
                {site.wordmark}
                <sup className="ml-[0.06em] align-[0.95em] text-[0.26em] font-semibold tracking-normal">©</sup>
              </span>
              <span aria-hidden="true" className="hidden max-[520px]:block">
                SAIMA
                <br />
                AHMAD
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
