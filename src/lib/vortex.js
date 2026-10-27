// Hero "black hole", rebuilt from frame-by-frame measurements of the reference.
//
// Every card lives on one smooth flow line. It fades in at the back of its
// pile, creeps slowly along the pile (the left pile runs down and curls out
// to the right in a C, the right pile runs up and curls left), then peels off
// the front and falls into the dark beside the title: accelerating, shrinking
// in perspective and turning slightly, until it vanishes at the edge of the
// title block. All piles release a card at the same instant, every PERIOD
// seconds, which gives the whole field one calm, shared rhythm.
//
// Everything is a pure function of one flow clock, so motion is continuous by
// construction. Scrolling only speeds that clock up (and pulls the field in a
// little), exactly like the reference.

const DEG = Math.PI / 180
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
// Small deterministic hash -> [0, 1)
const hash = (a, b) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return s - Math.floor(s)
}

// Measured timing
const PERIOD = 0.933 // every pile releases a card this often (s)
const DEPART = 1.1 // from leaving the pile to vanishing (s)
const SHRINK = 0.9 // a departing card ends at 10% of its size (linear in time)
const DEPART_TURN = -6 // a departing card turns slightly counter-clockwise (deg)

// Reference title block (wordmark + subtitle) in page units; vanish points are
// stored relative to it so they hug whatever title is on the page.
const REF_BLOCK = { x: 0.3, y: 0.4, w: 0.39, h: 0.2 }

// Flow lines in page units (x: fraction of width, y: fraction of visible
// height). path: card centre from the back of the pile to its front.
// vanish: [u, v] in title-block units. n: cards spread along the pile.
// rot: card angle at the back / front (deg, + = clockwise). size: card width
// as a fraction of page width. top: which end of the pile is drawn on top.
const WIDE = [
  {
    // left: down the pile, then a C curling out to the right
    path: [[0.146, 0.468], [0.15, 0.56], [0.162, 0.64], [0.19, 0.684], [0.226, 0.672]],
    vanish: [0.185, 1.02],
    n: 7,
    rot: [-3, -30],
    size: 0.082,
    top: 'old',
  },
  {
    // right: up the pile, then curling left toward the (c)
    path: [[0.862, 0.56], [0.858, 0.485], [0.851, 0.42], [0.838, 0.37], [0.812, 0.345], [0.782, 0.352]],
    vanish: [0.936, 0.1],
    n: 7,
    rot: [40, 34],
    size: 0.072,
    top: 'new',
  },
  {
    // top-left, sliding in from above the page
    path: [[0.205, -0.13], [0.236, 0.02], [0.268, 0.117], [0.3, 0.207]],
    vanish: [0.28, -0.05],
    n: 4,
    rot: [11, 22],
    size: 0.066,
    top: 'old',
  },
  {
    // top centre, dropping out from behind the nav bar
    path: [[0.558, -0.06], [0.551, 0.06]],
    vanish: [0.57, -0.5],
    n: 2,
    rot: [0, 0],
    size: 0.04,
    top: 'old',
  },
  {
    // bottom-right, rising in from below the page
    path: [[0.787, 1.15], [0.763, 1.02], [0.732, 0.915], [0.7, 0.835]],
    vanish: [0.756, 1.3],
    n: 3,
    rot: [-6, -18],
    size: 0.068,
    top: 'old',
  },
  {
    // bottom centre, rising in from below the page
    path: [[0.438, 1.11], [0.449, 0.935]],
    vanish: [0.456, 1.675],
    n: 2,
    rot: [16, 10],
    size: 0.06,
    top: 'old',
  },
]

