// 2D outlines for felt pieces: SDF templates -> marching squares -> clean CCW polygon.

const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
const len = (x, y) => Math.hypot(x, y);
const circ = (x, y, cx, cy, r) => len(x - cx, y - cy) - r;
function box(x, y, bx, by, r) { const qx = Math.abs(x) - bx + r, qy = Math.abs(y) - by + r; return len(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; }
function ngon(x, y, r, n, round, rot = 0) {
  // regular polygon via max of half-planes, then rounded
  let d = -1e9; r -= round;
  for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; d = Math.max(d, x * Math.sin(a) + y * Math.cos(a) - r * Math.cos(Math.PI / n)); }
  return d - round;
}
function ellipse(x, y, rx, ry) { const k = len(x / rx, y / ry); return (k - 1) * Math.min(rx, ry); }
function heart(x, y) {
  x = Math.abs(x) / 1.0; y = y + 0.5;
  if (x + y > 1) return Math.sqrt((x - 0.25) ** 2 + (y - 0.75) ** 2) - Math.SQRT2 / 4;
  return Math.sqrt(Math.min((x) ** 2 + (y - 1) ** 2, (x - 0.5 * Math.max(x + y, 0)) ** 2 + (y - 0.5 * Math.max(x + y, 0)) ** 2)) * Math.sign(x - y);
}
function roundCone(x, y, r1, r2, h) {
  x = Math.abs(x); const b = (r1 - r2) / h, a = Math.sqrt(1 - b * b), k = -b * x + a * y;
  if (k < 0) return len(x, y) - r1;
  if (k > a * h) return len(x, y - h) - r2;
  return x * a + y * b - r1;
}
function star(x, y, r, n, m, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot); [x, y] = [x * c - y * s, x * s + y * c];
  const an = Math.PI / n, en = Math.PI / m;
  const acx = Math.cos(an), acy = Math.sin(an), ecx = Math.cos(en), ecy = Math.sin(en);
  let bn = ((Math.atan2(x, y) % (2 * an)) + 2 * an) % (2 * an) - an;
  const l = len(x, y); let px = l * Math.cos(bn), py = Math.abs(l * Math.sin(bn));
  px -= r * acx; py -= r * acy;
  const t = Math.min(Math.max(-(px * ecx + py * ecy), 0), r * acy / ecy);
  px += ecx * t; py += ecy * t;
  return len(px, py) * Math.sign(px);
}

