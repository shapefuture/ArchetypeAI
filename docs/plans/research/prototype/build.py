"""Build the Step 0 prototype: inline the felt stickers and write one HTML file.

Usage: python3 build.py <assets_dir> <out_path>
"""
import base64, os, re, sys

assets_dir, out_path = sys.argv[1:3]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prototype.src.html'), encoding='utf-8').read()

stickers = {int(f[:2]): os.path.join(assets_dir, f) for f in os.listdir(assets_dir) if f.endswith('.webp')}
used = sorted({int(n) for n in re.findall(r'\{\{S(\d\d)\}\}', src)})
uris = {n: 'data:image/webp;base64,' + base64.b64encode(open(stickers[n], 'rb').read()).decode() for n in used}
html = re.sub(r'\{\{S(\d\d)\}\}', lambda m: uris[int(m.group(1))], src)
left = re.findall(r'\{\{[^}]+\}\}', html)
if left:
    raise SystemExit(f'unreplaced placeholders: {sorted(set(left))}')

with open(out_path, 'w', encoding='utf-8') as fh:
    fh.write(html)
print('wrote', out_path, f'{os.path.getsize(out_path) / 1024:.0f} kB', '| stickers:', used)
