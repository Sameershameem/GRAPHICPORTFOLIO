// Heading swaps: the headline slides in from below and out the top, softened
// with blur where that's cheap (the blur tween in motion.js). An outgoing
// headline fades out before an incoming one fades in, so two headlines never
// show on top of each other, even if a scroll stops mid-swap.

export function echoIn(tl, el, at = 0, { dur = 0.7, dist = 55 } = {}) {
  const main = el?.firstElementChild
  if (!main) return tl
  tl.fromTo(main, { yPercent: dist, blur: 10 }, { yPercent: 0, blur: 0, duration: dur, ease: 'power3.out' }, at)
  // Fade in only once an outgoing headline (echoOut) has gone.
  tl.fromTo(main, { autoAlpha: 0 }, { autoAlpha: 1, duration: dur * 0.6, ease: 'power1.inOut' }, at + dur * 0.3)
  return tl
}

export function echoOut(tl, el, at = 0, { dur = 0.6, dist = 55 } = {}) {
  const main = el?.firstElementChild
  if (!main) return tl
  tl.to(main, { yPercent: -dist, blur: 10, duration: dur, ease: 'power2.in' }, at)
  tl.to(main, { autoAlpha: 0, duration: dur * 0.45, ease: 'power1.in' }, at)
  return tl
}
