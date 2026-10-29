import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, isTouch } from '../lib/motion'
import { quality, onQualityChange, reportSlow } from '../lib/perf'
import { startCanvas } from '../lib/offscreen'
import { echoIn } from '../lib/echo'
import { site, mailto } from '../data/site'
import Echo from '../components/Echo'

export default function Journey() {
  const root = useRef(null)
  const rocksBox = useRef(null)
  const kicker = useRef(null)
  const head = useRef(null)
  const btn = useRef(null)

  // 3D rocks, on their own thread where possible (see offscreen.js), so
  // fetching three.js, building the scene and drawing it never compete with
  // scrolling. Built shortly after the page settles, or as soon as this
  // section gets close.
  useEffect(() => {
    let rocks
    let visible = false
    let disposed = false
    let building = false
    let timer
    let el
    const box = rocksBox.current
    const resize = () => rocks && rocks.call('resize', box.clientWidth, box.clientHeight, Math.min(window.devicePixelRatio || 1, quality.s.rocksDpr))
    const run = () => rocks && rocks.run(visible && !document.hidden)

    const build = () => {
      if (building || disposed) return
      building = true
      near.disconnect()
      clearTimeout(timer)
      el = document.createElement('canvas')
      el.className = 'absolute inset-0 h-full w-full'
      box.appendChild(el)
      startCanvas({
        canvas: el,
        context: 'webgl',
        worker: () => new Worker(new URL('../lib/rocks.worker.js', import.meta.url), { type: 'module' }),
        load: () => import('../lib/rocks'),
        onSlow: reportSlow,
        options: { settings: quality.s },
      })
        .then((r) => {
          if (disposed) return r.dispose()
          rocks = r
          resize()
          rocks.call('setEnter', st.progress)
          run()
        })
        .catch(() => {}) // no WebGL: the section still works without rocks
    }
    const near = new IntersectionObserver(([e]) => e.isIntersecting && build(), { rootMargin: '200% 0px' })
    near.observe(root.current)
    // Also build early, in idle time after load, unless Data Saver is on (then
    // only once the visitor heads this way).
    const early = () => (timer = setTimeout(() => (window.requestIdleCallback || setTimeout)(build, { timeout: 3000 }), 2500))
    if (!navigator.connection?.saveData) {
      if (document.readyState === 'complete') early()
      else window.addEventListener('load', early, { once: true })
    }
    const offQuality = onQualityChange(() => {
      rocks && rocks.call('setSettings', quality.s)
      resize()
    })

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      run()
    })
    io.observe(root.current)

    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top 75%',
      end: 'top 10%',
      scrub: true,
      onUpdate: (self) => rocks && rocks.call('setEnter', self.progress),
      onRefresh: (self) => rocks && rocks.call('setEnter', self.progress),
    })

    const onMove = (e) => rocks && rocks.call('pointer', e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5)
    window.addEventListener('resize', resize)
    if (!isTouch) window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', run)

    return () => {
      disposed = true
      rocks && rocks.dispose()
      el && el.remove()
      clearTimeout(timer)
      offQuality()
      near.disconnect()
      io.disconnect()
      st.kill()
      window.removeEventListener('load', early)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', run)
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(kicker.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0)
      echoIn(tl, head.current, 0.1)
      tl.fromTo(btn.current, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'back.out(1.8)' }, 0.45)
      ScrollTrigger.create({ trigger: root.current, start: 'top 45%', once: true, onEnter: () => tl.play() })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="contact" ref={root} className="relative flex h-svh min-h-[560px] flex-col items-center justify-center overflow-hidden">
      <div ref={rocksBox} className="pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <p ref={kicker} className="text-[11px] font-medium text-fg/75 sm:text-[clamp(11px,0.9vw,14px)]" style={{ visibility: 'hidden' }}>
          Have a project in mind?
        </p>
        <Echo ref={head} as="h2" className="serif-head text-glow mt-1.5 text-[clamp(36px,4.3vw,78px)]">
          Let&rsquo;s create together
        </Echo>
        <a ref={btn} href={mailto} className="btn-glow btn-glow-xl mt-5 rounded-[0.8em] px-[2.2em] py-[0.8em] text-[13px] font-semibold sm:text-[clamp(13px,1.05vw,16px)]" style={{ visibility: 'hidden' }}>
          Get in touch
        </a>
      </div>

      <footer className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-between gap-1.5 px-5 pb-[max(18px,env(safe-area-inset-bottom))] text-center text-[11px] text-muted sm:flex-row sm:gap-2">
        <span>
          © {site.year} {site.name} · {site.role}
        </span>
        <span>
          Designed and built by{' '}
          <a
            href={site.credit.url}
            target="_blank"
            rel="noreferrer"
            className="text-fg/80 underline decoration-fg/30 underline-offset-2 transition-colors hover:text-fg hover:decoration-fg"
          >
            {site.credit.name}
          </a>
        </span>
        <nav className="flex gap-4">
          <a href={site.linkedin} target="_blank" rel="noreferrer" className="hover:text-fg">
            LinkedIn
          </a>
          <a href={mailto} className="hover:text-fg">
            {site.email}
          </a>
        </nav>
      </footer>
    </section>
  )
}