// Unit-space SDFs (width ~1). Rounded generously: felt is cut with scissors, never razor sharp.
export const SDF = {
  cloud: (x, y) => { let d = circ(x, y, 0, 0.07, 0.25); d = smin(d, circ(x, y, -0.25, -0.03, 0.19), 0.08); d = smin(d, circ(x, y, 0.26, -0.02, 0.2), 0.08); d = smin(d, circ(x, y, -0.36, -0.13, 0.12), 0.06); d = smin(d, circ(x, y, 0.38, -0.12, 0.12), 0.06); d = smin(d, box(x, y + 0.13, 0.4, 0.1, 0.08), 0.06); return d; },
  frog: (x, y) => { let d = ellipse(x, y + 0.07, 0.49, 0.32); d = smin(d, circ(x, y, -0.27, 0.23, 0.165), 0.08); d = smin(d, circ(x, y, 0.27, 0.23, 0.165), 0.08); return d; },
  triangle: (x, y) => ngon(x, -(y + 0.06), 0.47, 3, 0.19),
  heart: (x, y) => heart(x * 1.12, (y + 0.05) * 1.12) / 1.12 - 0.015,
  bean: (x, y) => { let d = box(x, y, 0.47, 0.25, 0.25); d = smax(d, -circ(x, y, 0.0, 0.47, 0.25), 0.12); return d; },
  drop: (x, y) => roundCone(x, y + 0.2, 0.29, 0.03, 0.5) - 0.012,
  crescent: (x, y) => { const d = circ(x, y, 0, 0, 0.4); return smax(d, -circ(x, y, 0.2, 0.12, 0.33), 0.05); },
  square: (x, y) => box(x, y, 0.4, 0.38, 0.14),
  flower: (x, y) => { let d = circ(x, y, 0, 0, 0.24); for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i / 5) * Math.PI * 2; d = smin(d, circ(x, y, 0.25 * Math.cos(a), 0.25 * Math.sin(a), 0.19), 0.06); } return d; },
  mochi: (x, y) => smax(ellipse(x, y + 0.16, 0.5, 0.5), -(y + 0.24), 0.12),
  pentagon: (x, y) => ngon(x, -(y - 0.0), 0.43, 5, 0.12),
  pill: (x, y) => box(x, y, 0.5, 0.21, 0.21),
  sun: (x, y) => circ(x, y, 0, 0, 0.33),
  // piece shapes
  disc: (x, y) => len(x, y) - 0.5,
  oval: (x, y) => ellipse(x, y, 0.5, 0.36),
  star5: (x, y) => star(x, y, 0.5, 5, 2.4) - 0.04,
  moon: (x, y) => smax(circ(x, y, 0, 0, 0.45), -circ(x, y, 0.24, 0.13, 0.36), 0.04),
  rays: (x, y) => star(x, y, 0.5, 12, 4.2) - 0.012,
  rays2: (x, y) => star(x, y, 0.43, 12, 3.6, Math.PI / 12) - 0.012,
  flame: (x, y) => { // comet tail: tapering teardrop pointing left-up
    const c = Math.cos(-0.65), s = Math.sin(-0.65); const u = x * c - y * s, v = x * s + y * c; return roundCone(v, u + 0.2, 0.22, 0.04, 0.62) - 0.01;
  },
  lid: (x, y) => smax(len(x, y) - 0.5, -y, 0.02),
  tail: (x, y) => { let d = roundCone(x + Math.sin(y * 7) * 0.03 * (y + 0.25), y + 0.27, 0.2, 0.025, 0.6); d = smin(d, roundCone(x - 0.13, y + 0.1, 0.09, 0.02, 0.32), 0.05); d = smin(d, roundCone(x + 0.12, y + 0.12, 0.08, 0.018, 0.26), 0.05); return d - 0.006; },
};

// ---------- marching squares ----------
export function outline(sdf, { res = 220, extent = 0.72, step = 0.0085 } = {}) {
  const n = res, h = (2 * extent) / n, X = (i) => -extent + i * h;
  const v = new Float32Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) v[j * (n + 1) + i] = sdf(X(i), X(j));
  const val = (i, j) => v[j * (n + 1) + i];
  const edgePt = (key) => {
    const [t, i, j] = key; let a, b, pa, pb;
    if (t === 0) { a = val(i, j); b = val(i + 1, j); pa = [X(i), X(j)]; pb = [X(i + 1), X(j)]; }
    else { a = val(i, j); b = val(i, j + 1); pa = [X(i), X(j)]; pb = [X(i), X(j + 1)]; }
    const f = a / (a - b); return [pa[0] + (pb[0] - pa[0]) * f, pa[1] + (pb[1] - pa[1]) * f];
  };
  const segs = new Map(); const add = (a, b) => { const ka = a.join(','), kb = b.join(','); (segs.get(ka) || segs.set(ka, []).get(ka)).push(kb); (segs.get(kb) || segs.set(kb, []).get(kb)).push(ka); };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const c = (val(i, j) < 0 ? 1 : 0) | (val(i + 1, j) < 0 ? 2 : 0) | (val(i + 1, j + 1) < 0 ? 4 : 0) | (val(i, j + 1) < 0 ? 8 : 0);
    if (c === 0 || c === 15) continue;
    const B = [0, i, j], R = [1, i + 1, j], T = [0, i, j + 1], L = [1, i, j];
    const table = { 1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[R, T]], 6: [[B, T]], 7: [[L, T]], 8: [[T, L]], 9: [[T, B]], 11: [[T, R]], 12: [[R, L]], 13: [[R, B]], 14: [[B, L]], 5: [[L, T], [R, B]], 10: [[B, L], [T, R]] };
    for (const [a, b] of table[c]) add(a, b);
  }
  // chain the longest loop
  const seen = new Set(); let best = [];
  for (const start of segs.keys()) {
    if (seen.has(start)) continue;
    const loop = [start]; seen.add(start); let prev = null, cur = start;
    for (;;) { const nb = segs.get(cur).find((k) => k !== prev && !seen.has(k)); if (!nb) break; seen.add(nb); loop.push(nb); prev = cur; cur = nb; }
    if (loop.length > best.length) best = loop;
  }
  let pts = best.map((k) => edgePt(k.split(',').map(Number)));
  if (area(pts) < 0) pts.reverse();
  return resample(pts, step);
}

