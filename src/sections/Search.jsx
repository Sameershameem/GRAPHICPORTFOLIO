import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/motion'
import { quality } from '../lib/perf'
import { echoIn } from '../lib/echo'
import { byId } from '../data/works'
import Echo from '../components/Echo'
import { Search as SearchIcon } from '../components/Icons'

// Loose collage; positions are % of the collage box.
const slots = [
  { id: 'rakesh-bangles', x: 2, y: 10, w: 26, depth: 0.6 },
  { id: 'barkaas-lamb-chops', x: 34, y: 0, w: 34, depth: 1 },
  { id: 'gravity-neet-results', x: 76, y: 36, w: 24, depth: 0.8 },
  { id: 'alayham-suitcase', x: 4, y: 58, w: 23, depth: 1.2 },
  { id: 'rakesh-diamonds', x: 40, y: 64, w: 24, depth: 0.9 },
  { id: 'barkaas-kunafa', x: 72, y: 72, w: 21, depth: 1.1 },
]

const queries = [
  { q: 'gold jewellery', tag: 'Jewellery' },
  { q: 'restaurant menu', tag: 'Restaurant' },
  { q: 'school admissions', tag: 'Education' },
  { q: 'travel offers', tag: 'Travel' },
]

export default function Search() {
  const root = useRef(null)
  const head = useRef(null)
  const para = useRef(null)
  const imgs = useRef([])
  const bar = useRef(null)
  const typed = useRef(null)
  const [active, setActive] = useState(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      echoIn(tl, head.current, 0)
      tl.fromTo(para.current, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.25)
      tl.fromTo(
        imgs.current,
        { autoAlpha: 0, y: 80, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out', stagger: 0.07 },
        0,
      )
      tl.fromTo(bar.current, { autoAlpha: 0, y: 24, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }, 0.35)
      ScrollTrigger.create({ trigger: root.current, start: 'top 72%', once: true, onEnter: () => tl.play() })

      // Depth parallax while the section passes
      imgs.current.forEach((el, i) => {
        gsap.fromTo(
          el.parentElement,
          { y: 60 * slots[i].depth },
          { y: -60 * slots[i].depth, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } },
        )
      })
    }, root)
    return () => ctx.revert()
  }, [])

  // Typing loop, only while visible
  useEffect(() => {
    let alive = true
    let visible = false
    let timer
    let qi = 0
    const wait = (ms) => new Promise((r) => (timer = setTimeout(r, ms)))
    const run = async () => {
      while (alive) {
        if (!visible) {
          await wait(400)
          continue
        }
        const { q, tag } = queries[qi % queries.length]
        for (let i = 1; i <= q.length && alive; i++) {
          typed.current.textContent = q.slice(0, i)
          await wait(70 + Math.random() * 60)
        }
        setActive(tag)
        await wait(2200)
        for (let i = q.length; i >= 0 && alive; i--) {
          typed.current.textContent = q.slice(0, i)
          await wait(28)
        }
        setActive(null)
        await wait(450)
        qi++
      }
    }
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.3 })
    io.observe(root.current)
    run()
    return () => {
      alive = false
      clearTimeout(timer)
      io.disconnect()
    }
  }, [])

  return (
    <section ref={root} className="relative mx-auto flex min-h-svh w-full max-w-[1600px] flex-col justify-center gap-10 px-5 py-24 md:flex-row md:items-end md:gap-6 md:px-10">
      <div className="z-10 md:w-[36%] md:pb-[12vh]">
        <Echo ref={head} className="serif-head text-glow whitespace-nowrap text-[clamp(34px,4.15vw,74px)]">
          Find any style
          <br />
          instantly
        </Echo>
        <p ref={para} className="mt-4 max-w-[340px] text-[clamp(12px,1.1vw,17px)] font-medium leading-snug text-fg/80" style={{ visibility: 'hidden' }}>
          Restaurants, schools, jewellers, travel and agencies — every industry gets its own visual language, ready to be searched and resurfaced.
        </p>
      </div>

      <div className="relative aspect-[1/1.02] w-full md:aspect-[1.15/1] md:w-[60%]">
        {slots.map((s, i) => {
          const work = byId[s.id]
          const dim = active && work.tag !== active
          // Greyed-out matches; the cheapest look (fade only) on the lowest tier.
          const dimFilter = dim && quality.tier !== 'low' ? 'grayscale(0.6)' : 'none'
          return (
            <div key={s.id} className="absolute will-change-transform" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }}>
              <div ref={(el) => (imgs.current[i] = el)} style={{ visibility: 'hidden' }}>
                <img
                  src={work.sm}
                  srcSet={work.srcSet}
                  sizes={`(min-width: 768px) ${(s.w * 0.6).toFixed(1)}vw, ${s.w}vw`}
                  alt={`${work.title} — ${work.client}`}
                  width={work.w}
                  height={work.h}
                  loading="lazy"
                  decoding="async"
                  className="card-shadow w-full rounded-[3px] transition-[opacity,filter,transform] duration-500"
                  style={{ opacity: dim ? 0.22 : 1, filter: dimFilter, transform: active && !dim ? 'scale(1.03)' : 'none' }}
                />
              </div>
            </div>
          )
        })}
        <div
          ref={bar}
          className="glass absolute left-1/2 top-[48%] flex w-[min(78%,330px)] -translate-x-1/2 items-center gap-2.5 rounded-[11px] px-3.5 py-2.5 text-[13px] font-medium shadow-2xl md:left-[52%] md:top-[45%] md:w-[44%]"
          style={{ visibility: 'hidden' }}
          role="presentation"
        >
          <SearchIcon className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            <span ref={typed} />
            <span className="ml-px inline-block h-[1.05em] w-px translate-y-[2px] animate-pulse bg-fg" />
          </span>
          <kbd className="grid size-5 place-items-center rounded-[5px] border border-line text-[10px] text-muted">/</kbd>
        </div>
      </div>
    </section>
  )
}
