import { isTouch } from './motion'
import { frameMeter } from './offscreen'

// Rendering quality, so the site stays smooth from desktops to budget phones.
//
// A tier is guessed up front from the hardware, then lowered at runtime if the
// page can't hold a smooth frame rate on this device. Canvases read their
// settings from here; CSS and the blur tween (motion.js) read
// html[data-quality]: no blur or frosted glass below 'high', since those are
// re-rendered every frame while anything behind them moves.
const SETTINGS = {
  // dpr: canvas resolution cap. filters: CSS filters are cheap here (image
  // highlights). ghosts: motion-smear copies in the hero (piled cards /
  // departing cards). stars: starfield size. rocks*: the closing 3D scene.
  high: { dpr: 2, filters: true, pileGhosts: 1, departGhosts: 2, stars: 1100, rocksDpr: 2, rocksAA: true, rocksDetail: 5, rocksFps: 60 },
  mid: { dpr: 1.25, filters: false, pileGhosts: 0, departGhosts: 1, stars: 420, rocksDpr: 1.25, rocksAA: false, rocksDetail: 4, rocksFps: 60 },
  low: { dpr: 1, filters: false, pileGhosts: 0, departGhosts: 0, stars: 300, rocksDpr: 0.9, rocksAA: false, rocksDetail: 3, rocksFps: 30 },
}
const ORDER = ['low', 'mid', 'high']

function guess() {
  if (typeof navigator === 'undefined') return 'high'
  const mem = navigator.deviceMemory // GB, Chromium only
  const cores = navigator.hardwareConcurrency
  if (navigator.connection?.saveData) return 'low'
  if ((mem && mem <= 2) || (cores && cores <= 2)) return 'low'
  if (isTouch) return mem && mem <= 3 ? 'low' : 'mid'
  return 'high'
}

// ?quality=low|mid|high pins a tier (handy for testing on a device).
const param = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('quality') : null
const pinned = SETTINGS[param] ? param : null

let tier = pinned || guess()
const listeners = new Set()
if (typeof document !== 'undefined') document.documentElement.dataset.quality = tier

export const quality = {
  get tier() {
    return tier
  },
  get s() {
    return SETTINGS[tier]
  },
}

export function onQualityChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Steps the tier down. Also called when a canvas worker reports it can't keep up.
export function reportSlow() {
  const i = ORDER.indexOf(tier)
  if (pinned || i <= 0) return
  tier = ORDER[i - 1]
  document.documentElement.dataset.quality = tier
  listeners.forEach((fn) => fn(tier))
}

// Watches the page's real frame times and steps the tier down when frames
// stay slow (see frameMeter). Ignores the first seconds of loading and hidden tabs.
let metering = false
export function startFrameMeter() {
  if (metering || pinned) return
  metering = true
  const meter = frameMeter(reportSlow)
  const t0 = performance.now()
  let last = 0
  const tick = (now) => {
    if (tier === 'low') return
    requestAnimationFrame(tick)
    if (document.hidden) {
      last = 0
      return
    }
    if (last && now - t0 > 3000) meter(now - last)
    last = now
  }
  requestAnimationFrame(tick)
}
