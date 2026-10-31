// The doodle renderer: one sewing record in, one 2D doodle out. Shared by doodles.mts (build time, Node)
// and the prototype's bridge (in the browser, for «Мастерская»). Same outline, face, patch and topper as the
// plush; flat felt colour and an ink line instead of felt and stitches.
const INK = '#1C1830';
const LINE = `var(--dl, ${INK})`; // outer outline: ink in light mode, chalk in sky mode

const hex2hsl = (h: string) => {
  const n = parseInt(h.slice(1), 16); const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(hh * 60 + 360) % 360, s, l];
};
const hsl2hex = (h: number, s: number, l: number) => {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
};
// Patches and toppers are cut from muted craft felt; on a doodle they read a little brighter. The body keeps its exact felt colour.
const bright = (hex: string) => { const [h, s, l] = hex2hsl(hex); return hsl2hex(h, Math.min(0.92, s * 1.3 + 0.08), Math.min(0.78, Math.max(0.5, l + 0.06))); };
const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255; };

type Pt = [number, number];
const f = (n: number) => +n.toFixed(3);
function rdp(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!; const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L; if (d > best) { best = d; bi = i; } }
    if (best > eps) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// A closed outline starts and ends at the same point, so simplify it as two halves split at the farthest point.
const simplify = (pts: Pt[], close: boolean, eps: number) => {
  if (!close) return rdp(pts, eps);
  let k = 0, best = -1;
  pts.forEach(([x, y], i) => { const d = Math.hypot(x - pts[0][0], y - pts[0][1]); if (d > best) { best = d; k = i; } });
  return rdp(pts.slice(0, k + 1), eps).slice(0, -1).concat(rdp(pts.slice(k).concat([pts[0]]), eps).slice(0, -1));
};
const path = (pts: Pt[], close: boolean, eps = 0.002) => 'M' + simplify(pts, close, eps).map(([x, y]) => `${f(x)} ${f(-y)}`).join('L') + (close ? 'Z' : '');

/** One sewing record in, one doodle symbol out. */
export function toDoodleSymbol(id: string, rec: any[]) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const grow = (x: number, y: number, r = 0) => { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, -y - r); y1 = Math.max(y1, -y + r); };
  for (const r of rec) { if (r.t === 'dash') continue; if (r.pts) r.pts.forEach(([x, y]: Pt) => grow(x, y, (r.w || 0) / 2 + 0.03)); else grow(r.x, r.y, r.r + 0.03); }
  const out: string[] = [];
  for (const layer of ['back', 'body', 'front', 'top']) for (const r of rec) {
    if ((r.layer || 'front') !== layer) continue;
    const outer = layer === 'back' || layer === 'top' ? LINE : INK; // pieces outside the body take the outer line
    if (r.t === 'body') out.push(`<path d="${path(r.pts, true)}" fill="${r.fill}" stroke="${LINE}" stroke-width=".045" stroke-linejoin="round"/>`);
    else if (r.t === 'poly') {
      const d = path(r.pts, true, 0.0015), l = lum(r.fill);
      if (l < 0.3) out.push(`<path d="${d}" fill="${INK}"/>`); // pupils, lenses
      else if (r.fill.toLowerCase() === '#c9808a') out.push(`<path d="${d}" fill="#FF8FB1" opacity=".75"/>`); // cheeks
      else if (l > 0.8) out.push(`<path d="${d}" fill="#FFFFFF" stroke="${INK}" stroke-width=".018" stroke-linejoin="round"/>`); // eye whites and lids
      else out.push(`<path d="${d}" fill="${bright(r.fill)}" stroke="${outer}" stroke-width=".022" stroke-linejoin="round"/>`); // patches, bows, toppers
    } else if (r.t === 'line') {
      if (r.pts.length < 2) continue;
      const d = path(r.pts, false, 0.0015);
      if (lum(r.stroke) < 0.3) out.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(Math.max(r.w, 0.024))}" stroke-linecap="round" stroke-linejoin="round"/>`); // mouths, brows, frames
      else out.push(`<path d="${d}" fill="none" stroke="${outer}" stroke-width="${f(r.w + 0.03)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${bright(r.stroke)}" stroke-width="${f(r.w)}" stroke-linecap="round"/>`); // rings and stalks
    } else if (r.t === 'dot') {
      out.push(`<circle cx="${f(r.x)}" cy="${f(-r.y)}" r="${f(r.r)}" fill="${lum(r.fill) < 0.3 ? INK : bright(r.fill)}" stroke="${outer}" stroke-width=".022"/>`);
    } // 'dash' is a felt stitch: a doodle has none
  }
  return `<symbol id="d-${id}" viewBox="${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}">${out.join('')}</symbol>`;
}

