import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, isTouch } from '../lib/motion'
import { echoIn } from '../lib/echo'
import { site, mailto } from '../data/site'
import Echo from '../components/Echo'

export default function Journey() {
  const root = useRef(null)
  const canvas = useRef(null)
  const kicker = useRef(null)
  const head = useRef(null)
  const btn = useRef(null)

  // 3D rocks — three.js is only fetched when this section gets close
  useEffect(() => {
    let scene
    let raf = 0
    let last = 0
    let visible = false
    let disposed = false
    const mobile = window.innerWidth < 768 || isTouch

    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016)
      last = t
      scene.render(t / 1000, dt)
    }
    const start = () => {
      if (scene && visible && !raf && !document.hidden) {
        last = 0
        raf = requestAnimationFrame(loop)
      }
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || scene) return
        near.disconnect()
        // Build the scene in idle time so geometry + shader work never lands mid-scroll.
        const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 120))
        import('../lib/rocks').then(({ createRocks }) =>
          idle(
            () => {
              if (disposed) return
              try {
                scene = createRocks(canvas.current, { mobile })
              } catch {
                return // no WebGL: the section still works without rocks
              }
              start()
            },
            { timeout: 1500 },
          ),
        )
      },
      { rootMargin: '250% 0px' },
    )
    near.observe(root.current)

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      visible ? start() : stop()
    })
    io.observe(root.current)

    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top 75%',
      end: 'top 10%',
      scrub: true,
      onUpdate: (self) => scene && (scene.state.enter = self.progress),
      onRefresh: (self) => scene && (scene.state.enter = self.progress),
    })

    const onResize = () => scene && scene.resize()
    const onMove = (e) => scene && scene.pointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5)
    const onVis = () => (document.hidden ? stop() : start())
    window.addEventListener('resize', onResize)
    if (!isTouch) window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVis)

    return () => {
      disposed = true
      stop()
      near.disconnect()
      io.disconnect()
      st.kill()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
      scene && scene.dispose()
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(kicker.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0)
      echoIn(tl, head.current, 0.1, { blur: !isTouch })
      tl.fromTo(btn.current, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'back.out(1.8)' }, 0.45)
      ScrollTrigger.create({ trigger: root.current, start: 'top 45%', once: true, onEnter: () => tl.play() })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="contact" ref={root} className="relative flex h-svh min-h-[560px] flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
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