export function area(p) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return a / 2; }
export function perimeter(p) { let l = 0; for (let i = 0; i < p.length; i++) l += len(p[(i + 1) % p.length][0] - p[i][0], p[(i + 1) % p.length][1] - p[i][1]); return l; }
export function resample(p, step) {
  const L = perimeter(p), n = Math.max(24, Math.round(L / step)), out = [];
  let i = 0, acc = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / n) * L;
    for (;;) { const a = p[i % p.length], b = p[(i + 1) % p.length], sl = len(b[0] - a[0], b[1] - a[1]); if (acc + sl >= target || i > p.length * 2) { const f = sl ? (target - acc) / sl : 0; out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); break; } acc += sl; i++; }
  }
  return out;
}
export function normals(p) { // inward normals for CCW polygon
  return p.map((_, i) => { const a = p[(i - 1 + p.length) % p.length], b = p[(i + 1) % p.length]; const tx = b[0] - a[0], ty = b[1] - a[1], l = len(tx, ty) || 1; return [-ty / l, tx / l]; });
}
export function inside(p, x, y) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
export function distTo(p, x, y) {
  let m = 1e9;
  for (let i = 0; i < p.length; i++) {
    const [ax, ay] = p[i], [bx, by] = p[(i + 1) % p.length];
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const d = len(x - ax - dx * t, y - ay - dy * t); if (d < m) m = d;
  }
  return m;
}
export function smoothPoly(p, iters = 1) { for (let k = 0; k < iters; k++) p = p.map((q, i) => { const a = p[(i - 1 + p.length) % p.length], b = p[(i + 1) % p.length]; return [(a[0] + 2 * q[0] + b[0]) / 4, (a[1] + 2 * q[1] + b[1]) / 4]; }); return p; }

/** Spatial index over polygon edges: fast signed distance (positive inside, CCW polygon). */
export class SegIndex {
  constructor(poly, cell = 0.03) {
    this.p = poly; this.cell = cell; this.map = new Map();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    this.bb = [x0, y0, x1, y1];
    for (let i = 0; i < poly.length; i++) {
      const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
      const i0 = Math.floor(Math.min(ax, bx) / cell), i1 = Math.floor(Math.max(ax, bx) / cell), j0 = Math.floor(Math.min(ay, by) / cell), j1 = Math.floor(Math.max(ay, by) / cell);
      for (let ii = i0; ii <= i1; ii++) for (let jj = j0; jj <= j1; jj++) { const k = ii * 73856093 ^ jj * 19349663; let a = this.map.get(k); if (!a) this.map.set(k, (a = [])); a.push(i); }
    }
  }
  signed(x, y) {
    const c = this.cell, ci = Math.floor(x / c), cj = Math.floor(y / c), p = this.p, n = p.length;
    let best = 1e9, bi = -1, bt = 0;
    const [x0, y0, x1, y1] = this.bb; const far = Math.max(x0 - x, x - x1, y0 - y, y - y1, 0);
    const maxR = Math.ceil((far + (x1 - x0) + (y1 - y0)) / c) + 1;
    for (let r = 0; r <= maxR; r++) {
      for (let ii = ci - r; ii <= ci + r; ii++) for (let jj = cj - r; jj <= cj + r; jj++) {
        if (Math.max(Math.abs(ii - ci), Math.abs(jj - cj)) !== r) continue;
        const a = this.map.get(ii * 73856093 ^ jj * 19349663); if (!a) continue;
        for (const i of a) {
          const [ax, ay] = p[i], [bx, by] = p[(i + 1) % n], dx = bx - ax, dy = by - ay;
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
          const d = Math.hypot(x - ax - dx * t, y - ay - dy * t); if (d < best) { best = d; bi = i; bt = t; }
        }
      }
      if (best <= r * c) break;
    }
    if (bi < 0) return -1e9;
    // sign: side of the nearest edge (use neighbouring edge direction at vertices)
    let i = bi; if (bt >= 0.999) i = (bi + 1) % n; const [ax, ay] = p[i], [bx, by] = p[(i + 1) % n];
    let sx = bx - ax, sy = by - ay;
    if (bt <= 0.001 || bt >= 0.999) { const [qx, qy] = p[(i - 1 + n) % n]; sx += ax - qx; sy += ay - qy; }
    const cr = sx * (y - ay) - sy * (x - ax);
    return cr >= 0 ? best : -best;
  }
}

