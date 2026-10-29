import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, scrollToTarget } from '../lib/motion'
import { echoIn } from '../lib/echo'
import { openWork } from '../lib/lightbox'
import { works, clients } from '../data/works'
import { site } from '../data/site'
import Echo from '../components/Echo'
import { Mail, Search, Home, Plus, User, Heart, Grid, LogoDots } from '../components/Icons'

const desk = ['barkaas-lamb-chops', 'rakesh-22-karat', 'playplace-curious', 'alayham-window', 'brandsway-hiring', 'rakesh-diamonds', 'islamic-mission-school', 'barkaas-kunafa', 'gravity-neet-results', 'alayham-visa']
const phone = ['rakesh-bangles', 'barkaas-mango-sunrise', 'alayham-anywhere', 'playplace-learn-grow', 'kernello-packaging', 'brandsway-results']
const pick = (ids) => ids.map((id) => works.find((w) => w.id === id))

function Thumb({ w, className = '' }) {
  return (
    <button type="button" onClick={() => openWork(w.id)} className={`group block w-full overflow-hidden rounded-[3px] ${className}`}>
      <img
        src={w.xs}
        alt={`${w.title} — ${w.client}`}
        width={w.w}
        height={w.h}
        loading="lazy"
        decoding="async"
        className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
    </button>
  )
}

