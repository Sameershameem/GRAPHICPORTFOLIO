// Hero "black hole": piles of different graphics sit at fixed spots around the
// title. The top card of each pile peels off and spirals into the centre,
// shrinking into the dark, while the pile slowly advances and refills from the
// back. A departing card keeps its angle and travels in a straight line toward
// the centre at an even pace, shrinking as it recedes. Scrolling pushes every
// pile forward (the top cards go in one after another), speeds the feed up and
// smears the scene before it fades out. Canvas 2D + one texture atlas keeps it
// cheap on phones.

const DEG = Math.PI / 180
const rand = (a, b) => a + Math.random() * (b - a)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

// a: angle from the centre (deg, y down), r: distance as a fraction of the
// half-width/half-height, size: card width as a fraction of the stage width,
// off: tilt of the pile's fan away from the radial line, rot: card rotation.
const PILES_WIDE = [
  { a: 181, r: 0.84, size: 0.096, off: -28, rot: -16 }, // left, big
  { a: -17, r: 0.82, size: 0.09, off: 38, rot: 26 }, // right, big
  { a: 236, r: 0.95, size: 0.082, off: 22, rot: -22 }, // top-left, by the nav
  { a: 58, r: 0.85, size: 0.074, off: 24, rot: 16 }, // bottom-right
  { a: 115, r: 0.8, size: 0.056, off: -20, rot: -12 }, // bottom-left, far
  { a: 300, r: 0.8, size: 0.046, off: -14, rot: 18 }, // top-right, far
]

const PILES_TALL = [
  { a: 238, r: 0.86, size: 0.2, off: 22, rot: -18 }, // top-left
  { a: 302, r: 0.8, size: 0.17, off: -16, rot: 16 }, // top-right
  { a: 182, r: 1.02, size: 0.14, off: -26, rot: -14 }, // left edge
  { a: -4, r: 1.02, size: 0.14, off: 30, rot: 22 }, // right edge
  { a: 124, r: 0.86, size: 0.2, off: 18, rot: -24 }, // bottom-left
  { a: 58, r: 0.82, size: 0.18, off: -20, rot: 14 }, // bottom-right
]

