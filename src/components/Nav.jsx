import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, scrollToTarget } from '../lib/motion'
import { LogoDots } from './Icons'
import { site, mailto } from '../data/site'

const links = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Clients', href: '#clients' },
]

export default function Nav() {
  const mini = useRef(null)
  const bar = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(mini.current, { autoAlpha: 0, y: -6 })
      ScrollTrigger.create({
        trigger: '#top',
        start: '45% top',
        onEnter: () => gsap.to(mini.current, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }),
        onLeaveBack: () => gsap.to(mini.current, { autoAlpha: 0, y: -6, duration: 0.3 }),
      })
      // The pill bows out on the final screen, like the reference.
      ScrollTrigger.create({
        trigger: '#contact',
        start: 'top 20%',
        onEnter: () => gsap.to(bar.current, { autoAlpha: 0, y: -14, blur: 6, duration: 0.5, ease: 'power2.in' }),
        onLeaveBack: () => gsap.to(bar.current, { autoAlpha: 1, y: 0, blur: 0, duration: 0.5, ease: 'power2.out' }),
      })
    })
    return () => ctx.revert()
  }, [])

  const go = (e, href) => {
    e.preventDefault()
    scrollToTarget(href)
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <a
        ref={mini}
        href="#top"
        onClick={(e) => go(e, 0)}
        className="pointer-events-auto absolute left-4 top-[18px] font-display text-[13px] font-extrabold tracking-[-0.02em] sm:left-5 sm:top-5 sm:text-[clamp(14px,1.15vw,18px)]"
      >
        {site.shortMark}
        <sup className="ml-px text-[0.55em]">©</sup>
      </a>
      <nav
        ref={bar}
        className="fx-glass pointer-events-auto mx-auto mt-2.5 flex w-max items-center gap-[0.15em] rounded-[1.05em] border border-line bg-panel p-[0.4em] pl-[0.75em] text-[12px] font-medium backdrop-blur-md sm:backdrop-blur-xl sm:mt-3 sm:text-[clamp(13px,1.18vw,18px)]"
      >
        <a href="#top" onClick={(e) => go(e, 0)} aria-label={`${site.name} home`} className="mr-[0.3em] grid size-[1.7em] place-items-center">
          <LogoDots className="size-[1.15em]" />
        </a>
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            onClick={(e) => go(e, l.href)}
            className={`rounded-md px-[0.5em] py-[0.3em] text-fg/80 transition-colors hover:text-fg sm:px-[0.62em] ${l.label === 'Clients' ? 'max-[400px]:hidden' : ''}`}
          >
            {l.label}
          </a>
        ))}
        <a
          href={mailto}
          className="ml-[0.3em] rounded-[0.7em] border border-fg/30 px-[0.85em] py-[0.38em] font-semibold transition-colors hover:border-fg/60 max-[430px]:hidden"
        >
          Email
        </a>
        <a href="#contact" onClick={(e) => go(e, '#contact')} className="btn-glow ml-[0.3em] rounded-[0.7em] px-[1em] py-[0.45em] font-semibold">
          Hire me
        </a>
      </nav>
    </header>
  )
}