// Phones and tall screens: the same flows arranged around the two-line title.
const TALL = [
  {
    // top-left: down, curling right under itself
    path: [[0.13, 0.04], [0.14, 0.12], [0.16, 0.2], [0.21, 0.255], [0.27, 0.262]],
    vanish: [0.2, -0.1],
    n: 7,
    rot: [-3, -24],
    size: 0.2,
    top: 'old',
  },
  {
    // top-right: up, curling left
    path: [[0.9, 0.31], [0.89, 0.23], [0.87, 0.15], [0.82, 0.1], [0.76, 0.1]],
    vanish: [0.82, -0.25],
    n: 7,
    rot: [40, 20],
    size: 0.19,
    top: 'new',
  },
  {
    // bottom-left, rising from below the page
    path: [[0.16, 1.1], [0.19, 0.96], [0.23, 0.84], [0.27, 0.76]],
    vanish: [0.25, 1.25],
    n: 4,
    rot: [-8, -18],
    size: 0.2,
    top: 'old',
  },
  {
    // bottom-right, rising from below the page
    path: [[0.86, 1.1], [0.83, 0.97], [0.79, 0.86], [0.74, 0.79]],
    vanish: [0.78, 1.25],
    n: 4,
    rot: [8, 18],
    size: 0.19,
    top: 'old',
  },
  {
    // left edge, mid height
    path: [[-0.12, 0.5], [0.0, 0.48], [0.07, 0.465]],
    vanish: [0.02, 0.45],
    n: 3,
    rot: [-14, -20],
    size: 0.15,
    top: 'old',
  },
  {
    // right edge, mid height
    path: [[1.12, 0.52], [1.0, 0.5], [0.93, 0.49]],
    vanish: [0.98, 0.5],
    n: 3,
    rot: [16, 22],
    size: 0.15,
    top: 'old',
  },
]

// --- geometry helpers -------------------------------------------------------

// Centripetal Catmull-Rom through points, sampled into an arc-length table.
function spline(pts, perSeg = 24) {
  const P = [pts[0].map((v, i) => 2 * v - pts[1][i]), ...pts, pts[pts.length - 1].map((v, i) => 2 * v - pts[pts.length - 2][i])]
  const out = []
  for (let s = 1; s < P.length - 2; s++) {
    const [p0, p1, p2, p3] = [P[s - 1], P[s], P[s + 1], P[s + 2]]
    const t01 = Math.pow(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), 0.5) || 1e-4
    const t12 = Math.pow(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), 0.5) || 1e-4
    const t23 = Math.pow(Math.hypot(p3[0] - p2[0], p3[1] - p2[1]), 0.5) || 1e-4
    const m1 = [0, 1].map((i) => p2[i] - p1[i] + t12 * ((p1[i] - p0[i]) / t01 - (p2[i] - p0[i]) / (t01 + t12)))
    const m2 = [0, 1].map((i) => p2[i] - p1[i] + t12 * ((p3[i] - p2[i]) / t23 - (p3[i] - p1[i]) / (t12 + t23)))
    for (let k = s === 1 ? 0 : 1; k <= perSeg; k++) {
      const t = k / perSeg
      const t2 = t * t
      const t3 = t2 * t
      const h00 = 2 * t3 - 3 * t2 + 1
      const h10 = t3 - 2 * t2 + t
      const h01 = -2 * t3 + 3 * t2
      const h11 = t3 - t2
      out.push([0, 1].map((i) => h00 * p1[i] + h10 * m1[i] + h01 * p2[i] + h11 * m2[i]))
    }
  }
  return table(out)
}

function bezier(p0, p1, p2, p3, steps = 48) {
  const out = []
  for (let k = 0; k <= steps; k++) {
    const t = k / steps
    const u = 1 - t
    out.push([0, 1].map((i) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]))
  }
  return table(out)
}

function table(pts) {
  const d = [0]
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return { pts, d, len: d[d.length - 1] }
}

// Point and unit tangent at fraction q of a table's length.
function at(tb, q) {
  const target = clamp01(q) * tb.len
  const { pts, d } = tb
  let lo = 0
  let hi = d.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (d[mid] < target) lo = mid
    else hi = mid
  }
  const seg = d[hi] - d[lo] || 1
  const t = (target - d[lo]) / seg
  const a = pts[lo]
  const b = pts[hi]
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy) || 1
  return [a[0] + dx * t, a[1] + dy * t, dx / l, dy / l]
}

