import { byId } from '../data/works'

// Geometry for the pinned showcase stage (sections 2–4). Everything is derived
// from the stage size so the same choreography works from phones to desktops.

export const SHARED_ID = 'brandsway-results' // flies from the scatter into the collection
export const FEATURED_ID = 'rakesh-22-karat' // pops out of the collection for the detail view

const scatterWide = [
  { id: 'rakesh-diamonds', x: 0.005, y: 0.06, w: 0.148, d: 1.2, icon: 'ig' },
  { id: 'islamic-mission-school', x: 0.262, y: 0.015, w: 0.135, d: 0.8, icon: 'ig' },
  { quote: true, x: 0.575, y: 0.085, w: 0.32, h: 0.18, d: 0.6 },
  { id: SHARED_ID, x: 0.68, y: 0.34, w: 0.152, d: 1, icon: 'ig' },
  { id: 'alayham-dream-destination', x: 0.95, y: 0.38, w: 0.14, d: 0.7, icon: 'ig' },
  { id: 'alayham-window', x: 0.012, y: 0.57, w: 0.178, d: 1.3, icon: 'ig' },
  { id: 'growth-journey-pouches', x: 0.282, y: 0.675, w: 0.142, d: 0.9, icon: 'box' },
  { id: 'barkaas-mango-sunrise', x: 0.505, y: 0.685, w: 0.14, d: 1.1, icon: 'ig' },
  { id: 'playplace-learn-grow', x: 0.872, y: 0.78, w: 0.145, d: 0.8, icon: 'print' },
]

const scatterTall = [
  { id: 'rakesh-diamonds', x: 0.04, y: 0.1, w: 0.3, d: 1.2, icon: 'ig' },
  { id: 'islamic-mission-school', x: 0.6, y: 0.075, w: 0.33, d: 0.8, icon: 'ig' },
  { id: 'barkaas-mango-sunrise', x: 0.4, y: 0.235, w: 0.17, d: 0.6, icon: 'ig' },
  { id: SHARED_ID, x: 0.63, y: 0.62, w: 0.31, d: 1, icon: 'ig' },
  { id: 'alayham-window', x: 0.05, y: 0.635, w: 0.33, d: 1.3, icon: 'ig' },
  { id: 'growth-journey-pouches', x: 0.33, y: 0.815, w: 0.27, d: 0.9, icon: 'box' },
  { id: 'alayham-dream-destination', x: -0.06, y: 0.39, w: 0.13, d: 0.7, icon: 'ig' },
  { id: 'playplace-learn-grow', x: 0.935, y: 0.4, w: 0.15, d: 0.8, icon: 'print' },
]

const gridPool = [
  'alayham-anywhere',
  'barkaas-lamb-chops',
  'gravity-neet-results',
  'playplace-curious',
  'alayham-visa',
  'brandsway-hiring',
  'barkaas-kunafa',
  'kernello-packaging',
  'rakesh-bangles',
  'alayham-best-price',
  'rakesh-diamonds',
  'alayham-suitcase',
]

const rect = (x, y, w, h) => ({ x, y, w, h })

export function computeLayout(W, H) {
  const wide = W / H >= 1
  const cols = wide ? 4 : W < 520 ? 3 : 4

  // Scattered cards (section 2)
  const scatter = (wide ? scatterWide : scatterTall).map((c) => {
    if (c.quote) return { ...c, r: rect(c.x * W, c.y * H, c.w * W, c.h * H) }
    const work = byId[c.id]
    const w = c.w * W
    return { ...c, work, r: rect(c.x * W, c.y * H, w, w / work.ratio) }
  })
  const sharedScatter = scatter.find((c) => c.id === SHARED_ID).r

  // Collection panel (section 3)
  const pw = wide ? Math.min(W * 0.86, 1240) : W - 24
  const panelX = (W - pw) / 2
  const panelTop = wide ? H * 0.43 : H * 0.31
  const headerH = wide ? 158 : 138
  const gw = wide ? pw * 0.84 : pw - 20
  const gap = wide ? 12 : 8
  const cw = (gw - gap * (cols - 1)) / cols
  const gx = (W - gw) / 2

  // First row: shared card first, featured card last; then the pool.
  const firstRow = [SHARED_ID, ...gridPool.slice(0, cols - 2), FEATURED_ID]
  const rest = gridPool.slice(cols - 2, cols - 2 + cols * 2)
  const ids = [...firstRow, ...rest]
  const colY = Array(cols).fill(0)
  const grid = ids.map((id, i) => {
    const c = i % cols
    const work = byId[id]
    const h = cw / work.ratio
    const r = rect(gx + c * (cw + gap), panelTop + headerH + colY[c], cw, h)
    colY[c] += h + gap
    return { id, work, r, i }
  })
  const panelH = headerH + Math.max(...colY) + 28
  const panel = rect(panelX, panelTop, pw, panelH)
  const sharedSlot = grid[0].r
  const featuredSlot = grid[cols - 1].r

  // Mid-flight spot for the shared card + its context menu
  const mid = wide
    ? rect(W * 0.43 - sharedScatter.w * 0.55, H * 0.56, sharedScatter.w * 1.1, sharedScatter.h * 1.1)
    : rect(W / 2 - sharedScatter.w * 0.6, H * 0.46, sharedScatter.w * 1.2, sharedScatter.h * 1.2)
  const menu = wide
    ? { x: mid.x + mid.w * 0.62, y: mid.y + mid.h * 0.18 }
    : { x: mid.x + mid.w * 0.35, y: mid.y + mid.h * 0.55 }

  // Featured detail view (section 4)
  const fwork = byId[FEATURED_ID]
  let featured
  if (wide) {
    const fh = Math.min(H * 0.71, (W * 0.34) / fwork.ratio)
    const fw = fh * fwork.ratio
    featured = rect(W * 0.465 - fw, H * 0.19, fw, fh)
  } else {
    const fw = Math.min(W * 0.64, 320, H * 0.42 * fwork.ratio)
    featured = rect((W - fw) / 2, H * 0.12, fw, fw / fwork.ratio)
  }
  const detailText = wide
    ? { x: W * 0.51, y: featured.y + featured.h * 0.52, w: Math.min(W * 0.32, 520), align: 'left' }
    : { x: 20, y: featured.y + featured.h + 26, w: W - 40, align: 'center' }

  return {
    W,
    H,
    wide,
    cols,
    scatter,
    sharedScatter,
    panel,
    headerH,
    grid,
    sharedSlot,
    featuredSlot,
    mid,
    menu,
    featured,
    detailText,
    scrollD: Math.max(H * 0.95, panelTop + headerH + featuredSlot.h * 0.4),
  }
}