export class Vortex {
  constructor(canvas, atlasImg, works, { mobile = false } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: true })
    this.atlas = atlasImg
    this.washed = this.makeWashed(atlasImg)
    this.works = works
    this.mobile = mobile
    this.perPile = mobile ? 4 : 7
    this.warp = 0
    this.lastWarp = 0
    this.vel = 0 // smoothed scroll speed, in hero-lengths per second
    this.alpha = 1
    this.intro = 1
    this.speed = 1
    this.px = 0
    this.py = 0
    this.tx = 0
    this.ty = 0
    this.queue = []
    this.items = [] // in-pile + falling cards
    this.resize()
    this.build()
  }

  makeWashed(img) {
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const x = c.getContext('2d')
    x.drawImage(img, 0, 0)
    x.globalCompositeOperation = 'source-atop'
    x.fillStyle = 'rgba(232,236,245,0.5)'
    x.fillRect(0, 0, c.width, c.height)
    return c
  }

  // Next graphic from a shuffled deck, never one already in the same pile.
  nextWork(pile) {
    const inPile = new Set(this.items.filter((c) => c.pile === pile && !c.falling).map((c) => c.work.id))
    for (let tries = 0; tries < 40; tries++) {
      if (!this.queue.length) this.queue = this.works.slice().sort(() => Math.random() - 0.5)
      const w = this.queue.pop()
      if (!inPile.has(w.id)) return w
    }
    return this.works[Math.floor(Math.random() * this.works.length)]
  }

  addCard(pile, s) {
    this.items.push({ pile, s, falling: false, f: 0, work: this.nextWork(pile), jr: rand(-5, 5) * DEG, jx: rand(-0.06, 0.06) })
  }

  build() {
    this.items = []
    this.piles.forEach((_, p) => {
      for (let k = 0; k < this.perPile; k++) this.addCard(p, k / this.perPile + 0.02)
    })
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.25 : 2)
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    this.w = w
    this.h = h
    this.dpr = dpr
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    // The title is centred in the small viewport; the hole sits right behind it.
    this.cx = w / 2
    this.cy = Math.min(h, window.innerHeight) / 2
    const wide = w / Math.min(h, window.innerHeight) >= 0.9
    const layout = wide ? PILES_WIDE : PILES_TALL
    const hw = w / 2
    const hh = this.cy
    const prevCount = this.piles?.length
    this.piles = layout.map((p) => {
      const ang = p.a * DEG
      const x = this.cx + Math.cos(ang) * p.r * hw
      const y = this.cy + Math.sin(ang) * p.r * hh
      const size = p.size * w
      // Fan direction: outward from the hole, tilted a little per pile.
      const out = Math.atan2(y - this.cy, x - this.cx) + p.off * DEG
      return { x, y, size, ux: Math.cos(out), uy: Math.sin(out), rot: p.rot * DEG, spread: size * 0.95 }
    })
    if (prevCount !== undefined && prevCount !== this.piles.length) this.build()
  }

  pointer(nx, ny) {
    this.tx = nx
    this.ty = ny
  }

  update(dt) {
    dt = Math.min(dt, 0.05)
    this.intro = Math.max(0, this.intro - dt * 0.9)
    this.px += (this.tx - this.px) * 0.05
    this.py += (this.ty - this.py) * 0.05
    // Idle: a card leaves each pile roughly every 0.8s. Scroll: every pile is
    // pushed forward by the distance scrolled and the whole feed speeds up.
    const dw = Math.max(0, this.warp - this.lastWarp)
    this.lastWarp = this.warp
    this.vel += (dw / Math.max(dt, 0.001) - this.vel) * Math.min(1, dt * 8)
    const boost = 1 + Math.min(2.5, this.vel * 1.6)
    const feed = (1 / (0.8 * this.perPile)) * this.speed * boost
    const push = dw * 0.65
    const fall = (1 / 1.4) * this.speed * boost
    const refill = this.warp < 0.05

    for (const c of this.items) {
      if (c.falling) {
        c.f += fall * dt
      } else {
        c.s += feed * dt + push
        if (c.s >= 1) {
          // Peel the top card off and send it into the hole from where it sits.
          const [x, y] = this.pilePos(c)
          c.falling = true
          c.f = 0
          c.x0 = x
          c.y0 = y
          c.r0 = this.piles[c.pile].rot + c.jr
          c.size0 = this.piles[c.pile].size
        }
      }
    }
    this.items = this.items.filter((c) => !c.falling || c.f < 1)

    if (refill) {
      const gap = 1 / this.perPile
      this.piles.forEach((_, p) => {
        let back = Infinity
        let count = 0
        for (const c of this.items) if (c.pile === p && !c.falling) (back = Math.min(back, c.s)), count++
        if (count === 0) this.addCard(p, 0)
        else if (back >= gap && count < this.perPile) this.addCard(p, back - gap)
      })
    }
  }

  pilePos(c) {
    const P = this.piles[c.pile]
    const t = 0.5 - c.s // back of the pile (s=0) sits furthest from the hole
    const par = 1 + this.warp * 0.15
    return [
      P.x + P.ux * P.spread * t - P.uy * P.size * c.jx + this.px * 16 * par,
      P.y + P.uy * P.spread * t + P.ux * P.size * c.jx + this.py * 11 * par,
    ]
  }

  // Position of a falling card at progress f: a straight line toward the
  // centre at an even pace (gentle pull-away at the start), shrinking as it
  // recedes, same angle throughout; it is tiny by the time it fades out.
  fallPose(c, f) {
    f = clamp01(f)
    const e = f < 0.12 ? (f * f) / 0.24 : f - 0.06 // ease-in, then linear
    const k = 1 - e * 0.95
    return {
      x: this.cx + (c.x0 - this.cx) * k,
      y: this.cy + (c.y0 - this.cy) * k,
      size: c.size0 * Math.pow(Math.max(0, 1 - e), 0.85),
      rot: c.r0,
      a: f > 0.72 ? 1 - (f - 0.72) / 0.28 : 1,
      wash: e * 0.25,
    }
  }

  blit(img, rect, x, y, size, rot, a) {
    const [sx, sy, sw, sh] = rect
    const ratio = sw / sh
    const w = ratio >= 1 ? size * 1.12 : size
    const h = w / ratio
    const cos = Math.cos(rot)
    const sin = Math.sin(rot)
    const d = this.dpr
    this.ctx.setTransform(cos * d, sin * d, -sin * d, cos * d, x * d, y * d)
    this.ctx.globalAlpha = a
    this.ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h)
  }

  draw() {
    const { ctx } = this
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.alpha <= 0.002) return

    // Depth order: deep falling cards first, then piles back-to-front, with a
    // card that has only just peeled off still riding on top of its pile.
    const list = this.items
      .map((c) => ({ c, z: c.falling ? 1.25 - c.f * 2.6 : c.s }))
      .sort((a, b) => a.z - b.z)

    // Moving cards leave a faint smear; while scrolling every card smears
    // toward the hole, like the reference's motion blur.
    const trail = this.mobile ? 1 : 2
    const blur = this.mobile ? 2 : 4
    const smear = Math.min(1, this.vel * 1.6)
    for (const { c } of list) {
      let x, y, size, rot, a, wash
      const pileIn = clamp01((1 - this.intro) * 2.2 - c.pile * 0.12)
      if (c.falling) {
        ;({ x, y, size, rot, a, wash } = this.fallPose(c, c.f))
        const lag = 0.03 + smear * 0.06
        for (let k = trail; k >= 1; k--) {
          const g = this.fallPose(c, c.f - k * lag)
          const ga = g.a * this.alpha * pileIn * (0.16 + smear * 0.2) * (1 - k / (trail + 1)) * Math.min(1, c.f * 8)
          if (ga > 0.01 && g.size > 1.2) this.blit(this.washed, c.work.rect, g.x, g.y, g.size, g.rot, ga)
        }
      } else {
        ;[x, y] = this.pilePos(c)
        size = this.piles[c.pile].size
        rot = this.piles[c.pile].rot + c.jr
        a = clamp01(c.s * this.perPile * 1.4) * (0.62 + 0.38 * c.s)
        wash = (1 - c.s) * 0.55
        if (smear > 0.05) {
          // Closely spaced faint copies read as motion blur toward the hole.
          for (let k = blur; k >= 1; k--) {
            const m = 1 - (k * 0.08 * smear) / blur
            const ga = a * this.alpha * pileIn * 0.28 * smear * (1 - k / (blur + 1))
            if (ga > 0.01) this.blit(this.washed, c.work.rect, this.cx + (x - this.cx) * m, this.cy + (y - this.cy) * m, size * (1 - (k * 0.06 * smear) / blur), rot, ga)
          }
        }
      }
      a *= this.alpha * pileIn
      if (a < 0.01 || size < 1.2) continue
      if (this.mobile) {
        // One draw per card on phones: back cards use the pre-washed copy.
        this.blit(wash > 0.3 ? this.washed : this.atlas, c.work.rect, x, y, size, rot, a)
      } else {
        this.blit(this.atlas, c.work.rect, x, y, size, rot, a)
        if (wash > 0.04) this.blit(this.washed, c.work.rect, x, y, size, rot, a * wash)
      }
    }
    ctx.globalAlpha = 1
  }
}