// Departure progress table (fraction of the departure path vs fraction of
// DEPART). Measured in the reference: the card peels off quickly, cruises at
// about 0.7x its average speed through mid-flight, then accelerates to ~1.65x
// as it falls in (distance ~ 0.69w - 0.03w^2 + 0.34w^3). The first moments
// blend up from the pile's own creep speed so there is no jump.
function departCurve(vc, len, steps = 64) {
  const avg = len / DEPART
  const out = [0]
  let acc = 0
  for (let k = 1; k <= steps; k++) {
    const w = (k - 0.5) / steps
    const vd = (0.69 - 0.06 * w + 1.02 * w * w) * avg
    const v = vc + (vd - vc) * smooth(0, 0.12, w)
    acc += (v * DEPART) / steps
    out.push(acc)
  }
  return out.map((d) => d / acc)
}

// --- engine ------------------------------------------------------------------

export class Vortex {
  constructor(canvas, atlasImg, works, { mobile = false } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: true })
    this.src = atlasImg
    this.works = works
    this.mobile = mobile
    this.texScale = 0
    // Start mid-flow so the piles are already full on first paint.
    this.clock = 40 * PERIOD + 0.35
    this.warp = 0
    this.flow = 1 // smoothed flow-clock speed
    this.alpha = 1
    this.intro = 1
    this.speed = 1
    this.px = 0
    this.py = 0
    this.tx = 0
    this.ty = 0
    this.title = null
    this.resize()
  }

  // Card textures, pre-scaled once to about the size they are drawn at, so
  // every frame can use cheap bilinear sampling without losing sharpness.
  // atlas: the graphics. frost: the same cards heavily blurred (so each turns
  // into its own soft pastel colours), lightened and edged; it is blurry by
  // design, so it is kept at a fraction of the resolution, which is what keeps
  // the frosted piles cheap to draw on phones.
  buildTextures(scale) {
    const { src, works } = this
    const W = src.naturalWidth
    const H = src.naturalHeight
    const canvas = (w, h) => {
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(w))
      c.height = Math.max(1, Math.round(h))
      return c
    }

    const sharp = canvas(W * scale, H * scale)
    const sx = sharp.getContext('2d')
    sx.imageSmoothingQuality = 'high'
    sx.drawImage(src, 0, 0, sharp.width, sharp.height)

    const fs = Math.max(0.16, scale / 2.5)
    const frost = canvas(W * fs, H * fs)
    const fx = frost.getContext('2d')
    const tmp = canvas(2, 2)
    const tx = tmp.getContext('2d')
    fx.imageSmoothingQuality = 'high'
    for (const w of works) {
      const [x, y, cw, ch] = w.rect
      tmp.width = Math.max(2, Math.round(cw / 10))
      tmp.height = Math.max(2, Math.round(ch / 10))
      tx.imageSmoothingQuality = 'high'
      tx.drawImage(src, x, y, cw, ch, 0, 0, tmp.width, tmp.height)
      fx.drawImage(tmp, 0, 0, tmp.width, tmp.height, x * fs, y * fs, cw * fs, ch * fs)
    }
    fx.globalCompositeOperation = 'source-atop'
    fx.fillStyle = 'rgba(248,246,244,0.58)'
    fx.fillRect(0, 0, frost.width, frost.height)
    // A faint edge keeps stacked sheets readable as separate cards.
    fx.globalCompositeOperation = 'source-over'
    fx.strokeStyle = 'rgba(40,40,48,0.14)'
    fx.lineWidth = 1
    for (const w of works) {
      const [x, y, cw, ch] = w.rect
      fx.strokeRect(x * fs + 0.5, y * fs + 0.5, cw * fs - 1, ch * fs - 1)
    }

    this.atlas = { img: sharp, s: scale }
    this.frost = { img: frost, s: fs }
    this.texScale = scale
  }

  // Title block (wordmark + subtitle) in canvas pixels.
  setTitle(x, y, w, h) {
    this.title = { x, y, w, h }
    this.layout()
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
    // Resizing resets context state. Textures are pre-scaled, so the cheap
    // sampler is enough.
    this.ctx.imageSmoothingQuality = 'low'
    this.vh = Math.min(h, window.innerHeight)
    this.layout()
    // Texture resolution follows the largest card on screen (rebuilt only
    // when that changes noticeably).
    if (!this.flows) return
    const biggest = Math.max(...this.flows.map((F) => F.sizePx)) * 1.14 * 1.12 * dpr
    const need = Math.min(1, Math.max(0.3, biggest / 256))
    if (Math.abs(need - this.texScale) / need > 0.15) this.buildTextures(need)
  }

  layout() {
    const { w, vh } = this
    if (!w || !vh) return
    const tall = w / vh < 0.9
    const flows = tall ? TALL : WIDE
    const B =
      this.title ||
      (tall
        ? { x: w * 0.1, y: vh * 0.4, w: w * 0.8, h: vh * 0.14 }
        : { x: w * REF_BLOCK.x, y: vh * REF_BLOCK.y, w: w * REF_BLOCK.w, h: vh * REF_BLOCK.h })
    this.cx = B.x + B.w / 2
    this.cy = B.y + B.h / 2
    this.flows = flows.map((F, i) => {
      // Work in pixels from here on.
      const pts = F.path.map(([x, y]) => [x * w, y * vh])
      const creep = spline(pts)
      const V = [B.x + F.vanish[0] * B.w, B.y + F.vanish[1] * B.h]
      const front = pts[pts.length - 1]
      const [, , tx, ty] = at(creep, 1)
      const chord = Math.hypot(V[0] - front[0], V[1] - front[1])
      const cdx = (V[0] - front[0]) / (chord || 1)
      const cdy = (V[1] - front[1]) / (chord || 1)
      // Leave along the pile's own direction and bend smoothly toward the hole.
      const dep = bezier(
        front,
        [front[0] + tx * chord * 0.34, front[1] + ty * chord * 0.34],
        [V[0] - cdx * chord * 0.3, V[1] - cdy * chord * 0.3],
        V,
      )
      const creepTime = F.n * PERIOD
      const vc = creep.len / creepTime // px per second along the pile
      // Tall screens: cap by height too, so portrait tablets don't get oversized cards.
      const sizePx = tall ? Math.min(F.size * w, F.size * vh * 0.58) : F.size * w
      return { ...F, i, creep, dep, creepTime, gTable: departCurve(vc, dep.len), sizePx, rot0: F.rot[0] * DEG, rot1: F.rot[1] * DEG }
    })
  }

  pointer(nx, ny) {
    this.tx = nx
    this.ty = ny
  }

  update(dt) {
    dt = Math.min(dt, 0.05)
    this.intro = Math.max(0, this.intro - dt * 0.8)
    this.px += (this.tx - this.px) * Math.min(1, dt * 3)
    this.py += (this.ty - this.py) * Math.min(1, dt * 3)
    // Scrolling speeds the whole flow up (measured: x1.7 at the start of the
    // scroll, about x8 by the time the cards fade out), eased so jerky
    // scrolling still reads as smooth motion.
    const target = (1 + 12.5 * Math.pow(this.warp, 1.3)) * this.speed
    this.flow += (target - this.flow) * (1 - Math.exp(-dt * 9))
    this.clock += dt * this.flow
  }

  // Image for card k of flow i: cycles through every graphic before repeating
  // and never repeats inside one pile.
  workFor(i, k) {
    const n = this.works.length
    return this.works[(((k * 7 + i * 3) % n) + n) % n]
  }

  // Pose of card k of flow F at flow time T (null when not alive).
  pose(F, k, T) {
    const age = T - k * PERIOD
    if (age < 0) return null
    const jr = (hash(F.i, k) - 0.5) * 6 * DEG
    const jx = (hash(k, F.i + 9) - 0.5) * 0.08 * F.sizePx
    const sz = F.sizePx * (0.84 + 0.3 * hash(k + 3, F.i + 17))
    if (age < F.creepTime) {
      const u = age / F.creepTime
      const [x, y, tx, ty] = at(F.creep, u)
      return {
        x: x - ty * jx,
        y: y + tx * jx,
        size: sz,
        rot: F.rot0 + (F.rot1 - F.rot0) * smooth(0, 1, u) + jr,
        a: smooth(0, 0.55 / F.n, u),
        frost: 1 - smooth(1 - 1.9 / F.n, 1 - 0.5 / F.n, u),
        depart: 0,
      }
    }
    const w = (age - F.creepTime) / DEPART
    if (w >= 1) return null
    const gi = w * (F.gTable.length - 1)
    const g0 = Math.floor(gi)
    const g = F.gTable[g0] + (F.gTable[Math.min(g0 + 1, F.gTable.length - 1)] - F.gTable[g0]) * (gi - g0)
    const [x, y, tx, ty] = at(F.dep, g)
    return {
      x: x - ty * jx * (1 - w),
      y: y + tx * jx * (1 - w),
      size: sz * (1 - SHRINK * w),
      rot: F.rot1 + DEPART_TURN * DEG * w + jr,
      a: 1 - smooth(0.9, 1, w),
      frost: 0,
      depart: w,
    }
  }

  blit(tex, rect, x, y, size, rot, a) {
    if (a < 0.01 || size < 1) return
    const { img, s: k } = tex
    const [sx, sy, sw, sh] = rect
    const ratio = sw / sh
    const w = ratio >= 1 ? size * 1.12 : size
    const h = w / ratio
    const cos = Math.cos(rot)
    const sin = Math.sin(rot)
    const d = this.dpr
    this.ctx.setTransform(cos * d, sin * d, -sin * d, cos * d, x * d, y * d)
    this.ctx.globalAlpha = a
    this.ctx.drawImage(img, sx * k, sy * k, sw * k, sh * k, -w / 2, -h / 2, w, h)
  }

  draw() {
    const { ctx } = this
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.alpha <= 0.002 || !this.flows) return

    const T = this.clock
    // Pull toward the title while scrolling (measured ~6% by fade-out).
    const z = 1 - 0.07 * smooth(0.3, 0.75, this.warp)
    const offX = this.px * 14
    const offY = this.py * 10
    // Motion smear only when the flow is really fast (scrolling).
    const smear = clamp01((this.flow - 1.6) / 4)
    // Trailing copies: fast departing cards get more than the slower piles;
    // phones smear only the departing cards, to keep scrolling light.
    const on = smear > 0
    const pileGhosts = on && !this.mobile ? 1 : 0
    const departGhosts = on ? (this.mobile ? 1 : 2) : 0
    const frameFlow = this.flow / 60
    const place = (p) => [this.cx + (p.x - this.cx) * z + offX, this.cy + (p.y - this.cy) * z + offY, p.size * z]

    const drawCard = (F, k, p, base) => {
      const work = this.workFor(F.i, k)
      const a = p.a * base
      if (a < 0.01) return
      const n = p.depart ? departGhosts : pileGhosts
      for (let g = n; g >= 1; g--) {
        const q = this.pose(F, k, T - (g / n) * frameFlow)
        if (!q) continue
        const [gx, gy, gs] = place(q)
        this.blit(q.frost > 0.5 ? this.frost : this.atlas, work.rect, gx, gy, gs, q.rot, a * 0.26 * smear * (1 - g / (n + 1)))
      }
      const [x, y, s] = place(p)
      // Frosted sheet underneath, the sharp image fading in over it as the
      // card nears the front of the pile.
      if (p.frost > 0.02) this.blit(this.frost, work.rect, x, y, s, p.rot, a * (0.88 + 0.12 * (1 - p.frost)))
      if (p.frost < 0.98) this.blit(this.atlas, work.rect, x, y, s, p.rot, a * (1 - p.frost))
    }

    for (const F of this.flows) {
      const life = F.creepTime + DEPART
      const kHi = Math.floor(T / PERIOD)
      const kLo = Math.ceil((T - life) / PERIOD)
      const intro = clamp01((1 - this.intro) * 2.2 - F.i * 0.12)
      const base = this.alpha * intro * (F.dim || 1)
      const piled = []
      const departing = []
      for (let k = kLo; k <= kHi; k++) {
        const p = this.pose(F, k, T)
        if (!p) continue
        if (p.depart) departing.push([k, p])
        else piled.push([k, p])
      }
      // piled runs oldest (front) to newest (back). Deepest departing card first.
      departing.sort((a, b) => b[1].depart - a[1].depart)
      if (F.top === 'new') {
        for (const [k, p] of departing) drawCard(F, k, p, base)
        for (const [k, p] of piled) drawCard(F, k, p, base)
      } else {
        for (let j = piled.length - 1; j >= 0; j--) drawCard(F, piled[j][0], piled[j][1], base)
        for (const [k, p] of departing) drawCard(F, k, p, base)
      }
    }
    ctx.globalAlpha = 1
  }
}
