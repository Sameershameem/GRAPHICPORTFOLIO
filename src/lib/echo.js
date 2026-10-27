// "Echo" text: a headline plus a few ghost copies that trail behind it while it
// moves, the motion-smear look used for every heading swap.
const PEAKS = [0.42, 0.26, 0.14]

function layers(el) {
  const [main, ...ghosts] = el.children
  return { main, ghosts }
}

export function echoIn(tl, el, at = 0, { dur = 0.7, dist = 55, lag = 0.07, blur = true } = {}) {
  if (!el) return tl
  const { main, ghosts } = layers(el)
  tl.fromTo(
    main,
    { yPercent: dist, autoAlpha: 0, filter: blur ? 'blur(10px)' : 'none' },
    { yPercent: 0, autoAlpha: 1, filter: 'blur(0px)', duration: dur, ease: 'power3.out' },
    at,
  )
  ghosts.forEach((g, i) => {
    const d = at + (i + 1) * lag
    tl.fromTo(g, { yPercent: dist * (1 + (i + 1) * 0.35) }, { yPercent: 0, duration: dur, ease: 'power3.out' }, d)
    tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: PEAKS[i] ?? 0.1, duration: dur * 0.25, ease: 'none' }, d)
    tl.to(g, { autoAlpha: 0, duration: dur * 0.6, ease: 'power1.in' }, d + dur * 0.3)
  })
  return tl
}

export function echoOut(tl, el, at = 0, { dur = 0.6, dist = 55, lag = 0.06, blur = true } = {}) {
  if (!el) return tl
  const { main, ghosts } = layers(el)
  tl.to(
    main,
    { yPercent: -dist, autoAlpha: 0, filter: blur ? 'blur(10px)' : 'none', duration: dur, ease: 'power2.in' },
    at,
  )
  ghosts.forEach((g, i) => {
    const d = at + (i + 1) * lag
    tl.fromTo(g, { yPercent: 0 }, { yPercent: -dist * (1 - (i + 1) * 0.22), duration: dur, ease: 'power2.in', immediateRender: false }, d - lag)
    tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: PEAKS[i] ?? 0.1, duration: dur * 0.3, ease: 'none', immediateRender: false }, d - lag)
    tl.to(g, { autoAlpha: 0, duration: dur * 0.5, ease: 'none' }, d + dur * 0.35)
  })
  return tl
}
