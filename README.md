# Saima Ahmad — Graphic Design Portfolio

React + Vite + Tailwind CSS v4, animated with GSAP ScrollTrigger and Lenis smooth scrolling.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the production build
```

## Performance

- The hero cards, starfield and 3D rocks draw on their own threads (Web Workers +
  OffscreenCanvas), so scrolling never waits on them. Older browsers draw them on
  the page instead.
- Rendering quality adapts to the device (`src/lib/perf.js`): desktops get blur and
  frosted glass; phones get solid panels and lighter canvases; quality steps down
  on its own if a device can't keep a smooth frame rate. Add `?quality=low`,
  `?quality=mid` or `?quality=high` to the URL to try a level on any device.

## Editing content

- **Designer details / contact links:** `src/data/site.js`
- **Portfolio pieces:** `src/data/works.js` (title, client, category)
- **Images:** `public/works/<id>-xs|sm|lg.webp` plus `public/works/atlas.webp` (hero vortex).
  After adding a work, list it in `scripts/map.txt`, export the three sizes, then run
  `python3 scripts/build-atlas.py` to rebuild the atlas.

## Sections

1. Hero — canvas image vortex, cycling audience pill, dark/light toggle
2. Scattered work — echo-text headline swaps (pinned scroll stage)
3. Collection — the picked card flies into the "Selected Works" grid
4. Detail — featured piece pops out, gets scanned and tagged
5. Search — typing search that highlights matching industries
6. About — starfield + draggable carousel (click any card for the lightbox)
7. Availability — desktop/phone mockups + client wall
8. Contact — 3D rocks (three.js, lazy-loaded) + footer
