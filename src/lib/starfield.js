// Slowly rotating sphere of stars drawn on a 2D canvas.
export class Starfield {
  constructor(canvas, { count = 700, mobile = false } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.mobile = mobile
    this.rot = 0
    this.alpha = 0
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
    this.resize()
  }

  refreshColor() {
    this.color = getComputedStyle(this.canvas).color
  }

  resize() {
    this.refreshColor()
    const dpr = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.25 : 2)
    this.w = this.canvas.clientWidth
    this.h = this.canvas.clientHeight
    this.dpr = dpr
    this.canvas.width = Math.round(this.w * dpr)
    this.canvas.height = Math.round(this.h * dpr)
  }

  frame(dt, t) {
    const { ctx, w, h, dpr } = this
    this.rot += dt * 0.05
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    if (this.alpha <= 0.01) return
    const R = Math.min(w * 0.34, h * 0.48)
    const cos = Math.cos(this.rot)
    const sin = Math.sin(this.rot)
    const tilt = 0.32
    const ct = Math.cos(tilt)
    const sn = Math.sin(tilt)
    ctx.fillStyle = this.color || '#fff'
    // Bucket stars by brightness so each bucket is a single fill call.
    const B = 5
    const buckets = this.buckets || (this.buckets = Array.from({ length: B }, () => []))
    for (const b of buckets) b.length = 0
    for (const s of this.stars) {
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
