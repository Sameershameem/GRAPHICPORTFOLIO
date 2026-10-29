// Runs a canvas animation ("engine") on its own thread where the browser
// supports OffscreenCanvas in workers, so drawing never competes with page
// scrolling for the main thread. Elsewhere the same engine runs on the page.
//
// An engine comes from create(canvas, options) (sync or async) and has:
//   frame(t, dt)  draw one frame (seconds)
//   paused        optional: true while there's nothing to draw (the loop rests)
//   fps           optional frame-rate cap
//   dispose()     optional
// plus whatever methods the page calls through driver.call(name, ...args).

// Frame-time meter: feed it frame intervals (ms). Calls onSlow() when frames
// stay slow: trimmed mean of ~1.5s windows above 21ms, twice in a row (so
// one-off hitches don't count).
export function frameMeter(onSlow) {
  const N = 90
  const keep = Math.floor(N * 0.9)
  const buf = new Float32Array(N)
  let n = 0
  let slow = 0
  return (ms) => {
    buf[n++] = ms
    if (n < N) return
    n = 0
    const s = Array.from(buf).sort((a, b) => a - b)
    let sum = 0
    for (let i = 0; i < keep; i++) sum += s[i]
    slow = sum / keep > 21 ? slow + 1 : 0
    if (slow >= 2) {
      slow = 0
      onSlow()
    }
  }
}

// The animation loop. onSlow: called when this loop can't keep up.
function runner(raf, caf, onSlow) {
  let id = 0
  let last = 0
  let on = false
  let frames = 0
  const meter = onSlow && frameMeter(onSlow)
  const r = {
    engine: null,
    loop(now) {
      id = 0
      const { engine } = r
      const cap = engine.fps
      if (cap && last && now - last < 1000 / cap - 4) {
        id = raf(r.loop)
        return
      }
      // Meter steady running only: not the warm-up, not capped engines.
      if (meter && !cap && last && ++frames > 120) meter(now - last)
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      engine.frame(now / 1000, dt)
      if (!engine.paused) id = raf(r.loop)
    },
    kick() {
      const { engine } = r
      if (!engine || !on || id) return
      // Resting engines still get one frame, e.g. to clear what they showed.
      if (engine.paused) return engine.frame(performance.now() / 1000, 0)
      last = 0
      id = raf(r.loop)
    },
    run(yes) {
      on = yes
      if (yes) r.kick()
      else if (id) {
        caf(id)
        id = 0
      }
    },
  }
  return r
}

// Worker side: call once from a worker entry file with the engine factory.
export function serve(create) {
  const raf = self.requestAnimationFrame ? (cb) => self.requestAnimationFrame(cb) : (cb) => setTimeout(() => cb(performance.now()), 1000 / 60)
  const caf = self.cancelAnimationFrame ? (id) => self.cancelAnimationFrame(id) : clearTimeout
  const r = runner(raf, caf, () => self.postMessage({ type: 'slow' }))
  const queue = []
  const handle = (m) => {
    if (m.type === 'run') r.run(m.on)
    else if (m.type === 'call') {
      r.engine[m.name]?.(...m.args)
      r.kick()
    }
  }
  self.onmessage = async ({ data: m }) => {
    if (m.type === 'probe') return self.postMessage({ type: 'probe', ok: canDraw(m.context) })
    if (m.type !== 'init') return r.engine ? handle(m) : queue.push(m)
    r.engine = await create(m.canvas, m.options)
    // Replay what arrived while it was being built. Frames only start on the
    // next animation frame, so every queued call lands before the first draw.
    queue.splice(0).forEach(handle)
  }
}

// Can this thread draw with that context on an OffscreenCanvas?
function canDraw(kind) {
  try {
    const ctx = new OffscreenCanvas(1, 1).getContext(kind)
    ctx?.getExtension?.('WEBGL_lose_context')?.loseContext()
    return !!ctx
  } catch {
    return false
  }
}

// Asks the worker itself whether it can draw (creating a test WebGL context
// costs the asking thread real time, so the worker pays it, not the page).
const probe = (w, context) =>
  new Promise((resolve) => {
    w.onmessage = ({ data }) => data.type === 'probe' && resolve(data.ok)
    w.onerror = () => resolve(false)
    w.postMessage({ type: 'probe', context })
  })

// Page side. worker: () => new Worker(new URL('./x.worker.js', import.meta.url), { type: 'module' })
// load: () => import('./x') (the engine module, for the on-page fallback).
// context: '2d' or 'webgl'. transfer: transferables inside options.
// onSlow: called if the worker can't keep up (on the page, the page's own
// frame meter sees it). Returns { call(name, ...args), run(on), dispose() }.
export async function startCanvas({ canvas, worker, load, context = '2d', options = {}, transfer = [], onSlow }) {
  if (typeof Worker !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype) {
    let w
    try {
      w = worker()
      if (!(await probe(w, context))) throw new Error('no offscreen ' + context)
      w.onmessage = ({ data }) => data.type === 'slow' && onSlow?.()
      const off = canvas.transferControlToOffscreen()
      w.postMessage({ type: 'init', canvas: off, options }, [off, ...transfer])
      return {
        call: (name, ...args) => w.postMessage({ type: 'call', name, args }),
        run: (on) => w.postMessage({ type: 'run', on }),
        dispose: () => w.terminate(),
      }
    } catch {
      w?.terminate() // fall back to drawing on the page
    }
  }
  const { create } = await load()
  const r = runner((cb) => requestAnimationFrame(cb), (id) => cancelAnimationFrame(id))
  r.engine = await create(canvas, options)
  return {
    call: (name, ...args) => {
      r.engine[name]?.(...args)
      r.kick()
    },
    run: (on) => r.run(on),
    dispose: () => {
      r.run(false)
      r.engine.dispose?.()
    },
  }
}