// ---------- fast signed-distance grid: scanline fill + Felzenszwalb EDT, exact only in a thin band at the edge ----------
function edt1(f, n, out, v, z) {
  let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s;
    for (;;) { const p = v[k]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= z[k] && k > 0) k--; else break; }
    if (s <= z[k]) { k = 0; v[0] = q; z[0] = -1e20; z[1] = 1e20; continue; }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; out[q] = (q - p) * (q - p) + f[p]; }
}
function edt2(grid, nx, ny) { // grid holds 0 (source) or 1e20; returns squared cell distances in place
  const m = Math.max(nx, ny), f = new Float64Array(m), o = new Float64Array(m), v = new Int32Array(m), z = new Float64Array(m + 1);
  for (let x = 0; x < nx; x++) { for (let y = 0; y < ny; y++) f[y] = grid[y * nx + x]; edt1(f, ny, o, v, z); for (let y = 0; y < ny; y++) grid[y * nx + x] = o[y]; }
  for (let y = 0; y < ny; y++) { for (let x = 0; x < nx; x++) f[x] = grid[y * nx + x]; edt1(f, nx, o, v, z); for (let x = 0; x < nx; x++) grid[y * nx + x] = o[x]; }
}
export function sdfGrid(poly, x0, y0, nx, ny, cs) {
  const n = poly.length, inside = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const y = y0 + j * cs, xs = [];
    for (let i = 0; i < n; i++) { const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % n]; if ((ay > y) !== (by > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const i0 = Math.max(0, Math.ceil((xs[k] - x0) / cs)), i1 = Math.min(nx - 1, Math.floor((xs[k + 1] - x0) / cs)); for (let i = i0; i <= i1; i++) inside[j * nx + i] = 1; }
  }
  const dIn = new Float64Array(nx * ny), dOut = new Float64Array(nx * ny);
  for (let k = 0; k < nx * ny; k++) { dIn[k] = inside[k] ? 1e20 : 0; dOut[k] = inside[k] ? 0 : 1e20; }
  edt2(dIn, nx, ny); edt2(dOut, nx, ny); // dIn: cells -> nearest outside cell; dOut: -> nearest inside cell
  const sd = new Float32Array(nx * ny), band = (2.2 * cs) ** 2, idx = new SegIndex(poly, 0.012);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i; const d2 = inside[k] ? dIn[k] : dOut[k];
    if (d2 <= band * 4) sd[k] = idx.signed(x0 + i * cs, y0 + j * cs); // exact near the edge
    else sd[k] = (inside[k] ? 1 : -1) * Math.max(0, Math.sqrt(d2) - 0.5) * cs;
  }
  return sd;
}
