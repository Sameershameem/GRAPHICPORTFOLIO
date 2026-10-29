import { useEffect, useRef } from 'react'
import { gsap, reducedMotion } from '../lib/motion'
import { quality } from '../lib/perf'

// Outlined pill whose word cycles while the pill smoothly resizes to fit the
// next word: a blur cross-fade where blur is cheap, otherwise a clean roll
// (old word out the top, new word in from below, never overlapping).
export default function WordPill({ words, interval = 2600, delay = 0, className = '' }) {
  const box = useRef(null)
  const a = useRef(null)
  const b = useRef(null)

  useEffect(() => {
    let i = 0
    let cur = a.current
    let next = b.current
    cur.textContent = words[0]
    gsap.set(next, { autoAlpha: 0 })
    gsap.set(box.current, { width: cur.offsetWidth })
    if (reducedMotion || words.length < 2) return

    let timer
    const step = () => {
      if (!document.hidden) {
        i = (i + 1) % words.length
        next.textContent = words[i]
        const soft = quality.tier === 'high'
        gsap.to(box.current, { width: next.offsetWidth, duration: 0.7, ease: 'power3.inOut' })
        gsap.to(cur, { autoAlpha: 0, yPercent: soft ? -30 : -100, blur: 5, duration: soft ? 0.45 : 0.35, ease: 'power2.in' })
        gsap.fromTo(
          next,
          { autoAlpha: 0, yPercent: soft ? 30 : 100, blur: 5 },
          { autoAlpha: 1, yPercent: 0, blur: 0, duration: 0.6, delay: soft ? 0.2 : 0.28, ease: 'power3.out' },
        )
        ;[cur, next] = [next, cur]
      }
      timer = setTimeout(step, interval)
    }
    timer = setTimeout(step, interval + delay)
    return () => clearTimeout(timer)
  }, [words, interval, delay])

  return (
    <span
      className={`inline-flex items-center rounded-[7px] border border-fg/35 px-[0.5em] py-[0.18em] align-middle font-semibold ${className}`}
    >
      <span ref={box} className="relative block h-[1.25em] overflow-hidden">
        <span ref={a} className="absolute left-0 top-0 whitespace-nowrap leading-[1.25em]" />
        <span ref={b} className="absolute left-0 top-0 whitespace-nowrap leading-[1.25em]" aria-hidden="true" />
      </span>
    </span>
  )
}
