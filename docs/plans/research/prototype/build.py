"""Build the Innerverse prototype as one HTML file.

The shell (prototype.src.html) pulls in its parts:
- <!--@css app/styles.css--> and <!--@js app/....js--> become inline <style> and <script> blocks;
- {{DOODLES}} becomes doodles.svg, the 2D doodles drawn from the engine's sewing record (doodles.mts);
- {{P:<id>}} becomes plush/<id>.webp, the 3D plush rendered by the app's feltThumbnail (plush-shots.html);
- {{S:NN}} becomes the owner's 3D object sticker NN (docs/plans/felt-cosmos/assets), used as a content icon only.

The therapist's universe is not inlined: bridge/ (built by bridge/bridge.vite.config.mjs) sits beside the page
and is imported on demand, so publish it with the page as supporting files.

Regenerate the generated parts after changing their sources:
  npx tsx docs/plans/research/prototype/doodles.mts > docs/plans/research/prototype/doodles.svg
  npx tsx docs/plans/research/prototype/dump-data.mts > docs/plans/research/prototype/app/data.js
  npx vite --config docs/plans/research/prototype/plush.vite.config.mjs  (open plush-shots.html, then cwebp the PNGs)

Usage: python3 build.py <out_path>
"""
import base64, os, re, sys

if len(sys.argv) != 2:
    raise SystemExit('usage: python3 build.py <out_path>')
out_path = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))


def read(rel):
    with open(os.path.join(here, rel), encoding='utf-8') as fh:
        return fh.read()


html = read('prototype.src.html')


def inline(m):
    kind, rel = m.group(1), m.group(2)
    body = read(rel).strip()
    if kind == 'css':
        return '<style>\n' + body + '\n</style>'
    if '</script' in body.lower():
        raise SystemExit(f'{rel} contains a closing script tag and would break the page')
    return '<script>\n' + body + '\n</script>'


html = re.sub(r'<!--@(css|js) (\S+?)-->', inline, html)
html = html.replace('{{DOODLES}}', read('doodles.svg').strip())


def plush(m):
    with open(os.path.join(here, 'plush', m.group(1) + '.webp'), 'rb') as fh:
        return 'data:image/webp;base64,' + base64.b64encode(fh.read()).decode()


html = re.sub(r'\{\{P:([a-z_]+)\}\}', plush, html)

stickers_dir = os.path.join(here, '..', '..', 'felt-cosmos', 'assets')
stickers = {f[:2]: os.path.join(stickers_dir, f) for f in os.listdir(stickers_dir) if f.endswith('.webp')}


def sticker(m):
    with open(stickers[m.group(1)], 'rb') as fh:
        return 'data:image/webp;base64,' + base64.b64encode(fh.read()).decode()


html = re.sub(r'\{\{S:(\d\d)\}\}', sticker, html)

left = re.findall(r'\{\{[^}]+\}\}|<!--@[^>]+-->', html)
if left:
    raise SystemExit(f'unreplaced placeholders: {sorted(set(left))}')

with open(out_path, 'w', encoding='utf-8') as fh:
    fh.write(html)
used_plush = sorted(set(re.findall(r'\{\{P:([a-z_]+)\}\}', read('app/app.js'))))
used_icons = sorted(set(re.findall(r'\{\{S:(\d\d)\}\}', read('app/app.js'))))
print('wrote', out_path, f'{os.path.getsize(out_path) / 1024:.0f} kB', '| plush:', len(used_plush), '| icons:', used_icons)
