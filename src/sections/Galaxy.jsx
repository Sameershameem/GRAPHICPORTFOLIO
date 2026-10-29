import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, setStyle } from '../lib/motion'
import { quality, onQualityChange, reportSlow } from '../lib/perf'
import { startCanvas } from '../lib/offscreen'
import { echoIn } from '../lib/echo'
import { openWork, onThemeChange } from '../lib/lightbox'
import { works } from '../data/works'
import Echo from '../components/Echo'
import { Swap } from '../components/Icons'

// Deterministic per-card variety (size + vertical offset)
const jitter = (i) => {
  const s = Math.sin(i * 91.7) * 43758.5453
  return s - Math.floor(s)
}
const order = [12, 3, 9, 0, 18, 6, 15, 10, 1, 13, 4, 19, 7, 16, 2, 11, 5, 17, 8, 14].map((i) => works[i])
// Image size hint: card width, clamp(118px, 13.5vw, 220px), x the 1.15 centre scale.
const cardSizes = '(max-width: 874px) 136px, (max-width: 1630px) 15.5vw, 253px'

export default function Galaxy() {
  const root = useRef(null)
  const starBox = useRef(null)
  const head = useRef(null)
  const copy = useRef(null)
  const viewport = useRef(null)
  const cards = useRef([])

  // Starfield (on its own thread where possible, see offscreen.js) + carousel loop
  useEffect(() => {
    // A fresh canvas per run: once handed to a worker it can't be reused.
    const box = starBox.current
    const el = document.createElement('canvas')
    el.className = 'absolute inset-0 h-full w-full'
    box.appendChild(el)
    let stars
    let disposed = false
    const color = () => getComputedStyle(box).color
    const sizeStars = () => stars && stars.call('resize', box.clientWidth, box.clientHeight, Math.min(window.devicePixelRatio || 1, quality.s.dpr))
    const runStars = () => stars && stars.run(state.visible && !document.hidden)
    startCanvas({
      canvas: el,
      worker: () => new Worker(new URL('../lib/starfield.worker.js', import.meta.url), { type: 'module' }),
      load: () => import('../lib/starfield'),
      onSlow: reportSlow,
      options: { settings: quality.s, color: color() },
    })
      .then((s) => {
        if (disposed) return s.dispose()
        stars = s
        sizeStars()
        stars.call('setAlpha', starAlpha(st))
        runStars()
      })
      .catch(() => {}) // no canvas: the section works without stars

    const state = { x: 0, v: 0, drag: false, lastX: 0, lastT: 0, moved: 0, visible: false }
    let W = viewport.current.clientWidth
    const spacing = () => (W < 640 ? 165 : Math.max(220, W * 0.215))
    let sp = spacing()

    let raf = 0
    let last = 0
    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016)
      last = t

      if (!state.drag) {
        state.x += state.v * dt
        state.v *= Math.pow(0.04, dt) // inertia decay
        if (Math.abs(state.v) < 22) state.v += (-22 - state.v) * Math.min(1, dt * 1.5) // gentle auto drift
      }
      const total = sp * order.length
      for (let i = 0; i < order.length; i++) {
        const el = cards.current[i]
        if (!el) continue
        let px = (((i * sp + state.x) % total) + total) % total
        px -= sp * 2
        const cx = px + sp / 2
        const n = (cx - W / 2) / (W / 2)
        if (n < -1.6 || n > 1.6) {
          setStyle(el, 'visibility', 'hidden')
          continue
        }
        setStyle(el, 'visibility', 'visible')
        const n2 = n * n
        const j = jitter(i)
        const scale = Math.max(0.55, 1 - 0.24 * n2) * (0.85 + j * 0.3)
        const y = -n2 * (W < 640 ? 26 : 46) + (j - 0.5) * 50
        setStyle(el, 'transform', `translate3d(${px}px,${y}px,0) rotateY(${-n * 16}deg) scale(${scale})`)
        setStyle(el, 'opacity', Math.max(0, Math.min(1, 1.6 - Math.abs(n))))
      }
    }
    const start = () => {
      if (!raf && state.visible && !document.hidden) {
        last = 0
        raf = requestAnimationFrame(loop)
      }
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const io = new IntersectionObserver(([e]) => {
      state.visible = e.isIntersecting
      state.visible ? start() : stop()
      runStars()
    })
    io.observe(root.current)

    const vp = viewport.current
    const down = (e) => {
      // Remember the card before pointer capture retargets the click event.
      state.target = e.target.closest('[data-work]')
      state.drag = true
      state.moved = 0
      state.lastX = e.clientX
      state.lastT = performance.now()
      state.v = 0
      vp.setPointerCapture?.(e.pointerId)
    }
    const move = (e) => {
      if (!state.drag) return
      const now = performance.now()
      const dx = e.clientX - state.lastX
      state.x += dx
      state.moved += Math.abs(dx)
      state.v = (dx / Math.max(1, now - state.lastT)) * 1000
      state.lastX = e.clientX
      state.lastT = now
    }
    const up = () => {
      state.drag = false
      state.v = Math.max(-2600, Math.min(2600, state.v))
    }
    const click = () => {
      if (state.moved > 6 || !state.target) return
      openWork(state.target.dataset.work)
    }
    vp.addEventListener('pointerdown', down)
    vp.addEventListener('pointermove', move)
    vp.addEventListener('pointerup', up)
    vp.addEventListener('pointercancel', up)
    vp.addEventListener('click', click)

    const onResize = () => {
      W = vp.clientWidth
      sp = spacing()
      sizeStars() // no-op unless the canvas really changed size
    }
    window.addEventListener('resize', onResize)
    const offQuality = onQualityChange(() => {
      stars && stars.call('setSettings', quality.s)
      sizeStars()
    })
    const offTheme = onThemeChange(() => stars && stars.call('setColor', color()))
    const onVis = () => {
      document.hidden ? stop() : start()
      runStars()
    }
    document.addEventListener('visibilitychange', onVis)

    // Stars fade in as the section arrives and out as it leaves.
    const starAlpha = (self) => Math.min(1, self.progress * 4) * Math.min(1, (1 - self.progress) * 3.5)
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top 85%',
      end: 'bottom top',
      onUpdate: (self) => stars && stars.call('setAlpha', starAlpha(self)),
    })

    return () => {
      disposed = true
      stars && stars.dispose()
      el.remove()
      stop()
      io.disconnect()
      st.kill()
      offQuality()
      offTheme()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      vp.removeEventListener('pointerdown', down)
      vp.removeEventListener('pointermove', move)
      vp.removeEventListener('pointerup', up)
      vp.removeEventListener('pointercancel', up)
      vp.removeEventListener('click', click)
    }
  }, [])

  // Reveal
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      echoIn(tl, head.current, 0)
      tl.fromTo(copy.current.children, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out' }, 0.2)
      tl.fromTo(viewport.current, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.1)
      ScrollTrigger.create({ trigger: root.current, start: 'top 62%', once: true, onEnter: () => tl.play() })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="about" ref={root} className="relative flex min-h-[115svh] flex-col justify-center overflow-hidden py-24">
      <div ref={starBox} className="pointer-events-none absolute inset-0 text-fg" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1300px] flex-col items-center gap-5 px-6 text-center md:flex-row md:items-start md:justify-center md:gap-[9vw] md:text-left">
        <Echo ref={head} className="serif-head text-glow text-[clamp(38px,4.15vw,74px)]">
          Saima
        </Echo>
        <div ref={copy} className="max-w-[max(300px,24vw)] pt-1">
          <p className="text-[clamp(12px,1.1vw,17px)] font-medium leading-snug text-fg/85" style={{ visibility: 'hidden' }}>
            No templates, no noise, no shortcuts. Just honest, purposeful design — crafted for brands that want to be remembered.
          </p>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[clamp(11px,0.85vw,13px)] font-semibold text-muted md:justify-start" style={{ visibility: 'hidden' }}>
            <Swap className="size-3.5" /> Drag to explore
          </p>
        </div>
      </div>

      <div
        ref={viewport}
        className="relative z-10 mt-[clamp(48px,9vh,110px)] h-[clamp(300px,34vw,520px)] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
        style={{ perspective: '1100px', visibility: 'hidden' }}
        aria-label="All designs — drag to explore"
      >
        {order.map((w, i) => (
            <button
              type="button"
              key={w.id}
              data-work={w.id}
              ref={(el) => (cards.current[i] = el)}
              className="absolute left-0 top-[12%] flex flex-col items-center text-center will-change-transform"
              style={{ width: 'clamp(118px, 13.5vw, 220px)', visibility: 'hidden' }}
            >
              <img
                src={w.sm}
                srcSet={w.srcSet}
                sizes={cardSizes}
                alt={`${w.title} — ${w.client}`}
                width={w.w}
                height={w.h}
                loading="lazy"
                decoding="async"
                draggable="false"
                className="card-shadow pointer-events-none w-full rounded-[3px]"
              />
              <span className="mt-2.5 font-serif text-[clamp(13px,1vw,16px)] leading-tight">{w.title}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[clamp(10px,0.75vw,12px)] text-muted">
                For {w.client}
                <span className="grid size-2.5 place-items-center rounded-full bg-fg text-[7px] text-bg">✓</span>
              </span>
            </button>
        ))}
      </div>
    </section>
  )
}
