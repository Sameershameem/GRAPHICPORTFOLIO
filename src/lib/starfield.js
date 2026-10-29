// Slowly rotating sphere of stars drawn on a 2D canvas (or an OffscreenCanvas
// in a worker, see offscreen.js).
export class Starfield {
  constructor(canvas, { settings, color = '#fff', count = 1100 } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.settings = settings
    this.color = color
    this.rot = 0
    this.alpha = 0
    this.blank = true
    // Random order, so drawing the first N (per quality tier) is an even subset.
    this.stars = Array.from({ length: count }, () => {
      // Points on/near a sphere shell, a little denser around the equator.
      const u = Math.random() * 2 - 1
      const t = Math.random() * Math.PI * 2
      const shell = 0.75 + Math.random() * 0.35
      const s = Math.sqrt(1 - u * u)
      return {
        x: s * Math.cos(t) * shell,
        y: u * shell * 0.62,
        z: s * Math.sin(t) * shell,
        r: Math.random() < 0.1 ? 1.9 : 0.8 + Math.random() * 0.9,
        tw: Math.random() * Math.PI * 2,
      }
    })
  }

  // Canvas size in CSS pixels and the pixel ratio to draw at.
  resize(w, h, dpr) {
    // Re-allocating clears the canvas and costs time: only on real changes.
    if (w === this.w && h === this.h && dpr === this.dpr) return
    this.w = w
    this.h = h
    this.dpr = dpr
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    this.blank = true
  }

  setAlpha(a) {
    this.alpha = a
  }

  setColor(c) {
    this.color = c
  }

  setSettings(s) {
    this.settings = s
  }

  // Invisible and already cleared: nothing to draw.
  get paused() {
    return this.alpha <= 0.01 && this.blank
  }

  frame(t, dt) {
    const { ctx, w, h, dpr } = this
    this.rot += dt * 0.05
    if (!w) return
    // Invisible: clear once, then leave the canvas alone.
    if (this.alpha <= 0.01) {
      if (!this.blank) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.blank = true
      }
      return
    }
    this.blank = false
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const R = Math.min(w * 0.34, h * 0.48)
    const cos = Math.cos(this.rot)
    const sin = Math.sin(this.rot)
    const tilt = 0.32
    const ct = Math.cos(tilt)
    const sn = Math.sin(tilt)
    ctx.fillStyle = this.color
    // Bucket stars by brightness so each bucket is a single fill call.
    const B = 5
    const buckets = this.buckets || (this.buckets = Array.from({ length: B }, () => []))
    for (const b of buckets) b.length = 0
    const count = Math.min(this.stars.length, this.settings.stars)
    for (let i = 0; i < count; i++) {
      const s = this.stars[i]
      const x = s.x * cos - s.z * sin
      let z = s.x * sin + s.z * cos
      const y = s.y * ct - z * sn
      z = s.y * sn + z * ct
      const persp = 2.4 / (2.4 + z)
      const depth = (1 - z) / 2
      const a = (0.4 + depth * 0.6) * (0.7 + 0.3 * Math.sin(t * 1.6 + s.tw))
      const r = s.r * persp
      buckets[Math.min(B - 1, Math.floor(a * B))].push(w / 2 + x * R * persp - r / 2, h * 0.44 + y * R * persp - r / 2, r)
    }
    for (let i = 0; i < B; i++) {
      const list = buckets[i]
      if (!list.length) continue
      ctx.globalAlpha = this.alpha * ((i + 0.5) / B)
      ctx.beginPath()
      for (let j = 0; j < list.length; j += 3) ctx.rect(list[j], list[j + 1], list[j + 2], list[j + 2])
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

export const create = (canvas, options) => new Starfield(canvas, options)
