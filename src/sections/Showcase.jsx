import { useLayoutEffect, useMemo, useRef } from 'react'
import { gsap, isTouch, lerp, clamp, setStyle } from '../lib/motion'
import { quality } from '../lib/perf'
import { echoIn, echoOut } from '../lib/echo'
import { useViewport } from '../lib/useViewport'
import { computeLayout, SHARED_ID, FEATURED_ID } from '../lib/showcaseLayout'
import { byId, works } from '../data/works'
import { site } from '../data/site'
import Echo from '../components/Echo'
import WordPill from '../components/WordPill'
import { Instagram, Printer, Box, Quote, Sparkle } from '../components/Icons'

const badge = { ig: Instagram, print: Printer, box: Box }
const mediums = ['posters', 'packaging', 'social media', 'menus', 'branding']
const tags = [
  { label: 'Typography', x: -0.16, y: 0.2 },
  { label: 'Gold tones', x: 0.78, y: 0.36 },
  { label: 'Layout', x: -0.1, y: 0.6 },
  { label: 'Retouching', x: 0.72, y: 0.74 },
]
const UNITS = 8.35

// size: displayed width in CSS px (picks the image file).
function Card({ work, icon, eager, size, className = '', imgRef }) {
  const Icon = badge[icon]
  return (
    <div className={`card-shadow relative h-full w-full overflow-hidden rounded-[3px] bg-faint ${className}`}>
      <img
        ref={imgRef}
        src={work.sm}
        srcSet={work.srcSet}
        sizes={`${Math.round(size)}px`}
        alt={`${work.title} — ${work.client}`}
        width={work.w}
        height={work.h}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className="h-full w-full object-cover"
        draggable="false"
      />
      {Icon && (
        <span className="absolute bottom-[6%] right-[6%] grid size-[18px] place-items-center rounded-[5px] bg-black/75 text-white">
          <Icon className="size-[11px]" />
        </span>
      )}
    </div>
  )
}

const tr = (r, base) => `translate3d(${r.x}px,${r.y}px,0) scale(${r.w / base})`
const lerpRect = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) })
const shift = (r, dy) => ({ ...r, y: r.y + dy })

