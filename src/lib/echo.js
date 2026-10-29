// "Echo" text: a headline plus a few ghost copies that trail behind it while it
// moves, the motion-smear look used for every heading swap. That look needs
// blur, which only shows where it's cheap (the blur tween in motion.js); on
// lighter tiers the copies are hidden (index.css) and swaps are sequenced so an
// outgoing and incoming headline never overlap as sharp text.
import { quality } from './perf'

const PEAKS = [0.42, 0.26, 0.14]

function layers(el) {
  const [main, ...ghosts] = el.children
  return { main, ghosts }
}

export function echoIn(tl, el, at = 0, { dur = 0.7, dist = 55, lag = 0.07 } = {}) {
  if (!el) return tl
  const { main, ghosts } = layers(el)
  if (quality.tier === 'high') {
    tl.fromTo(main, { yPercent: dist, autoAlpha: 0, blur: 10 }, { yPercent: 0, autoAlpha: 1, blur: 0, duration: dur, ease: 'power3.out' }, at)
  } else {
    // Fade in only once an outgoing headline (echoOut) has gone.
    tl.fromTo(main, { yPercent: dist }, { yPercent: 0, duration: dur, ease: 'power3.out' }, at)
    tl.fromTo(main, { autoAlpha: 0 }, { autoAlpha: 1, duration: dur * 0.6, ease: 'power1.inOut' }, at + dur * 0.3)
  }
  ghosts.forEach((g, i) => {
    const d = at + (i + 1) * lag
    tl.fromTo(g, { yPercent: dist * (1 + (i + 1) * 0.35) }, { yPercent: 0, duration: dur, ease: 'power3.out' }, d)
    tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: PEAKS[i] ?? 0.1, duration: dur * 0.25, ease: 'none' }, d)
    tl.to(g, { autoAlpha: 0, duration: dur * 0.6, ease: 'power1.in' }, d + dur * 0.3)
  })
  return tl
}

export function echoOut(tl, el, at = 0, { dur = 0.6, dist = 55, lag = 0.06 } = {}) {
  if (!el) return tl
  const { main, ghosts } = layers(el)
  if (quality.tier === 'high') tl.to(main, { yPercent: -dist, autoAlpha: 0, blur: 10, duration: dur, ease: 'power2.in' }, at)
  else {
    tl.to(main, { yPercent: -dist, duration: dur, ease: 'power2.in' }, at)
    tl.to(main, { autoAlpha: 0, duration: dur * 0.45, ease: 'power1.in' }, at)
  }
  ghosts.forEach((g, i) => {
    const d = at + (i + 1) * lag
    tl.fromTo(g, { yPercent: 0 }, { yPercent: -dist * (1 - (i + 1) * 0.22), duration: dur, ease: 'power2.in', immediateRender: false }, d - lag)
    tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: PEAKS[i] ?? 0.1, duration: dur * 0.3, ease: 'none', immediateRender: false }, d - lag)
    tl.to(g, { autoAlpha: 0, duration: dur * 0.5, ease: 'none' }, d + dur * 0.35)
  })
  return tl
}
