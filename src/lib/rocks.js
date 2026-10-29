// Floating asteroid rocks for the closing section. Loaded on demand.
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Mesh,
  DirectionalLight,
  HemisphereLight,
  Group,
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'

// Small deterministic 3D value noise.
function hash(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}
function noise(x, y, z) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = x - xi
  const yf = y - yi
  const zf = z - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const w = zf * zf * (3 - 2 * zf)
  const l = (a, b, t) => a + (b - a) * t
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz)
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  )
}
function fbm(x, y, z, oct) {
  let a = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < oct; i++) {
    a += amp * noise(x * f, y * f, z * f)
    f *= 2.03
    amp *= 0.5
  }
  return a
}

function rockGeometry(seed, detail) {
  const g = new IcosahedronGeometry(1, detail)
  const pos = g.attributes.position
  const sx = 0.8 + hash(seed, 1, 2) * 0.5
  const sy = 0.65 + hash(seed, 3, 4) * 0.35
  const sz = 0.75 + hash(seed, 5, 6) * 0.4
  // The geometry is non-indexed: every corner is shared by ~6 triangles, so
  // displace each distinct point once.
  const seen = new Map()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const key = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`
    let d = seen.get(key)
    if (d === undefined) {
      const big = fbm(x * 1.1 + seed, y * 1.1, z * 1.1, 3)
      const fine = fbm(x * 4 + seed * 2, y * 4, z * 4, 3)
      // Flatten some faces for a chipped, faceted silhouette
      const facet = Math.max(0, fbm(x * 0.9 - seed, y * 0.9, z * 0.9, 2) - 0.55) * 1.4
      d = 0.72 + big * 0.55 + fine * 0.12 - facet
      seen.set(key, d)
    }
    pos.setXYZ(i, x * d * sx, y * d * sy, z * d * sz)
  }
  g.computeVertexNormals()
  return g
}

// Scratch canvas that works on the page and in a worker.
const makeCanvas = (size) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(size, size)
  const c = document.createElement('canvas')
  c.width = c.height = size
  return c
}

// Rock-surface grain for the bump map: a few octaves of random value noise,
// each a tiny random grid scaled up smoothly (cheap canvas work instead of
// evaluating noise per pixel), plus fine per-pixel speckle.
function grainTexture(size) {
  const c = makeCanvas(size)
  const x = c.getContext('2d')
  x.fillStyle = '#808080'
  x.fillRect(0, 0, size, size)
  x.imageSmoothingEnabled = true
  for (const [cells, alpha] of [
    [Math.max(2, size / 16), 0.55],
    [Math.max(2, size / 8), 0.4],
    [Math.max(2, size / 4), 0.3],
    [size, 0.3],
  ]) {
    const t = makeCanvas(cells)
    const tx = t.getContext('2d')
    const img = tx.createImageData(cells, cells)
    for (let i = 0; i < cells * cells; i++) {
      const v = (Math.random() * 256) | 0
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
      img.data[i * 4 + 3] = 255
    }
    tx.putImageData(img, 0, 0)
    x.globalAlpha = alpha
    x.drawImage(t, 0, 0, size, size)
  }
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

// Positions (x, y in "screen" units around the headline), scale, depth
const LAYOUT = [
  { x: -1.75, y: 0.62, s: 0.33, z: -0.4 },
  { x: -0.55, y: 1.0, s: 0.3, z: -0.9 },
  { x: 0.75, y: 0.98, s: 0.27, z: -1.0 },
  { x: 1.95, y: 0.28, s: 0.36, z: -0.3 },
  { x: -1.55, y: -0.42, s: 0.47, z: 0.2 },
  { x: 0.55, y: -0.55, s: 0.43, z: 0.3 },
  { x: -0.3, y: -1.25, s: 0.22, z: -1.6 },
]

// Hand the thread back between build steps so building never stalls a frame.
const idle = () =>
  new Promise((resolve) => (globalThis.requestIdleCallback ? requestIdleCallback(() => resolve(), { timeout: 500 }) : setTimeout(resolve, 30)))

// Builds the scene in small idle-time steps (on the page, or in a worker with
// an OffscreenCanvas, see offscreen.js). settings: the quality tier's settings
// (lib/perf.js). Resolves with the engine; call resize() before drawing.
export async function createRocks(canvas, { settings }) {
  const detail = settings.rocksDetail
  const renderer = new WebGLRenderer({ canvas, antialias: settings.rocksAA, alpha: true })
  renderer.outputColorSpace = SRGBColorSpace
  const scene = new Scene()
  const camera = new PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.set(0, 0, 9)

  const key = new DirectionalLight(0xffffff, 3.2)
  key.position.set(-3, 5, 4)
  const rim = new DirectionalLight(0xbfcaff, 0.9)
  rim.position.set(4, -2, -3)
  scene.add(key, rim, new HemisphereLight(0xffffff, 0x1a1a1a, 0.55))

  await idle()
  const grain = grainTexture(detail >= 5 ? 256 : 128)
  const mat = new MeshStandardMaterial({ color: 0xb4afa8, roughness: 0.96, metalness: 0, bumpMap: grain, bumpScale: 2.2 })

  const group = new Group()
  scene.add(group)
  const rocks = []
  for (let i = 0; i < LAYOUT.length; i++) {
    await idle()
    const m = new Mesh(rockGeometry(i * 13.37 + 2, detail), mat)
    m.userData = { ...LAYOUT[i], phase: i * 1.7, spin: [(hash(i, 9, 1) - 0.5) * 0.5, (hash(i, 2, 7) - 0.5) * 0.6] }
    m.rotation.set(hash(i, 1, 1) * 6, hash(i, 2, 2) * 6, hash(i, 3, 3) * 6)
    group.add(m)
    rocks.push(m)
  }

  let w = 0
  let h = 0
  let ratio = 0
  let spread = 1
  let spreadY = 1
  let px = 0
  let py = 0
  let tx = 0
  let ty = 0
  let enter = 0
  let enterTarget = 0

  // Compile shaders without blocking (parallel compile where supported), then
  // draw once offscreen so buffers and textures are uploaded before it's seen.
  await renderer.compileAsync(scene, camera)
  await idle()
  renderer.render(scene, camera)

  return {
    // Canvas size in CSS pixels and the pixel ratio to draw at.
    resize(nw, nh, dpr) {
      // Resizing a WebGL canvas re-allocates its buffers: only on real changes.
      if (nw === w && nh === h && dpr === ratio) return
      w = nw
      h = nh
      ratio = dpr
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      // Narrow screens: tighter, smaller ring that opens up vertically so the
      // rocks frame the headline instead of covering it.
      const aspect = w / h
      spread = Math.min(1, aspect * 0.9) * 1.25
      spreadY = aspect < 1 ? 1.55 : 1
      const size = aspect < 1 ? Math.max(0.5, aspect / 1.4) : 1.12
      rocks.forEach((m) => m.scale.setScalar(m.userData.s * size))
    },
    // Scroll progress of the section's entrance (rocks drift in from below).
    setEnter(p) {
      enterTarget = p
    },
    pointer(nx, ny) {
      tx = nx
      ty = ny
    },
    setSettings(s) {
      settings = s
    },
    // Lighter devices draw the slow-moving rocks at a lower frame rate.
    get fps() {
      return settings.rocksFps < 60 ? settings.rocksFps : 0
    },
    frame(t, dt) {
      if (!w) return
      px += (tx - px) * 0.04
      py += (ty - py) * 0.04
      enter += (enterTarget - enter) * Math.min(1, dt * 3)
      rocks.forEach((m) => {
        const u = m.userData
        m.rotation.x += u.spin[0] * dt
        m.rotation.y += u.spin[1] * dt
        const bob = Math.sin(t * 0.6 + u.phase) * 0.06
        const e = 1 - enter
        m.position.set(u.x * spread * (1 + e * 0.6), u.y * 0.92 * spreadY + bob - e * 2.6, u.z + e * 2)
      })
      group.rotation.y = px * 0.18
      group.rotation.x = py * 0.1
      renderer.render(scene, camera)
    },
    dispose() {
      rocks.forEach((m) => m.geometry.dispose())
      mat.dispose()
      grain.dispose()
      renderer.dispose()
    },
  }
}

export const create = createRocks
