"""Packs the small work thumbnails into one atlas used by the hero canvas."""
import json, sys
from PIL import Image

TW, TH, COLS = 256, 320, 5
names = [l.split()[1] for l in open('scripts/map.txt') if l.strip()]
rows = (len(names) + COLS - 1) // COLS
atlas = Image.new('RGB', (TW * COLS, TH * rows), (0, 0, 0))
rects = {}
for i, n in enumerate(names):
    im = Image.open(f'public/works/{n}-sm.webp').convert('RGB')
    a = im.width / im.height
    w, h = (round(TH * a), TH) if a <= TW / TH else (TW, round(TW / a))
    im = im.resize((w, h), Image.LANCZOS)
    x = (i % COLS) * TW + (TW - w) // 2
    y = (i // COLS) * TH + (TH - h) // 2
    atlas.paste(im, (x, y))
    rects[n] = [x + 1, y + 1, w - 2, h - 2]
atlas.save('public/works/atlas.webp', quality=78)
json.dump({'w': atlas.width, 'h': atlas.height, 'rects': rects}, open('src/data/atlas.json', 'w'))
print(atlas.size)