function DesktopMock() {
  return (
    <div className="card-shadow overflow-hidden rounded-[12px] border border-white/10 bg-[#101011] text-white">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/20" />
        </div>
        <LogoDots className="size-3 text-white/70" />
        <div className="mx-auto flex w-[42%] items-center gap-1.5 rounded-[6px] bg-white/[0.07] px-2 py-1 text-[8px] text-white/45">
          <Search className="size-2.5" /> Search designs
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <Plus className="size-2.5" />
          <Heart className="size-2.5" />
          <span className="size-3.5 rounded-full bg-gradient-to-br from-amber-200 via-rose-300 to-violet-400" />
        </div>
      </div>
      <div className="flex">
        <div className="flex flex-col items-center gap-3 border-r border-white/[0.06] px-2.5 py-3 text-white/45">
          <Home className="size-3" />
          <Grid className="size-3" />
          <Heart className="size-3" />
          <User className="size-3" />
        </div>
        <div className="flex-1 px-4 pb-4 pt-3">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-amber-200 via-rose-300 to-violet-400 text-[9px] font-bold text-black">SA</span>
            <p className="mt-1.5 font-serif text-[13px]">{site.name}</p>
            <p className="text-[7.5px] text-white/45">{site.role} · {works.length} designs</p>
            <span className="mt-1.5 rounded-[5px] bg-white px-2 py-[3px] text-[7.5px] font-semibold text-black">Hire me</span>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {pick(desk).map((w) => (
              <Thumb key={w.id} w={w} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneMock() {
  return (
    <div className="card-shadow rounded-[26px] border border-white/15 bg-black p-[5px] text-white">
      <div className="overflow-hidden rounded-[21px] bg-[#0f0f10]">
        <div className="flex items-center justify-between px-3 pb-1 pt-2 text-[7px] font-semibold text-white/80">
          <span>9:41</span>
          <span className="h-[11px] w-[38px] rounded-full bg-black" />
          <span>100%</span>
        </div>
        <div className="mx-2 mb-1.5 flex items-center justify-center rounded-full bg-white/[0.07] py-1 text-[7px] text-white/60">Selected Works</div>
        <div className="grid grid-cols-2 gap-1 px-1.5">
          {pick(phone).map((w) => (
            <Thumb key={w.id} w={w} />
          ))}
        </div>
        <div className="mt-1.5 flex items-center justify-around border-t border-white/[0.06] py-2 text-white/55">
          <Home className="size-3" />
          <Search className="size-3" />
          <Plus className="size-3" />
          <Heart className="size-3" />
          <User className="size-3" />
        </div>
      </div>
    </div>
  )
}

export default function Platforms() {
  const root = useRef(null)
  const head = useRef(null)
  const copy = useRef(null)
  const deskRef = useRef(null)
  const phoneRef = useRef(null)
  const brands = useRef(null)
  const brandHead = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(deskRef.current, { autoAlpha: 0, y: 140, x: 60 }, { autoAlpha: 1, y: 0, x: 0, duration: 1.3, ease: 'power3.out' }, 0)
      tl.fromTo(phoneRef.current, { autoAlpha: 0, y: 190 }, { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power3.out' }, 0.12)
      echoIn(tl, head.current, 0.3)
      tl.fromTo(copy.current.children, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }, 0.55)
      ScrollTrigger.create({ trigger: root.current, start: 'top 70%', once: true, onEnter: () => tl.play() })

      gsap.fromTo(phoneRef.current.firstChild, { y: 30 }, { y: -40, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })

      const bt = gsap.timeline({ paused: true })
      echoIn(bt, brandHead.current, 0, { dist: 80 })
      bt.fromTo(
        brands.current.children,
        { autoAlpha: 0, y: 30, blur: 6 },
        { autoAlpha: 1, y: 0, blur: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' },
        0.1,
      )
      ScrollTrigger.create({ trigger: brands.current, start: 'top 88%', once: true, onEnter: () => bt.play() })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="relative mx-auto w-full max-w-[1600px] px-5 pb-28 pt-16 md:px-10">
      <div className="flex min-h-[80svh] flex-col justify-center gap-12 lg:flex-row lg:items-center lg:gap-4">
        <div className="z-10 lg:w-[30%] lg:shrink-0">
          <Echo ref={head} className="serif-head text-glow whitespace-nowrap text-[clamp(34px,4.15vw,74px)]">
            Available for
            <br />
            new projects
          </Echo>
          <div ref={copy}>
            <p className="mt-3 max-w-[300px] text-[clamp(12px,1.1vw,17px)] font-medium text-fg/80" style={{ visibility: 'hidden' }}>
              Social, print &amp; packaging — wherever your brand lives.
            </p>
            <button
              type="button"
              onClick={() => scrollToTarget('#contact')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-[0.65em] border border-fg/60 px-[0.95em] py-[0.45em] text-[12px] font-semibold sm:text-[clamp(12px,1vw,16px)] transition-colors hover:bg-fg hover:text-bg"
              style={{ visibility: 'hidden' }}
            >
              <Mail className="size-3.5" /> Start a project
            </button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[860px] lg:max-w-none lg:flex-1">
          <div ref={deskRef} className="ml-[16%] will-change-transform lg:ml-[14%]" style={{ visibility: 'hidden' }}>
            <DesktopMock />
          </div>
          <div ref={phoneRef} className="absolute -bottom-[14%] left-0 w-[30%] will-change-transform lg:w-[24%]" style={{ visibility: 'hidden' }}>
            <PhoneMock />
          </div>
        </div>
      </div>

      <div id="clients" className="mt-24 flex flex-col items-center md:mt-28">
        <Echo ref={brandHead} as="p" className="text-center text-[12px] font-medium text-fg/75 sm:text-[clamp(12px,0.95vw,15px)]">
          Brands that trust my designs
        </Echo>
        <div ref={brands} className="mt-6 flex max-w-[1200px] flex-wrap justify-center gap-2 sm:gap-2.5">
          {clients.map((c) => (
            <div
              key={c.name}
              className="flex h-[clamp(54px,5vw,80px)] min-w-[clamp(84px,8.6vw,140px)] flex-col items-center justify-center rounded-[10px] border border-line bg-faint px-2.5 text-center sm:px-3"
              style={{ visibility: 'hidden' }}
            >
              <span className="soft-glow font-display text-[clamp(12px,1.05vw,17px)] font-extrabold leading-none tracking-[-0.02em]">{c.name}</span>
              <span className="mt-1 text-[7.5px] font-medium uppercase tracking-[0.1em] text-muted sm:text-[clamp(8px,0.62vw,10px)]">{c.note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
