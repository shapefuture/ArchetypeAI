"""Build the Step 0 prototype as one HTML file.

Both character renderings come from the same editor traits (cast.ts):
- {{DOODLES}} becomes doodles.svg, the 2D doodles drawn from the engine's sewing record (doodles.mts);
- {{P:<id>}} becomes plush/<id>.webp, the 3D plush rendered by the app's feltThumbnail (plush-shots.html).

Regenerate them after changing cast.ts:
  npx tsx docs/plans/research/prototype/doodles.mts > docs/plans/research/prototype/doodles.svg
  npx vite --config docs/plans/research/prototype/plush.vite.config.mjs  (open plush-shots.html, then convert plush/*.png to WebP)

Usage: python3 build.py <out_path>
"""
import base64, os, re, sys

out_path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'prototype.src.html'), encoding='utf-8').read()

doodles = open(os.path.join(here, 'doodles.svg'), encoding='utf-8').read().strip()
html = src.replace('{{DOODLES}}', doodles)

def plush(m):
    path = os.path.join(here, 'plush', m.group(1) + '.webp')
    return 'data:image/webp;base64,' + base64.b64encode(open(path, 'rb').read()).decode()
html = re.sub(r'\{\{P:([a-z-]+)\}\}', plush, html)

# {{S:NN}}: the owner's 3D object stickers, used as content icons (never as parts).
stickers_dir = os.path.join(here, '..', '..', 'felt-cosmos', 'assets')
stickers = {f[:2]: os.path.join(stickers_dir, f) for f in os.listdir(stickers_dir) if f.endswith('.webp')}
def sticker(m):
    return 'data:image/webp;base64,' + base64.b64encode(open(stickers[m.group(1)], 'rb').read()).decode()
html = re.sub(r'\{\{S:(\d\d)\}\}', sticker, html)

left = re.findall(r'\{\{[^}]+\}\}', html)
if left:
    raise SystemExit(f'unreplaced placeholders: {sorted(set(left))}')

with open(out_path, 'w', encoding='utf-8') as fh:
    fh.write(html)
used = sorted(set(re.findall(r'\{\{P:([a-z-]+)\}\}', src)))
icons = sorted(set(re.findall(r'\{\{S:(\d\d)\}\}', src)))
print('wrote', out_path, f'{os.path.getsize(out_path) / 1024:.0f} kB', '| plush:', used, '| icons:', icons)
