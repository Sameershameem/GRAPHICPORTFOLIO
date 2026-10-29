import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, scroller } from '../lib/motion'
import { works } from '../data/works'

export default function Lightbox() {
  const [index, setIndex] = useState(-1)
  const box = useRef(null)
  const img = useRef(null)
  const touch = useRef(null)
  const open = index >= 0
  const work = open ? works[index] : null

  const close = useCallback(() => {
    if (!box.current) return setIndex(-1)
    gsap.to(box.current, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', onComplete: () => setIndex(-1) })
  }, [])
  const step = useCallback((d) => setIndex((i) => (i + d + works.length) % works.length), [])

  useEffect(() => {
    const onOpen = (e) => setIndex(works.findIndex((w) => w.id === e.detail))
    window.addEventListener('open-work', onOpen)
    return () => window.removeEventListener('open-work', onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    scroller.lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    gsap.fromTo(box.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' })
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      scroller.lenis?.start()
    }
  }, [open, close, step])

  useEffect(() => {
    if (open && img.current) {
      gsap.fromTo(
        img.current,
        { autoAlpha: 0, scale: 0.96, blur: 8 },
        { autoAlpha: 1, scale: 1, blur: 0, duration: 0.5, ease: 'power3.out' },
      )
    }
  }, [index, open])

  if (!open) return null
  return (
    <div
      ref={box}
      role="dialog"
      aria-modal="true"
      aria-label={`${work.title} — ${work.client}`}
      className="fx-glass-dark fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 px-4 py-16 text-white backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && close()}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0)
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
      }}
    >
      <img
        ref={img}
        key={work.id}
        src={work.lg}
        alt={`${work.title} — ${work.client}`}
        width={work.w}
        height={work.h}
        className="max-h-[78svh] w-auto max-w-full rounded-[4px] object-contain shadow-2xl"
      />
      <div className="mt-4 text-center">
        <p className="font-serif text-[20px] leading-tight">{work.title}</p>
        <p className="mt-0.5 text-[12px] text-white/55">
          {work.client} · {work.tag}
        </p>
      </div>
      <button type="button" onClick={close} className="absolute right-4 top-4 rounded-full border border-white/20 px-3 py-1 text-[12px] font-semibold hover:bg-white hover:text-black">
        Close
      </button>
      <button type="button" aria-label="Previous design" onClick={() => step(-1)} className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-lg hover:bg-white hover:text-black sm:grid">
        ‹
      </button>
      <button type="button" aria-label="Next design" onClick={() => step(1)} className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-lg hover:bg-white hover:text-black sm:grid">
        ›
      </button>
      <p className="absolute bottom-4 text-[11px] text-white/45">
        {index + 1} / {works.length}
      </p>
    </div>
  )
}
