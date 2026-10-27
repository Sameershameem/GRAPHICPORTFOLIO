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
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const big = fbm(x * 1.1 + seed, y * 1.1, z * 1.1, 3)
    const fine = fbm(x * 4 + seed * 2, y * 4, z * 4, 3)
    // Flatten some faces for a chipped, faceted silhouette
    const facet = Math.max(0, fbm(x * 0.9 - seed, y * 0.9, z * 0.9, 2) - 0.55) * 1.4
    const d = 0.72 + big * 0.55 + fine * 0.12 - facet
    pos.setXYZ(i, x * d * sx, y * d * sy, z * d * sz)
  }
  g.computeVertexNormals()
  return g
}

function grainTexture(size) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const x = c.getContext('2d')
  const img = x.createImageData(size, size)
  for (let i = 0; i < size * size; i++) {
    const px = i % size
    const py = (i / size) | 0
    const n = fbm(px / 18, py / 18, 0.5, 4) * 0.7 + Math.random() * 0.3
    const v = Math.floor(n * 255)
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = 255
  }
  x.putImageData(img, 0, 0)
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

export function createRocks(canvas, { mobile = false } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 2))
  renderer.outputColorSpace = SRGBColorSpace
  const scene = new Scene()
  const camera = new PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.set(0, 0, 9)

  const key = new DirectionalLight(0xffffff, 3.2)
  key.position.set(-3, 5, 4)
  const rim = new DirectionalLight(0xbfcaff, 0.9)
  rim.position.set(4, -2, -3)
  scene.add(key, rim, new HemisphereLight(0xffffff, 0x1a1a1a, 0.55))

  const grain = grainTexture(mobile ? 128 : 256)
  const mat = new MeshStandardMaterial({ color: 0xb4afa8, roughness: 0.96, metalness: 0, bumpMap: grain, bumpScale: 2.2 })

  const group = new Group()
  scene.add(group)
  const rocks = LAYOUT.map((l, i) => {
    const m = new Mesh(rockGeometry(i * 13.37 + 2, mobile ? 4 : 5), mat)
    m.userData = { ...l, phase: i * 1.7, spin: [(hash(i, 9, 1) - 0.5) * 0.5, (hash(i, 2, 7) - 0.5) * 0.6] }
    m.rotation.set(hash(i, 1, 1) * 6, hash(i, 2, 2) * 6, hash(i, 3, 3) * 6)
    group.add(m)
    return m
  })

  let w = 1
  let h = 1
  let spread = 1
  let spreadY = 1
  const resize = () => {
    w = canvas.clientWidth
    h = canvas.clientHeight
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
  }
  resize()

  let px = 0
  let py = 0
  let tx = 0
  let ty = 0
  let enter = 0
  const state = { enter: 0 }

  const render = (t, dt) => {
    px += (tx - px) * 0.04
    py += (ty - py) * 0.04
    enter += (state.enter - enter) * Math.min(1, dt * 3)
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
  }

  // Compile shaders + upload buffers now (offscreen) rather than on first visible frame.
  renderer.compile(scene, camera)
  renderer.render(scene, camera)

  return {
    state,
    resize,
    render,
    pointer(nx, ny) {
      tx = nx
      ty = ny
    },
    dispose() {
      rocks.forEach((m) => m.geometry.dispose())
      mat.dispose()
      grain.dispose()
      renderer.dispose()
    },
  }
}
