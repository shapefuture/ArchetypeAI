// 2D sticker variant: drawn from the same sewing record as the 3D character, so both always match.
import { normals, resample } from './shapes.js';
const f = (n) => +n.toFixed(4);
const path = (pts, close) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(-y)}`).join('L') + (close ? 'Z' : '');
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const c = [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)); return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''); }

export function toSVG(rec, { id = 'f' + Math.random().toString(36).slice(2, 7), title = '' } = {}) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const grow = (x, y, r = 0) => { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, -y - r); y1 = Math.max(y1, -y + r); };
  for (const r of rec) { if (r.pts) r.pts.forEach(([x, y]) => grow(x, y, (r.w || 0) / 2)); else grow(r.x, r.y, r.r); }
  const pad = 0.06, w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2;
  const order = ['back', 'body', 'front', 'top'];
  const out = [];
  for (const L of order) for (const r of rec) {
    if ((r.layer || 'front') !== L) continue;
    if (r.t === 'body') {
      const d = path(r.pts, true);
      out.push(`<path d="${d}" fill="${r.fill}"/>`);
      out.push(`<path d="${d}" fill="url(#${id}g)"/>`);
      out.push(`<path d="${d}" fill="${r.fill}" filter="url(#${id}n)" opacity=".55"/>`);
      // blanket stitch: purl line on the edge + ticks
      const nr = normals(r.pts); const step = Math.max(1, Math.round(0.05 / 0.0085));
      let ticks = '';
      for (let i = 0; i < r.pts.length; i += step) { const [x, y] = r.pts[i], [nx, ny] = nr[i]; ticks += `M${f(x - nx * 0.004)} ${f(-(y - ny * 0.004))}L${f(x + nx * 0.036)} ${f(-(y + ny * 0.036))}`; }
      out.push(`<path d="${d}" fill="none" stroke="${shade(r.fill, -0.18)}" stroke-width=".012"/>`);
      out.push(`<path d="${ticks}" stroke="${r.thread}" stroke-width=".012" stroke-linecap="round" fill="none"/>`);
      out.push(`<path d="${d}" fill="none" stroke="${r.thread}" stroke-width=".011"/>`);
    } else if (r.t === 'poly') {
      out.push(`<path d="${path(r.pts, true)}" fill="${r.fill}" stroke="${shade(r.fill, -0.22)}" stroke-width=".005" stroke-linejoin="round"/>`);
    } else if (r.t === 'dash') {
      out.push(`<path d="${path(r.pts, true)}" fill="none" stroke="${r.stroke}" stroke-width="${f(r.w)}" stroke-dasharray="${f(r.dash)} ${f(r.gap)}" stroke-linecap="round"/>`);
    } else if (r.t === 'line') {
      if (r.pts.length > 1) out.push(`<path d="${path(r.pts, false)}" fill="none" stroke="${r.stroke}" stroke-width="${f(r.w)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    } else if (r.t === 'dot') {
      out.push(`<circle cx="${f(r.x)}" cy="${f(-r.y)}" r="${f(r.r)}" fill="${r.fill}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(x0 - pad)} ${f(y0 - pad)} ${f(w)} ${f(h)}" role="img"${title ? ` aria-label="${title.replace(/"/g, '')}"` : ''}>
<defs><radialGradient id="${id}g" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient>
<filter id="${id}n" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="38" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.1 1.05"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in2="SourceGraphic" mode="soft-light"/></filter>
<filter id="${id}s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx=".012" dy=".02" stdDeviation=".018" flood-opacity=".22"/></filter></defs>
<g filter="url(#${id}s)">${out.join('')}</g></svg>`;
}
void resample;