export default function Showcase() {
  const vp = useViewport()
  const L = useMemo(() => computeLayout(vp.w, vp.h), [vp])
  const unit = L.H * (L.wide ? 0.56 : 0.5)

  const wrap = useRef(null)
  const stage = useRef(null)
  const outer = useRef([])
  const inner = useRef([])
  const r = useRef({})
  const gridEls = useRef([])

  const shared = byId[SHARED_ID]
  const feat = byId[FEATURED_ID]
  const sharedBase = Math.max(L.mid.w, L.sharedSlot.w, L.sharedScatter.w)

  useLayoutEffect(() => {
    const $ = r.current
    // Extra image highlight during the scan, where filters are cheap.
    const rich = quality.s.filters
    const ctx = gsap.context(() => {
      const p = { drift: 0, fly: 0, land: 0, rise: 0, gridIn: 0, scroll: 0, dim: 0, pop: 0 }
      const inOut = gsap.parseEase('power2.inOut')
      const out = gsap.parseEase('power3.out')
      const riseDist = L.H - L.panel.y + 60

      const render = () => {
        const panelY = (1 - out(p.rise)) * riseDist - L.scrollD * p.scroll
        setStyle($.panel, 'transform', `translate3d(0,${panelY}px,0)`)

        L.scatter.forEach((c, i) => {
          if (c.id === SHARED_ID) return
          setStyle(outer.current[i], 'transform', `translate3d(0,${-p.drift * c.d * 0.08 * L.H}px,0)`)
        })

        // Shared card: scatter -> mid air -> collection slot (tracks the rising panel)
        const sDrift = -p.drift * 0.08 * L.H
        const at = (fly, land) =>
          land <= 0
            ? lerpRect(shift(L.sharedScatter, sDrift), L.mid, inOut(clamp(fly)))
            : lerpRect(L.mid, shift(L.sharedSlot, panelY), inOut(clamp(land)))
        setStyle($.shared, 'transform', tr(at(p.fly, p.land), sharedBase))
        setStyle($.shared, 'opacity', 1 - p.dim)
        const moving = Math.sin(Math.PI * clamp(p.fly)) + Math.sin(Math.PI * clamp(p.land))
        $.sharedGhosts.forEach((g, k) => {
          const lag = (k + 1) * 0.11
          const o = moving * (0.32 - k * 0.12)
          setStyle(g, 'opacity', o)
          if (o > 0) setStyle(g, 'transform', tr(at(p.fly - lag, p.land > 0 ? p.land - lag : 0), sharedBase))
        })

        // Grid items fade in one by one, then dim away while the featured card pops out
        gridEls.current.forEach((el, i) => {
          if (!el) return
          const a = clamp(p.gridIn * 1.9 - i * 0.07)
          setStyle(el, 'opacity', a * (1 - p.dim))
          setStyle(el, 'transform', `translate3d(0,${(1 - a) * 22}px,0)`)
        })
        setStyle($.panelBg, 'opacity', 1 - p.dim * 0.85)

        const featIn = clamp(p.gridIn * 1.9 - (L.cols - 1) * 0.07)
        const fr = lerpRect(shift(L.featuredSlot, panelY + (1 - featIn) * 22), L.featured, inOut(clamp(p.pop)))
        setStyle($.feat, 'transform', tr(fr, L.featured.w))
        setStyle($.feat, 'opacity', p.pop > 0 ? 1 : featIn)
      }

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: render,
        // Touch: native scrolling is already smooth, so only a short catch-up.
        scrollTrigger: { trigger: wrap.current, start: 'top top', end: 'bottom bottom', scrub: isTouch ? 0.2 : true },
      })

      // Section 2 — scattered work
      const ins = inner.current.filter(Boolean)
      tl.fromTo(
        ins,
        { autoAlpha: 0, scale: 0.9, blur: 10 },
        { autoAlpha: 1, scale: 1, blur: 0, duration: 0.5, ease: 'power2.out', stagger: { each: 0.035, from: 'random' } },
        0.02,
      )
      tl.to(p, { drift: 1, duration: 2.95 }, 0)
      echoIn(tl, $.headA, 0.12)
      tl.fromTo($.subA, { autoAlpha: 0, yPercent: 60 }, { autoAlpha: 1, yPercent: 0, duration: 0.4, ease: 'power2.out' }, 0.32)

      echoOut(tl, $.headA, 1.6)
      tl.to($.subA, { autoAlpha: 0, yPercent: -60, duration: 0.3, ease: 'power2.in' }, 1.62)
      echoIn(tl, $.headB, 1.86)
      tl.fromTo(
        $.subB.children,
        { autoAlpha: 0, yPercent: 70, blur: 6 },
        { autoAlpha: 1, yPercent: 0, blur: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' },
        2.05,
      )

      // Everything but the shared card leaves; it gets "picked up"
      const others = inner.current.filter((el, i) => el && L.scatter[i].id !== SHARED_ID)
      tl.to(others, { autoAlpha: 0, scale: 0.9, blur: 10, duration: 0.45, stagger: 0.025, ease: 'power2.in' }, 2.92)
      echoOut(tl, $.headB, 2.9)
      tl.to($.subB.children, { autoAlpha: 0, yPercent: -60, duration: 0.3, stagger: 0.04, ease: 'power2.in' }, 2.92)
      tl.to(p, { fly: 1, duration: 0.55 }, 2.98)
      tl.fromTo(
        $.menu,
        { autoAlpha: 0, scale: 0.94, blur: 8 },
        { autoAlpha: 1, scale: 1, blur: 0, duration: 0.22, ease: 'power2.out' },
        3.28,
      )
      tl.fromTo($.menuPick, { backgroundColor: 'rgba(255,255,255,0)' }, { backgroundColor: 'rgba(255,255,255,0.14)', duration: 0.08 }, 3.44)
      tl.to($.menu, { autoAlpha: 0, y: -8, blur: 6, duration: 0.18 }, 3.6)

      // Section 3 — the collection rises and the card lands in it
      tl.to(p, { rise: 1, duration: 0.95 }, 3.42)
      tl.to(p, { land: 1, duration: 0.7 }, 3.68)
      echoIn(tl, $.head3, 3.72)
      tl.fromTo($.para3, { autoAlpha: 0, yPercent: 40 }, { autoAlpha: 1, yPercent: 0, duration: 0.4, ease: 'power2.out' }, 3.92)
      tl.to(p, { gridIn: 1, duration: 0.65 }, 3.95)

      // Collection scrolls away; the featured card stays and moves into focus
      tl.to(p, { scroll: 1, duration: 1.45 }, 5.15)
      echoOut(tl, $.head3, 5.15, { dist: 80 })
      tl.to($.para3, { autoAlpha: 0, y: -L.H * 0.12, duration: 0.45, ease: 'power1.in' }, 5.15)
      tl.to(p, { dim: 1, duration: 0.9 }, 5.55)
      tl.to(p, { pop: 1, duration: 1.15 }, 5.55)

      // Section 4 — detail scan + tags
      tl.fromTo($.scan, { yPercent: 101, autoAlpha: 1 }, { yPercent: 0, duration: 0.42, ease: 'power2.out' }, 6.72)
      if (rich) tl.fromTo($.featImg, { filter: 'brightness(1) saturate(1)' }, { filter: 'brightness(1.22) saturate(0.75)', duration: 0.35 }, 6.75)
      tl.fromTo($.dots, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.15, ease: 'back.out(2)' }, 7.0)
      echoIn(tl, $.head4, 7.1)
      tl.fromTo($.para4, { autoAlpha: 0, yPercent: 30 }, { autoAlpha: 1, yPercent: 0, duration: 0.4, ease: 'power2.out' }, 7.35)
      tl.to($.scan, { autoAlpha: 0, duration: 0.3 }, 7.35)
      if (rich) tl.to($.featImg, { filter: 'brightness(1) saturate(1)', duration: 0.35 }, 7.4)
      tl.fromTo(
        $.tags.children,
        { autoAlpha: 0, scale: 0.7, y: 10 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.28, stagger: 0.09, ease: 'back.out(2.2)' },
        7.38,
      )
      tl.to($.dots, { autoAlpha: 0, duration: 0.15 }, 7.85)
      tl.to({}, { duration: 0.01 }, UNITS - 0.01)

      render()
    }, stage)
    return () => ctx.revert()
  }, [L, sharedBase])

  const set = (k) => (el) => (r.current[k] = el)
  const headCls = 'serif-head text-glow text-[clamp(34px,4.15vw,74px)]'
  const ghostCount = 2

  return (
    <section
      id="work"
      ref={wrap}
      aria-label="Selected work"
      className="pointer-events-none relative"
      // Overlaps the hero by one screen so its stage pins exactly as the hero's releases.
      style={{ height: `calc(100lvh + ${Math.round(UNITS * unit)}px)`, marginTop: '-100lvh' }}
    >
      <div className="sticky top-0 h-lvh w-full overflow-hidden">
        <div ref={stage} className="absolute left-0 top-0" style={{ width: L.W, height: L.H }}>
          {/* Section 2: scattered cards */}
          {L.scatter.map((c, i) =>
            c.id === SHARED_ID ? null : (
              <div
                key={c.id || 'quote'}
                ref={(el) => (outer.current[i] = el)}
                className="absolute will-change-transform"
                style={{ left: c.r.x, top: c.r.y, width: c.r.w, height: c.quote ? 'auto' : c.r.h }}
              >
                <div ref={(el) => (inner.current[i] = el)} className="h-full w-full" style={{ visibility: 'hidden' }}>
                  {c.quote ? (
                    <figure className="glass relative rounded-[6px] px-6 pb-9 pt-6 text-center">
                      <blockquote className="text-[clamp(11px,1.1vw,16px)] font-semibold leading-snug">
                        “Design is intelligence made visible.”
                      </blockquote>
                      <figcaption className="mt-1 text-[11px] text-muted">— Alina Wheeler</figcaption>
                      <span className="absolute bottom-2.5 right-2.5 grid size-[18px] place-items-center rounded-[5px] bg-fg text-bg">
                        <Quote className="size-[10px]" />
                      </span>
                    </figure>
                  ) : (
                    <Card work={c.work} icon={c.icon} size={c.r.w} eager />
                  )}
                </div>
              </div>
            ),
          )}

          {/* Section 2 copy */}
          <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center px-6 text-center" style={{ top: L.H * (L.wide ? 0.4 : 0.42) }}>
            <div className="relative w-full">
              <div className="flex flex-col items-center">
                <Echo ref={set('headA')} className={headCls}>
                  Visuals that bring
                  <br />
                  brands to life
                </Echo>
                <p ref={set('subA')} className="soft-glow mt-4 flex items-center gap-2 text-[clamp(13px,1.25vw,19px)] font-semibold" style={{ visibility: 'hidden' }}>
                  One designer for <WordPill words={mediums} interval={2300} />
                </p>
              </div>
              <div className="absolute inset-x-0 top-0 flex flex-col items-center">
                <Echo className={headCls} ref={set('headB')}>
                  Designed for every
                  <br />
                  screen &amp; surface
                </Echo>
                <div ref={set('subB')} className="mt-4 flex items-center gap-2 text-[12px] font-semibold sm:text-[clamp(12px,1vw,16px)]">
                  {[
                    [Instagram, 'Social'],
                    [Printer, 'Print'],
                    [Box, 'Packaging'],
                  ].map(([Icon, label]) => (
                    <span key={label} className="flex items-center gap-[0.45em] rounded-[0.6em] border border-fg/25 bg-panel px-[0.65em] py-[0.3em]" style={{ visibility: 'hidden' }}>
                      <span className="grid size-[1.35em] place-items-center rounded-full bg-fg text-bg">
                        <Icon className="size-[0.8em]" />
                      </span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: collection panel */}
          <div ref={set('panel')} className="absolute left-0 top-0 h-0 w-full will-change-transform">
            <div
              ref={set('panelBg')}
              className="absolute rounded-[18px] border border-line bg-panel-solid"
              style={{ left: L.panel.x, top: L.panel.y, width: L.panel.w, height: L.panel.h }}
            />
            <div className="absolute flex flex-col items-center text-center" style={{ left: L.panel.x, top: L.panel.y + 26, width: L.panel.w }}>
              <h3 className="serif-head text-[clamp(22px,2.3vw,36px)]">Selected Works</h3>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
                {works.length} designs · By {site.name}
                <span className="grid size-3 place-items-center rounded-full bg-sky-500 text-[8px] text-white">✓</span>
              </p>
              <span className="mt-2.5 grid size-7 place-items-center rounded-full bg-gradient-to-br from-amber-200 via-rose-300 to-violet-400 text-[10px] font-bold text-black">
                SA
              </span>
              <span className="btn-glow mt-2.5 rounded-[8px] px-3.5 py-1 text-[11px] font-semibold">View all</span>
            </div>
            {L.grid.map((g, i) =>
              g.id === SHARED_ID || g.id === FEATURED_ID ? null : (
                <div
                  key={g.id}
                  ref={(el) => (gridEls.current[i] = el)}
                  className="absolute"
                  style={{ left: g.r.x, top: g.r.y, width: g.r.w, height: g.r.h, opacity: 0 }}
                >
                  <Card work={g.work} icon={g.work.tag === 'Packaging' ? 'box' : g.i % 3 === 1 ? 'print' : 'ig'} size={g.r.w} />
                </div>
              ),
            )}
          </div>

          {/* Section 3 copy */}
          <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center px-6 text-center" style={{ top: L.H * (L.wide ? 0.17 : 0.1) }}>
            <Echo className={headCls} ref={set('head3')}>
              Curated by brand
            </Echo>
            <p ref={set('para3')} className="mt-3 max-w-[min(520px,36vw)] max-[900px]:max-w-[440px] text-[clamp(12px,1.1vw,17px)] font-medium leading-snug text-fg/80" style={{ visibility: 'hidden' }}>
              Every client gets a cohesive visual system — campaigns that feel connected, from the first post to the last print.
            </p>
          </div>

          {/* Shared card (+ echo ghosts) */}
          {Array.from({ length: ghostCount }, (_, k) => (
            <div
              key={k}
              ref={(el) => {
                r.current.sharedGhosts = r.current.sharedGhosts || []
                r.current.sharedGhosts[k] = el
              }}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 origin-top-left overflow-hidden rounded-[3px] will-change-transform"
              style={{ width: sharedBase, height: sharedBase / shared.ratio, opacity: 0 }}
            >
              <img src={shared.sm} srcSet={shared.srcSet} sizes={`${Math.round(sharedBase)}px`} alt="" className="h-full w-full object-cover opacity-80 brightness-125" />
            </div>
          ))}
          <div
            ref={set('shared')}
            className="absolute left-0 top-0 origin-top-left will-change-transform"
            style={{ width: sharedBase, height: sharedBase / shared.ratio }}
          >
            <div ref={(el) => (inner.current[L.scatter.findIndex((c) => c.id === SHARED_ID)] = el)} className="h-full w-full" style={{ visibility: 'hidden' }}>
              <Card work={shared} icon="ig" size={sharedBase} eager />
            </div>
          </div>

          {/* Context menu next to the picked-up card */}
          <div
            ref={set('menu')}
            className="glass absolute w-[168px] rounded-[10px] p-1 text-[11.5px] font-medium shadow-2xl"
            style={{ left: L.menu.x, top: L.menu.y, visibility: 'hidden' }}
            aria-hidden="true"
          >
            <div className="rounded-[6px] px-2.5 py-1.5 text-fg/75">Open design</div>
            <div className="rounded-[6px] px-2.5 py-1.5 text-fg/75">Copy link</div>
            <div className="mx-2 my-0.5 h-px bg-line" />
            <div ref={set('menuPick')} className="flex items-center gap-2 rounded-[6px] px-2.5 py-1.5">
              <Sparkle className="size-3" /> Save to collection
            </div>
          </div>

          {/* Featured card (section 3 -> 4) */}
          <div
            ref={set('feat')}
            className="absolute left-0 top-0 origin-top-left will-change-transform"
            style={{ width: L.featured.w, height: L.featured.h, opacity: 0 }}
          >
            <div className="card-shadow relative h-full w-full overflow-hidden rounded-[4px]">
              <img
                ref={set('featImg')}
                src={feat.lg}
                alt={`${feat.title} — ${feat.client}`}
                width={feat.w}
                height={feat.h}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div ref={set('scan')} className="fx-glass-light absolute inset-x-0 bottom-0 h-[34%] bg-white/35 backdrop-blur-md" style={{ visibility: 'hidden' }} />
              <div
                ref={set('dots')}
                className="absolute bottom-[6%] right-[6%] flex gap-1 rounded-full bg-white/80 px-2 py-1.5"
                style={{ visibility: 'hidden' }}
              >
                {[0, 1, 2, 3].map((d) => (
                  <span key={d} className="size-1.5 animate-pulse rounded-full bg-black/70" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Detail tags around the featured card */}
          <div
            ref={set('tags')}
            className="pointer-events-none absolute"
            style={{ left: L.featured.x, top: L.featured.y, width: L.featured.w, height: L.featured.h }}
          >
            {tags.map((t) => (
              <span
                key={t.label}
                className="glass absolute flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%`, visibility: 'hidden' }}
              >
                <Sparkle className="size-2.5" />
                {t.label}
              </span>
            ))}
          </div>

          {/* Section 4 copy */}
          <div
            className="pointer-events-none absolute"
            style={{ left: L.detailText.x, top: L.detailText.y, width: L.detailText.w, textAlign: L.detailText.align }}
          >
            <Echo className={`${headCls} ${L.wide ? '' : 'mx-auto'}`} ref={set('head4')}>
              Every detail,
              <br />
              considered
            </Echo>
            <p
              ref={set('para4')}
              className={`mt-3 max-w-[max(330px,26vw)] text-[clamp(12px,1.1vw,17px)] font-medium leading-snug text-fg/80 ${L.wide ? '' : 'mx-auto'}`}
              style={{ visibility: 'hidden' }}
            >
              Typography, colour, layout and retouching — every element is crafted so the message lands in a single glance.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
