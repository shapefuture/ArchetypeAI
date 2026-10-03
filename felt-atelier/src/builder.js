// Felt Atelier — builds a true-3D appliqué felt plush from DNA.
// Body = two stuffed felt pieces (inflated from the outline) joined by a blanket-stitched seam.
// Eyes, patches and rays are cut felt pieces conformed to the stuffed surface; embroidery is real thread geometry.
import * as THREE from 'three';
import Delaunator from 'delaunator';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SDF, outline, normals, inside, distTo, smoothPoly, resample, SegIndex, sdfGrid } from './shapes.js';
import { rng, TEMPLATE, feltHex, threadHex, FELT } from './dna.js';
// Builder is pure geometry (runs in a Web Worker). Materials are referenced by key and resolved by the host.
export const K = { felt: (hex, col, vc = false) => `f|${hex}|${col}|${vc ? 1 : 0}`, thread: (hex) => `t|${hex}`, fuzz: (hex) => `z|${hex}`, fibre: (hex) => `e|${hex}` };
// 2D record of everything sewn, in draw order (used for the flat sticker variant).
let FLAT = null;
let LAYER = null;
// Quality settings: 'hero' for the close-up, 'map' for crowds (fewer triangles, 3 draw calls per character).
let Q = { sdCell: 0.005, tubeSeg: 0.0035, radial: 6, body: 0.017, piece: 0.009, fuzz: true, fibres: 3, knot: 48, unify: false };
const LODS = { hero: Q, map: { sdCell: 0.008, tubeSeg: 0.009, radial: 4, body: 0.03, piece: 0.016, fuzz: false, fibres: 1, knot: 20, unify: true } };
const flat = (rec) => { if (FLAT) { if (LAYER) rec.layer = LAYER; FLAT.push(rec); } };

const BLACK = '#1d1c1f';
const outlineCache = new Map();

function baseOutline(name) {
  if (!outlineCache.has(name)) outlineCache.set(name, outline(SDF[name]));
  return outlineCache.get(name).map((p) => p.slice());
}

function noise1(r) { const ph = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28]; return (t) => 0.5 * Math.sin(t * 3 + ph[0]) + 0.3 * Math.sin(t * 5 + ph[1]) + 0.2 * Math.sin(t * 9 + ph[2]) + 0.12 * Math.sin(t * 15 + ph[3]); }
function noise2(r) { const ph = Array.from({ length: 6 }, () => r() * 6.28); return (x, y) => (Math.sin(x * 7.1 + ph[0]) * Math.sin(y * 6.3 + ph[1]) + 0.6 * Math.sin(x * 11.7 + y * 4.1 + ph[2]) * Math.sin(y * 13.3 - x * 3 + ph[3]) + 0.4 * Math.sin(x * 19 + ph[4]) * Math.sin(y * 17 + ph[5])) / 2; }

/** A piece of felt: outline polygon (world units) + height profile. */
class Piece {
  constructor(poly, { thick, rise, D = 0, R = 0, lump = null, twoSided = false }) {
    this.poly = poly; this.thick = thick; this.rise = rise; this.D = D; this.R = R; this.lump = lump; this.twoSided = twoSided;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    this.bb = [x0, x1, y0, y1];
    // Prior action (TRIZ 10): rasterise the signed distance field ONCE; every later query is an O(1) bilinear lookup.
    const pad = 0.012, cs = Q.sdCell;
    const nx = Math.max(8, Math.ceil((x1 - x0 + 2 * pad) / cs) + 1), ny = Math.max(8, Math.ceil((y1 - y0 + 2 * pad) / cs) + 1);
    const sd = sdfGrid(poly, x0 - pad, y0 - pad, nx, ny, cs);
    this.sdg = { x0: x0 - pad, y0: y0 - pad, cs, nx, ny, sd };
  }
  contains(x, y) { return this.sd(x, y) > 0; }
  sd(x, y) {
    const g = this.sdg, fx = (x - g.x0) / g.cs, fy = (y - g.y0) / g.cs;
    if (fx < 0 || fy < 0 || fx >= g.nx - 1 || fy >= g.ny - 1) return -1;
    const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, S = g.sd, k = j * g.nx + i;
    return (S[k] * (1 - u) + S[k + 1] * u) * (1 - v) + (S[k + g.nx] * (1 - u) + S[k + g.nx + 1] * u) * v;
  }
  raw(d) { const fl = this.flange || 0; if (d < fl) return 0; const s = Math.min((d - fl) / Math.max(0.02, this.R - fl), 1); return this.D * Math.pow(1 - Math.pow(1 - s, 2.4), 0.55); }
  relax(res = 150) { // stuffing settles: diffuse the dome so no straight-skeleton ridges remain
    const [x0, x1, y0, y1] = this.bb, pad = 0.01, w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad, cs = Math.max(w, h) / res;
    const nx = Math.ceil(w / cs) + 1, ny = Math.ceil(h / cs) + 1, z = new Float32Array(nx * ny), d = new Float32Array(nx * ny);
    const floor = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = x0 - pad + i * cs, y = y0 - pad + j * cs, sd = this.sd(x, y), k = j * nx + i; d[k] = sd; z[k] = sd > 0 ? this.raw(sd) : 0; floor[k] = sd > 0.028 ? z[k] * 0.82 : 0; }
    const t = new Float32Array(z.length);
    for (let it = 0; it < 40; it++) { for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const k = j * nx + i; t[k] = d[k] > 0.028 ? Math.max((z[k - 1] + z[k + 1] + z[k - nx] + z[k + nx]) * 0.25, floor[k]) : z[k]; } z.set(t); }
    this.grid = { x0: x0 - pad, y0: y0 - pad, cs, nx, ny, z };
  }
  relaxed(x, y, d) {
    const g = this.grid; if (!g) return this.raw(d);
    const fx = (x - g.x0) / g.cs, fy = (y - g.y0) / g.cs, i = Math.max(0, Math.min(g.nx - 2, Math.floor(fx))), j = Math.max(0, Math.min(g.ny - 2, Math.floor(fy))), u = fx - i, v = fy - j, Z = g.z;
    const zg = (Z[j * g.nx + i] * (1 - u) + Z[j * g.nx + i + 1] * u) * (1 - v) + (Z[(j + 1) * g.nx + i] * (1 - u) + Z[(j + 1) * g.nx + i + 1] * u) * v;
    const k = Math.min(1, Math.max(0, (d - 0.02) / 0.03)); return this.raw(d) * (1 - k) + zg * k;
  }
  profile(d, x, y) {
    if (this.D) { // stuffed body
      const s = Math.min(d / this.R, 1); let z = this.relaxed(x, y, d);
      if (this.lump) z += this.lump(x, y) * 0.045 * s * s;
      z -= 0.006 * Math.exp(-(((d - (this.flange || 0) - 0.03) / 0.012) ** 2)); // the stitch pulls a soft crease
      return z + this.thick * Math.min(d / 0.0008, 1);
    }
    const s = Math.min(d / this.rise, 1); return this.thick * Math.sqrt(1 - (1 - s) * (1 - s));
  }
}

class Surface {
  constructor() { this.body = null; this.layers = []; }
  base(x, y, layerIndex = this.layers.length) {
    let z = 0;
    if (this.body) { const d = this.body.sd(x, y); if (d > 0) z = this.body.profile(d, x, y); }
    for (let i = 0; i < layerIndex; i++) { const p = this.layers[i]; const d = p.sd(x, y); if (d > 0) z += p.profile(d, x, y); }
    return z;
  }
}

function polyArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return a / 2; }

/** Triangulate polygon interior with boundary rings + hex grid; returns points, d, triangles. */
function triangulate(piece, spacing, rings) {
  const poly = piece.poly; const inside = (_, x, y) => piece.sd(x, y) > 0; const distTo = (_, x, y) => Math.abs(piece.sd(x, y));
  const pts = poly.map((p) => p.slice()), dist = poly.map(() => 0), nb = poly.length;
  const nrm = normals(poly);
  for (const o of rings) {
    const ring = resample(poly.map((p, i) => [p[0] + nrm[i][0] * o, p[1] + nrm[i][1] * o]), Math.max(0.006, spacing * 0.6));
    for (const q of ring) { if (!inside(poly, q[0], q[1])) continue; const d = distTo(poly, q[0], q[1]); if (d < o * 0.6) continue; pts.push(q); dist.push(d); }
  }
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const minIn = (rings.length ? rings[rings.length - 1] : 0) + spacing * 0.6;
  for (let j = 0, y = y0; y <= y1; y += spacing * 0.866, j++) for (let x = x0 + (j % 2) * spacing * 0.5; x <= x1; x += spacing) {
    if (!inside(poly, x, y)) continue; const d = distTo(poly, x, y); if (d < minIn) continue; pts.push([x, y]); dist.push(d);
  }
  const del = Delaunator.from(pts);
  const tris = [];
  const maxE = spacing * 2.8;
  for (let t = 0; t < del.triangles.length; t += 3) {
    const a = del.triangles[t], b = del.triangles[t + 1], c = del.triangles[t + 2];
    const cx = (pts[a][0] + pts[b][0] + pts[c][0]) / 3, cy = (pts[a][1] + pts[b][1] + pts[c][1]) / 3;
    if (!inside(poly, cx, cy)) continue;
    const e = (i, k) => Math.hypot(pts[i][0] - pts[k][0], pts[i][1] - pts[k][1]);
    if (a < nb && b < nb && c < nb) continue; // sliver across boundary
    if (Math.max(e(a, b), e(b, c), e(c, a)) > maxE) continue;
    const cr = (pts[b][0] - pts[a][0]) * (pts[c][1] - pts[a][1]) - (pts[b][1] - pts[a][1]) * (pts[c][0] - pts[a][0]);
    if (cr > 0) tris.push(a, b, c); else tris.push(a, c, b);
  }
  return { pts, dist, tris, nb };
}

function pillowGeometry(piece, surface, layerIndex, { spacing = 0.016, rings, dimples = [], back = null, uvScale = 1.6, zSign = 1 }) {
  const { pts, dist, tris, nb } = triangulate(piece, spacing, rings);
  const pos = [], uv = [], idx = [];
  const dimple = (x, y) => { let k = 0; for (const [dx, dy, a] of dimples) { const q = ((x - dx) ** 2 + (y - dy) ** 2) / (0.0085 ** 2); if (q < 6) k += a * Math.exp(-q); } return k; };
  const front = (i) => { const [x, y] = pts[i]; const z = piece.profile(dist[i], x, y) - dimple(x, y); return layerIndex < 0 ? z : surface.base(x, y, layerIndex) + z; };
  for (let i = 0; i < pts.length; i++) { pos.push(pts[i][0], pts[i][1], zSign * front(i) + (layerIndex < 0 ? 0 : 0.0006 * zSign)); uv.push(pts[i][0] * uvScale + 0.5, pts[i][1] * uvScale + 0.5); }
  for (let t = 0; t < tris.length; t += 3) idx.push(tris[t], tris[t + 1], tris[t + 2]);
  if (back) { // second felt piece: mirrored, slightly different stuffing
    const off = pts.length, map = new Int32Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
      if (i < nb) { map[i] = i; continue; }
      const [x, y] = pts[i]; const s = Math.min(dist[i] / piece.R, 1);
      let z = piece.grid ? piece.relaxed(x, y, dist[i]) * 0.94 + back(x, y) * 0.016 * s * s + piece.thick * Math.min(dist[i] / 0.004, 1) - dimple(x, y) : piece.raw(dist[i]) * 0.92 + piece.thick * Math.min(dist[i] / 0.004, 1) - dimple(x, y);
      map[i] = pos.length / 3; pos.push(x, y, -z); uv.push(-x * uvScale + 0.5, y * uvScale + 0.5);
    }
    for (let t = 0; t < tris.length; t += 3) idx.push(map[tris[t]], map[tris[t + 2]], map[tris[t + 1]]);
    void off;
  } else if (layerIndex >= 0) { // cut-felt side wall sinking into what's below
    const base = pos.length / 3;
    for (let i = 0; i < nb; i++) { const [x, y] = pts[i]; pos.push(x, y, zSign * (surface.base(x, y, layerIndex) - 0.004)); uv.push(x * uvScale + 0.5, y * uvScale + 0.53); }
    for (let i = 0; i < nb; i++) { const j = (i + 1) % nb; idx.push(i, base + i, j, j, base + i, base + j); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (piece.D && back && piece.lump) { // baked cavity: the seam rolls under, the stitch line pulls a crease
    const col = [];
    for (let v = 0; v < pos.length / 3; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1]; const d = Math.max(0, piece.sd(x, y));
      const edge = 0.9 + 0.1 * Math.min(1, d / 0.03); const crease = 1 - 0.05 * Math.exp(-(((d - 0.045) / 0.012) ** 2));
      const k = edge * crease; col.push(k, k, k);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  }
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------- thread ----------
function tubeAlong(points, r, closed = false) {
  if (points.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal');
  const L = curve.getLength();
  const g = new THREE.TubeGeometry(curve, Math.max(3, Math.ceil(L / Q.tubeSeg)), r, Q.radial, closed);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L / (r * 9), uv.getY(i));
  return g;
}
function liftPath(surface, pts2, r, sink = 0.45, zSign = 1) {
  const out = [];
  for (let i = 0; i < pts2.length - 1; i++) {
    const [ax, ay] = pts2[i], [bx, by] = pts2[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.004));
    for (let k = 0; k < n; k++) { const t = k / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t; out.push([x, y, zSign * (surface.base(x, y) + r * sink)]); }
  }
  const [x, y] = pts2[pts2.length - 1]; out.push([x, y, zSign * (surface.base(x, y) + r * sink)]);
  return out;
}

const _c = new THREE.Color();
class Bag {
  constructor() { this.m = new Map(); }
  add(key, g) {
    if (!g) return;
    if (Q.unify && (key[0] === 'f' || key[0] === 't')) { // bake the felt/thread colour into vertices so one material serves every piece
      const [kind, hex, col] = key.split('|'); _c.set(hex);
      const n = g.attributes.position.count, old = g.getAttribute('color'), arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const k = old ? old.getX(i) : 1; arr[i * 3] = _c.r * k; arr[i * 3 + 1] = _c.g * k; arr[i * 3 + 2] = _c.b * k; }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      key = kind === 'f' ? `F|${col}` : 'T';
    }
    if (!this.m.has(key)) this.m.set(key, []); this.m.get(key).push(g);
  }
}

// ---------- building blocks ----------
function placed(name, cx, cy, scale, rot = 0, sx = 1, sy = 1) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return baseOutline(name).map(([x, y]) => { x *= scale * sx; y *= scale * sy; return [cx + x * c - y * s, cy + x * s + y * c]; });
}

function feltPiece(surface, bag, poly, hex, collection, { thick = 0.009, rise = 0.0045, stitch = null, zSign = 1 } = {}) {
  poly = resample(poly, 0.006);
  flat({ t: 'poly', pts: poly, fill: hex, layer: 'front' });
  const p = new Piece(poly, { thick, rise });
  const layer = surface.layers.length;
  const g = pillowGeometry(p, surface, layer, { spacing: Q.piece, rings: [0.0015, 0.0035, 0.006], uvScale: 1.6, zSign });
  bag.add(K.felt(hex, collection), g);
  surface.layers.push(p);
  if (stitch) runningStitch(surface, bag, poly, stitch, { inset: 0.011, zSign });
  return p;
}

function runningStitch(surface, bag, poly, hex, { inset = 0.011, dash = 0.011, gap = 0.008, r = 0.0032, zSign = 1 } = {}) {
  const nrm = normals(poly); const path = poly.map((p, i) => [p[0] + nrm[i][0] * inset, p[1] + nrm[i][1] * inset]);
  flat({ t: 'dash', pts: path, stroke: hex, w: r * 2.2, dash, gap, layer: 'front' });
  const pts = resample(path, 0.002); const L = pts.length * 0.002;
  const mat = K.thread(hex); let acc = 0, on = [];
  for (let i = 0; i <= pts.length; i++) {
    const q = pts[i % pts.length]; acc += 0.002; on.push(q);
    if (acc >= dash) { if (on.length > 1) bag.add(mat, tubeAlong(liftPath(surface, on, r, 0.3, zSign), r)); on = []; acc = -gap; }
    if (acc < 0) { on = []; }
  }
  void L;
}

function blanketStitch(surface, bag, poly, hex, R, { spacing = 0.05, tick = 0.036, r = 0.0066 } = {}) {
  // Real blanket stitch: each stitch enters the front felt `tick` inside the edge, wraps over the seam,
  // exits through the back; the purl loop rides along the very edge, joining stitch to stitch.
  const mat = K.thread(hex);
  const L = poly.length * 0.0085; const n = Math.max(12, Math.round(L / spacing));
  const pts = resample(poly, L / (n * 6)); const nrm = normals(pts);
  const dimples = [], purl = [];
  const zAt = (x, y, zs) => zs * (surface.base(x, y) + r * 0.45);
  for (let k = 0; k < n; k++) {
    const i = ((Math.round((k + 0.5) * pts.length / n + (R() - 0.5) * 1.8) % pts.length) + pts.length) % pts.length;
    const [px, py] = pts[i], [nx, ny] = nrm[i];
    const tl = tick * (0.82 + R() * 0.36), ang = (R() - 0.5) * 0.3;
    const ca = Math.cos(ang), sa = Math.sin(ang), dx = nx * ca - ny * sa, dy = nx * sa + ny * ca;
    const ex = px + dx * tl, ey = py + dy * tl;
    dimples.push([ex, ey, 0.004]);
    const rx = px + nx * 0.0045, ry = py + ny * 0.0045; // where the stitch meets the purl
    const path = [];
    for (let t = 0; t <= 7; t++) { const f = t / 7, x = ex + (rx - ex) * f, y = ey + (ry - ey) * f; path.push([x, y, zAt(x, y, 1)]); }
    path.push([px - nx * r * 0.6, py - ny * r * 0.6, zAt(rx, ry, 1) * 0.35]);
    path.push([px - nx * r * 1.05, py - ny * r * 1.05, 0]);
    path.push([px - nx * r * 0.6, py - ny * r * 0.6, zAt(rx, ry, -1) * 0.35]);
    for (let t = 0; t <= 7; t++) { const f = 1 - t / 7, x = ex + (rx - ex) * f, y = ey + (ry - ey) * f; path.push([x, y, zAt(x, y, -1)]); }
    bag.add(mat, tubeAlong(path, r));
    purl.push([px - nx * r * 0.3, py - ny * r * 0.3, zAt(rx, ry, 1) * 0.55]);
  }
  // purl loop: each segment sags slightly between stitches, like real floss under tension
  const loop = [];
  for (let k = 0; k < purl.length; k++) {
    const a = purl[k], b = purl[(k + 1) % purl.length];
    for (let t = 0; t < 4; t++) { const f = t / 4, sag = Math.sin(f * Math.PI) * r * 0.5; loop.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f - sag]); }
  }
  bag.add(mat, tubeAlong(loop, r * 0.95, true));
  return dimples;
}

function addFuzz(bag, geo, hex) {
  for (const k of [0.0022, 0.0045]) {
    const g = geo.clone(); const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { p.setXYZ(i, p.getX(i) + n.getX(i) * k, p.getY(i) + n.getY(i) * k, p.getZ(i) + n.getZ(i) * k); uv.setXY(i, uv.getX(i) * 2.3 + k * 40, uv.getY(i) * 2.3); }
    bag.add(K.fuzz(hex), g);
  }
}

function addEdgeFibres(bag, poly, hex, R) {
  const pos = [], uv = [];
  const pts = resample(poly, 0.0022), nn = normals(pts);
  for (let i = 0; i < pts.length; i++) for (let k = 0; k < Q.fibres; k++) {
    const [x, y] = pts[i], [nx, ny] = nn[i]; const a = (R() - 0.5) * 2.2, L = 0.003 + R() * R() * 0.011, z = (R() - 0.5) * 0.08;
    const dx = -(nx * Math.cos(a) - ny * Math.sin(a)), dy = -(nx * Math.sin(a) + ny * Math.cos(a));
    const bx = x - dx * 0.002, by = y - dy * 0.002, ex = x + dx * L, ey = y + dy * L, wx = -dy * 0.0012, wy = dx * 0.0012;
    pos.push(bx - wx, by - wy, z, ex - wx, ey - wy, z + (R() - 0.5) * 0.006, ex + wx, ey + wy, z, bx - wx, by - wy, z, ex + wx, ey + wy, z, bx + wx, by + wy, z);
    const u = R() * 0.9; uv.push(u, 0, u, 1, u + 0.02, 1, u, 0, u + 0.02, 1, u + 0.02, 0);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  bag.add(K.fibre(hex), g);
}

function knot(bag, surface, x, y, rad, hex, zSign = 1) {
  flat({ t: 'dot', x, y, r: rad * 0.85, fill: hex, layer: 'front' });
  const g = new THREE.TorusKnotGeometry(rad * 0.55, rad * 0.36, Q.knot, Q.radial + 2, 2, 5);
  g.scale(1, 1, 0.62); g.rotateZ(x * 40 + y * 13);
  g.translate(x, y, zSign * (surface.base(x, y) + rad * 0.3));
  bag.add(K.thread(hex), g);
}

function arcPath(cx, cy, w, bow, n = 14) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n * 2 - 1; out.push([cx + t * w, cy - bow * (1 - t * t)]); } return out; }

function satin(surface, bag, path, hex, r = 0.0082) { // two tight parallel strands = satin stitch line
  flat({ t: 'line', pts: path, stroke: hex, w: r * 3.4, layer: 'front' });
  const nrm = path.map((p, i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)]; const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1; return [-ty / l, tx / l]; });
  for (const o of [-r * 0.75, r * 0.75]) bag.add(K.thread(hex), tubeAlong(liftPath(surface, path.map((p, i) => [p[0] + nrm[i][0] * o, p[1] + nrm[i][1] * o]), r, 0.35), r));
}
function backStitch(surface, bag, path, hex, r = 0.0062, seg = 0.02) {
  flat({ t: 'line', pts: path, stroke: hex, w: r * 2.4, layer: 'front' });
  const pts = resample(path.concat([path[path.length - 1]]).slice(0, -1), 0.002);
  // open path resample: simple walk
  const open = []; let acc = 0; open.push(path[0]);
  for (let i = 1; i < path.length; i++) { open.push(path[i]); }
  const dense = []; for (let i = 0; i < open.length - 1; i++) { const [ax, ay] = open[i], [bx, by] = open[i + 1]; const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.002)); for (let k = 0; k < n; k++) dense.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n]); }
  dense.push(open[open.length - 1]);
  let cur = [];
  for (const q of dense) { cur.push(q); acc += 0.002; if (acc >= seg) { bag.add(K.thread(hex), tubeAlong(liftPath(surface, cur, r, 0.25), r)); cur = [q]; acc = 0; } }
  if (cur.length > 1) bag.add(K.thread(hex), tubeAlong(liftPath(surface, cur, r, 0.25), r));
  void pts;
}

// ---------- the character ----------
function buildParts(dna) {
  const R = rng(dna.seed);
  const surface = new Surface();
  const bag = new Bag();
  const col = dna.collection;
  const bodyHex = feltHex(col, dna.felt);
  const tHex = threadHex(dna);
  const tm = TEMPLATE[dna.body.t];
  const { w, h, lean, wobble, depth } = dna.body;
  const xf = (x, y) => [x * w + y * lean * 0.22, y * h];

  // body outline: template -> proportions -> hand-cut wobble
  let poly = baseOutline(dna.body.t).map(([x, y]) => xf(x, y));
  const nz = noise1(R); const nrm0 = normals(poly);
  poly = poly.map(([x, y], i) => { const t = (i / poly.length) * Math.PI * 2, a = nz(t) * 0.011 * wobble; return [x - nrm0[i][0] * a, y - nrm0[i][1] * a]; });
  poly = resample(smoothPoly(poly, 2), 0.0085);

  // stuffed body
  const probe = new Piece(poly, { thick: 0, rise: 0 }); const SI0 = { signed: (x, y) => probe.sd(x, y) }; let maxD = 0; for (let i = 0; i < 500; i++) { const x = (R() - 0.5) * 1.2, y = (R() - 0.5) * 1.2; maxD = Math.max(maxD, probe.sd(x, y)); }
  const bodyR = maxD * 1.02;
  const lumpF = noise2(R), lumpB = noise2(R);
  const body = new Piece(poly, { thick: 0.0045, D: depth * 0.46 * Math.min(1.1, bodyR / 0.22), R: bodyR, lump: lumpF });
  body.flange = 0.012; body.relax(); surface.body = body;

  // Self: layered felt rays sandwiched in the seam
  if (dna.body.t === 'sun') {
    const raysA = new Piece(resample(placed('rays', 0, 0, 1.28), 0.007), { thick: 0.007, D: 0.012, R: 0.03 });
    const raysB = new Piece(resample(placed('rays2', 0, 0, 1.18), 0.007), { thick: 0.007, D: 0.016, R: 0.03 });
    const hexA = feltHex(col, col === 'wool' ? 'orange' : 'orange'), hexB = feltHex(col, col === 'wool' ? 'mustard' : 'sunflower');
    const gA = pillowGeometry(raysA, surface, -1, { spacing: 0.014, rings: [0.003, 0.008], back: () => 0 });
    gA.translate(0, 0, -0.012);
    const gB = pillowGeometry(raysB, surface, -1, { spacing: 0.014, rings: [0.003, 0.008], back: () => 0 });
    bag.add(K.felt(hexA, col), gA); bag.add(K.felt(hexB, col), gB);
    flat({ t: 'poly', pts: raysA.poly, fill: hexA, layer: 'back' }); flat({ t: 'poly', pts: raysB.poly, fill: hexB, layer: 'back' });
    const sA = new Surface(); sA.body = raysA; const sB = new Surface(); sB.body = raysB;
    LAYER = 'back'; runningStitch(sA, bag, raysA.poly, threadHex({ ...dna, felt: 'orange' }), { inset: 0.012 });
    runningStitch(sB, bag, raysB.poly, threadHex({ ...dna, felt: col === 'wool' ? 'mustard' : 'sunflower' }), { inset: 0.012 }); LAYER = null;
  }

  // seam + stitches first (dimples deform the body)
  const dimples = blanketStitch(surface, bag, poly, tHex, R);
  const bodyGeo = pillowGeometry(body, surface, -1, { spacing: Q.body, rings: [0.0006, 0.004, 0.009, 0.013, 0.018, 0.026, 0.038, 0.054, 0.076], dimples, back: lumpB, uvScale: 1.0 });
  bag.add(K.felt(bodyHex, col, true), bodyGeo);
  flat({ t: 'body', pts: poly, fill: bodyHex, thread: tHex, layer: 'body' });
  if (Q.fuzz) addFuzz(bag, bodyGeo, bodyHex);
  addEdgeFibres(bag, poly, bodyHex, R);

  // decorative seam (pill)
  if (dna.extra?.seam) runningStitch(surface, bag, resample([[0.005, poly.reduce((m, p) => Math.min(m, p[1]), 1) + 0.03], [0.005, poly.reduce((m, p) => Math.max(m, p[1]), -1) - 0.03]], 0.004), tHex, { inset: 0 });
  if (dna.body.t === 'sun') runningStitch(surface, bag, placed('disc', 0, 0, 0.58), tHex, { inset: 0 });

  // ---- face ----
  const E = dna.eyes; const S = E.size;
  let [ecx, ecy] = xf(tm.eyeX || 0, tm.eyeY + E.y - (tm.bumpEyes ? 0 : 0.025));
  let gap = tm.eyeGap * E.gap * w;
  if (tm.bumpEyes) gap = 0.52 * w;
  const eyePos = [[ecx - gap / 2, ecy], [ecx + gap / 2, ecy]];
  const re = (tm.bumpEyes ? 0.105 : 0.082) * S * (tm.small ? 0.85 : 1) * (E.wide ? 1.12 : 1);
  const white = feltHex(col, col === 'wool' ? 'snow' : 'cream');
  const black = BLACK;
  const button = (x, y, gaze, { lid = 0 } = {}) => {
    feltPiece(surface, bag, placed('disc', x, y, re * 2), white, col, { thick: 0.008 });
    const pr = re * 0.6; const px = x + gaze[0] * re * 0.32, py = y + gaze[1] * re * 0.32;
    feltPiece(surface, bag, placed('disc', px, py, pr * 2), black, col, { thick: 0.006 });
    if (lid > 0) {
      const lidHex = new THREE.Color(bodyHex).multiplyScalar(0.82).getHexString();
      feltPiece(surface, bag, placed('lid', x, y + re * (1 - lid * 2) * 0.0, re * 2.12).map(([u, v]) => [u, v + re * (0.5 - lid) * 0.9]), '#' + lidHex, col, { thick: 0.006 });
    }
  };
  const sideEye = (x, y, dir) => {
    feltPiece(surface, bag, placed('oval', x, y, re * 2.25), white, col, { thick: 0.008 });
    feltPiece(surface, bag, placed('disc', x + dir * re * 0.55, y - re * 0.05, re * 1.1), black, col, { thick: 0.006 });
  };
  const ew = 0.072 * S * (tm.small ? 0.85 : 1);
  switch (E.style) {
    case 'button': eyePos.forEach(([x, y]) => button(x, y, E.gaze)); break;
    case 'halflid': eyePos.forEach(([x, y]) => button(x, y, [E.gaze[0], -0.15], { lid: E.lid || 0.5 })); break;
    case 'side': eyePos.forEach(([x, y]) => sideEye(x, y, E.gaze[0] || 1)); break;
    case 'dot': eyePos.forEach(([x, y]) => feltPiece(surface, bag, placed('disc', x + E.gaze[0] * 0.006, y, 0.082 * S * (tm.small ? 0.88 : 1)), black, col, { thick: 0.008 })); break;
    case 'arc': eyePos.forEach(([x, y]) => satin(surface, bag, arcPath(x, y, ew, -0.022), black)); break;
    case 'lash': eyePos.forEach(([x, y], k) => { satin(surface, bag, arcPath(x, y, ew, -0.022), black); for (let j = 0; j < 3; j++) { const t = (j - 1) * 0.6, lx = x + t * ew, ly = y + 0.022 * (1 - t * t); const dx = (k ? 1 : -1) * 0.006 + t * 0.008; backStitch(surface, bag, [[lx, ly - 0.004], [lx + dx, ly - 0.02]], black, 0.0035, 0.03); } }); break;
    case 'line': eyePos.forEach(([x, y], k) => satin(surface, bag, [[x - ew, y + (k ? -0.004 : 0.004)], [x + ew, y + (k ? 0.004 : -0.004)]], black)); break;
    case 'wink': button(eyePos[0][0], eyePos[0][1], E.gaze); satin(surface, bag, arcPath(eyePos[1][0], eyePos[1][1], ew * 0.9, 0.02), black); break;
  }
  if (E.brow === 'stern' || E.brow === 'worried') {
    eyePos.forEach(([x, y], k) => { const s = k ? 1 : -1, by = y + (E.style === 'dot' ? 0.065 : re + 0.032); const tilt = (E.brow === 'stern' ? -1 : 1) * 0.016; satin(surface, bag, [[x - s * 0.05, by + tilt], [x + s * 0.045, by - tilt]], black, 0.0068); });
  }
  // mouth
  const my = ecy - (E.style === 'dot' || E.style === 'arc' || E.style === 'line' || E.style === 'lash' ? 0.075 : re + 0.055) * (tm.small ? 0.85 : 1);
  const mw = 0.055;
  switch (dna.mouth.style) {
    case 'smile': backStitch(surface, bag, arcPath(ecx, my, mw, 0.022), black); break;
    case 'frown': backStitch(surface, bag, arcPath(ecx, my - 0.018, mw * 0.85, -0.016), black); break;
    case 'line': backStitch(surface, bag, [[ecx - mw * 0.7, my], [ecx + mw * 0.7, my]], black); break;
    case 'smirk': backStitch(surface, bag, [[ecx - mw * 0.8, my + 0.003], [ecx + mw * 0.3, my - 0.004], [ecx + mw * 0.9, my + 0.012]], black); break;
    case 'wobble': backStitch(surface, bag, Array.from({ length: 9 }, (_, i) => [ecx - mw + i * mw / 4, my + Math.sin(i * 1.7) * 0.006]), black); break;
    case 'o': { const c = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * 6.283; c.push([ecx + Math.cos(a) * 0.017, my - 0.006 + Math.sin(a) * 0.021]); } backStitch(surface, bag, c, black, 0.0042, 0.014); break; }
  }

  // ---- cosmic patch ----
  const P = dna.patch;
  if (P.t !== 'none') {
    let sc = 1.55 * P.scale * (tm.small ? 0.85 : 1); const rot = (P.rot * Math.PI) / 180;
    const [zx, zy] = xf(...tm.zones[P.zone % tm.zones.length]);
    const eyeR = ['button', 'side', 'halflid', 'wink'].includes(E.style) ? re + 0.03 : E.style === 'dot' ? 0.06 : ew + 0.02;
    const face = eyePos.map(([x, y]) => [x, y, eyeR]).concat(dna.mouth.style !== 'none' ? [[ecx, my, 0.05]] : []);
    let best = null;
    for (const shrink of [1, 0.85, 0.72, 0.6]) {
      const pr = (P.t === 'comet' ? 0.15 : P.t === 'planet' ? 0.12 : 0.105) * sc * shrink; let bs = 1e9;
      for (let gy = -0.5; gy <= 0.5; gy += 0.015) for (let gx = -0.6; gx <= 0.6; gx += 0.015) {
        if (SI0.signed(gx, gy) < pr * 0.78 + 0.035) continue;
        if (face.some(([fx, fy, fr]) => Math.hypot(gx - fx, gy - fy) < fr + pr * 0.9)) continue;
        const d2 = Math.hypot(gx - zx, gy - zy); if (d2 < bs) { bs = d2; best = [gx, gy]; }
      }
      if (best) { sc *= shrink; break; }
    }
    if (!best) { best = [zx, zy]; sc *= 0.6; }
    const [cx, cy] = best;
    {
    const pHex = feltHex(col, P.felt), p2Hex = feltHex(col, P.felt2 || 'cream');
    const pThread = threadHex({ collection: col, felt: P.felt, thread: 'tone' });
    switch (P.t) {
      case 'planet': {
        const ring2 = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; const u = Math.cos(a) * 0.11 * sc, v = Math.sin(a) * 0.032 * sc; ring2.push([cx + u * Math.cos(rot) - v * Math.sin(rot), cy + u * Math.sin(rot) + v * Math.cos(rot), Math.sin(a) < 0]); }
        const rh2 = p2Hex === pHex ? white : p2Hex;
        flat({ t: 'line', pts: ring2.filter((q) => !q[2]), stroke: rh2, w: 0.02, layer: 'front' });
        feltPiece(surface, bag, placed('disc', cx, cy, 0.13 * sc), pHex, col, { thick: 0.008, stitch: pThread });
        flat({ t: 'line', pts: ring2.filter((q) => q[2]), stroke: rh2, w: 0.02, layer: 'front' });
        const ring = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; const u = Math.cos(a) * 0.11 * sc, v = Math.sin(a) * 0.032 * sc; ring.push([cx + u * Math.cos(rot) - v * Math.sin(rot), cy + u * Math.sin(rot) + v * Math.cos(rot), Math.sin(a) < 0 ? 1 : 0]); }
        const rr = 0.0105; const rh = p2Hex === pHex ? white : p2Hex;
        const pts3 = ring.map(([x, y, front]) => [x, y, surface.base(x, y) + (front ? rr * 1.6 : rr * 0.3)]);
        const rg = tubeAlong(pts3, rr, true); rg.scale(1, 1, 1); bag.add(K.felt(rh, col), rg);
        break;
      }
      case 'moon': feltPiece(surface, bag, placed('moon', cx, cy, 0.17 * sc, rot), pHex, col, { thick: 0.008, stitch: pThread }); break;
      case 'star': feltPiece(surface, bag, placed('star5', cx, cy, 0.16 * sc, rot * 0.5), pHex, col, { thick: 0.008, stitch: pThread }); break;
      case 'comet': {
        const ta = rot - 2.4; const tx = cx + Math.cos(ta + 3.14) * 0.0, ty = cy;
        feltPiece(surface, bag, placed('flame', tx + 0.05 * sc, ty + 0.045 * sc, 0.24 * sc, rot), p2Hex === pHex ? feltHex(col, PATCH_FALLBACK[col]) : p2Hex, col, { thick: 0.007 });
        feltPiece(surface, bag, placed('disc', cx - 0.03 * sc, cy - 0.025 * sc, 0.09 * sc), pHex, col, { thick: 0.008, stitch: pThread });
        break;
      }
      case 'orbit': {
        feltPiece(surface, bag, placed('disc', cx, cy, 0.075 * sc), pHex, col, { thick: 0.008 });
        const ring = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; const u = Math.cos(a) * 0.085 * sc, v = Math.sin(a) * 0.05 * sc; ring.push([cx + u * Math.cos(rot) - v * Math.sin(rot), cy + u * Math.sin(rot) + v * Math.cos(rot)]); }
        backStitch(surface, bag, ring.concat([ring[0]]), pHex === white ? tHex : pHex, 0.0034, 0.012);
        knot(bag, surface, ring[8][0], ring[8][1], 0.013, pHex);
        break;
      }
      case 'constellation': {
        const n = 4 + Math.floor(R() * 2); const st = [];
        for (let i = 0; i < n; i++) { const a = rot + i * 1.25 + R() * 0.4, rad = 0.05 + R() * 0.06; st.push([cx + Math.cos(a) * rad * sc + (i - n / 2) * 0.022 * sc, cy + Math.sin(a) * rad * sc * 0.7]); }
        st.sort((a, b) => a[0] - b[0]);
        for (let i = 0; i < n - 1; i++) backStitch(surface, bag, [st[i], st[i + 1]], pHex, 0.0036, 0.05);
        st.forEach(([x, y]) => knot(bag, surface, x, y, 0.02, pHex));
        break;
      }
    }
    }
  }
  if (dna.topper && dna.topper.t !== 'none') addTopper(dna, poly, bag, R, col, w);
  if (dna.earned?.includes('star')) feltPiece(surface, bag, placed('star5', tm.zones[0][0] * -1, 0.25, 0.08), feltHex(col, col === 'wool' ? 'gold' : 'yellow'), col, { thick: 0.007 });

  // merge geometry per material key
  const parts = [];
  for (const [key, geos] of bag.m) {
    const g = mergeGeometries(geos.map((x) => (x.index ? x.toNonIndexed() : x)).map((x) => { ['uv1', 'uv2'].forEach((a) => x.getAttribute(a) && x.deleteAttribute(a)); return x; }), false);
    if (g) parts.push({ key, geo: g });
  }
  return parts;
}

/** Pure build: geometry per material key + 2D draw record. Safe to run in a worker. */
export function buildData(dna, { lod = 'hero' } = {}) {
  FLAT = []; Q = LODS[lod] || LODS.hero;
  try { const parts = buildParts(dna); return { parts, flat: FLAT, size: dna.size }; } finally { FLAT = null; Q = LODS.hero; }
}

const PATCH_FALLBACK = { wool: 'gold', bright: 'yellow' };

// ---------- 3D toppers: felt pieces and wires that stick out of the seam ----------
function standingFelt(bag, name, scale, hex, col, M, { D = 0.014, stitchHex = null, z = 0 } = {}) {
  const poly = resample(placed(name, 0, 0, scale), 0.006);
  const pc = new Piece(poly, { thick: 0.005, D, R: 0.025 });
  const g = pillowGeometry(pc, null, -1, { spacing: 0.012, rings: [0.002, 0.006, 0.012], back: () => 0, uvScale: 1.6 });
  const v = new THREE.Vector3(); const tp = (pts) => pts.map(([x, y]) => { v.set(x, y, 0).applyMatrix4(M); return [v.x, v.y]; });
  flat({ t: 'poly', pts: tp(poly), fill: hex, layer: 'back' });
  if (stitchHex) { const nr = normals(poly); flat({ t: 'dash', pts: tp(poly.map((p, i) => [p[0] + nr[i][0] * 0.012, p[1] + nr[i][1] * 0.012])), stroke: stitchHex, w: 0.007, dash: 0.011, gap: 0.008, layer: 'back' }); }
  g.translate(0, 0, z); g.applyMatrix4(M); bag.add(K.felt(hex, col), g);
  if (stitchHex) {
    const sf = new Surface(); sf.body = pc;
    for (const zs of [1, -1]) {
      const sub = new Bag(); const keep = FLAT; FLAT = null; runningStitch(sf, sub, poly, stitchHex, { inset: 0.012, zSign: zs }); FLAT = keep;
      for (const [m, gs] of sub.m) gs.forEach((q) => { q.translate(0, 0, z); q.applyMatrix4(M); bag.add(m, q); });
    }
  }
}
function tackX(bag, x, y, z, hex, s = 0.016, r = 0.0045) {
  bag.add(K.thread(hex), tubeAlong([[x - s, y - s, z - 0.004], [x, y, z + r], [x + s, y + s, z - 0.004]], r));
  bag.add(K.thread(hex), tubeAlong([[x - s, y + s, z - 0.004], [x, y, z + r], [x + s, y - s, z - 0.004]], r));
}
function feltBall(bag, r, hex, col, pos) { flat({ t: 'dot', x: pos[0], y: pos[1], r, fill: hex, layer: 'back' }); const g = new THREE.SphereGeometry(r, 28, 18); g.scale(1, 1, 0.9); g.translate(...pos); bag.add(K.felt(hex, col), g); }
function frame(P, dir) { const ang = Math.atan2(-dir[0], dir[1]); return new THREE.Matrix4().makeTranslation(P[0], P[1], P[2] || 0).multiply(new THREE.Matrix4().makeRotationZ(ang)); }

function addTopper(dna, poly, bag, R, col, w) {
  const T = dna.topper; const hex = feltHex(col, T.felt), hex2 = feltHex(col, T.felt2 || 'cream');
  const nrm = normals(poly);
  // attachment: highest seam point near the requested side offset
  const tx = T.side * 0.32 * w; let bi = 0, by = -1e9;
  poly.forEach(([x, y], i) => { const sc = y - Math.abs(x - tx) * 0.9; if (nrm[i][1] < -0.2 && sc > by) { by = sc; bi = i; } });
  const [px, py] = poly[bi]; let out = [-nrm[bi][0], -nrm[bi][1]];
  const tilt = T.tilt * 0.6; const ca = Math.cos(tilt), sa = Math.sin(tilt); out = [out[0] * ca - out[1] * sa, out[0] * sa + out[1] * ca];
  const up = [out[0] * 0.5, 0.5 + out[1] * 0.5]; const ul = Math.hypot(...up); const dir = [up[0] / ul, up[1] / ul];
  const at = (k) => [px + dir[0] * k, py + dir[1] * k, 0];
  const stemHex = feltHex(col, col === 'wool' ? 'forest' : 'green');
  const thread = (pts, r, h) => { flat({ t: 'line', pts, stroke: h, w: r * 2.2, layer: 'back' }); bag.add(K.thread(h), tubeAlong(pts, r)); };
  const collar = () => { const M = frame([px - dir[0] * 0.005, py - dir[1] * 0.005, 0], dir); standingFelt(bag, 'disc', 0.05, stemHex, col, M, { D: 0.012 }); tackX(bag, px - dir[0] * 0.03, py - dir[1] * 0.03, 0.03, threadHex({ ...dna }), 0.01, 0.0042); };
  const curve = (len, bend) => Array.from({ length: 9 }, (_, i) => { const t = i / 8; const b = Math.sin(t * Math.PI) * bend; return [px - dir[0] * 0.03 + dir[0] * len * t + dir[1] * b, py - dir[1] * 0.03 + dir[1] * len * t - dir[0] * b, 0]; });
  switch (T.t) {
    case 'planetStalk': {
      collar(); const c = curve(0.2, 0.035 * Math.sign(T.tilt || 1)); thread(c, 0.009, hex2 === hex ? '#4a4038' : stemHex);
      const e = c[c.length - 1], cpos = [e[0] + dir[0] * 0.07, e[1] + dir[1] * 0.07, 0];
      feltBall(bag, 0.078, hex, col, cpos);
      const ring = new THREE.TorusGeometry(0.125, 0.013, 10, 64); ring.scale(1, 1, 0.55); ring.rotateX(1.25); ring.rotateZ(0.35 + T.tilt); ring.translate(...cpos);
      bag.add(K.felt(hex2 === hex ? feltHex(col, PATCH_FALLBACK[col]) : hex2, col), ring);
      { const rc = hex2 === hex ? feltHex(col, PATCH_FALLBACK[col]) : hex2, a0 = 0.35 + T.tilt; const el = (from, to) => Array.from({ length: 25 }, (_, i) => { const a = from + (to - from) * i / 24; const u = Math.cos(a) * 0.125, w2 = Math.sin(a) * 0.125 * Math.cos(1.25) * 0.55; return [cpos[0] + u * Math.cos(a0) - w2 * Math.sin(a0), cpos[1] + u * Math.sin(a0) + w2 * Math.cos(a0)]; });
        const ballIdx = FLAT.length - 1; FLAT.splice(ballIdx, 0, { t: 'line', pts: el(Math.PI, 2 * Math.PI), stroke: rc, w: 0.026, layer: 'back' }); flat({ t: 'line', pts: el(0, Math.PI), stroke: rc, w: 0.026, layer: 'back' }); }
      break;
    }
    case 'cometTail': {
      const M = frame(at(0.21), dir);
      standingFelt(bag, 'tail', 0.66, hex, col, M, { stitchHex: threadHex({ collection: col, felt: T.felt, thread: 'tone' }) });
      standingFelt(bag, 'tail', 0.4, feltHex(col, col === 'wool' ? 'butter' : 'yellow'), col, M.clone().multiply(new THREE.Matrix4().makeTranslation(0, -0.05, 0)), { D: 0.012, z: 0.02 });
      break;
    }
    case 'saturnRing': {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; poly.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
      const ring = new THREE.TorusGeometry((x1 - x0) * 0.53, 0.024, 12, 120); ring.scale(1, 1, 0.5); ring.rotateX(1.47); ring.rotateZ(T.tilt * 0.5);
      ring.rotateZ(0.32 * Math.sign(T.tilt || 1)); ring.translate((x0 + x1) / 2, (y0 + y1) / 2 - (y1 - y0) * 0.3, 0);
      bag.add(K.felt(hex, col), ring);
      { const cx2 = (x0 + x1) / 2, cy2 = (y0 + y1) / 2 - (y1 - y0) * 0.3, Rr2 = (x1 - x0) * 0.53, rz = 0.32 * Math.sign(T.tilt || 1) + T.tilt * 0.5, k = Math.cos(1.47);
        const el = (from, to) => Array.from({ length: 41 }, (_, i) => { const a = from + (to - from) * i / 40; const u = Math.cos(a) * Rr2, w2 = Math.sin(a) * Rr2 * k + 0.0; return [cx2 + u * Math.cos(rz) - w2 * Math.sin(rz), cy2 + u * Math.sin(rz) + w2 * Math.cos(rz)]; });
        flat({ t: 'line', pts: el(Math.PI, 2 * Math.PI), stroke: hex, w: 0.04, layer: 'back' }); flat({ t: 'line', pts: el(0, Math.PI), stroke: hex, w: 0.04, layer: 'top' }); }
      // tack the ring to the body where it crosses in front
      const cxr = (x0 + x1) / 2, cyr = (y0 + y1) / 2 - (y1 - y0) * 0.08, Rr = (x1 - x0) * 0.56;
      void cxr; void cyr; void Rr;
      break;
    }
    case 'starSprout': {
      collar(); const c = curve(0.15, 0.03); thread(c, 0.009, stemHex);
      const e = c[c.length - 1]; standingFelt(bag, 'star5', 0.3, hex, col, frame([e[0] + dir[0] * 0.11, e[1] + dir[1] * 0.11, 0], dir), { D: 0.02, stitchHex: threadHex({ collection: col, felt: T.felt, thread: 'tone' }) });
      standingFelt(bag, 'oval', 0.13, stemHex, col, frame([c[3][0] + dir[1] * 0.03, c[3][1] - dir[0] * 0.03, 0], [dir[0] + dir[1], dir[1] - dir[0]]), { D: 0.008 });
      break;
    }
    case 'moonCrest': standingFelt(bag, 'moon', 0.4, hex, col, frame(at(0.07), [dir[0] * 0.7 - dir[1] * 0.7, dir[1] * 0.7 + dir[0] * 0.7]), { D: 0.018, stitchHex: threadHex({ collection: col, felt: T.felt, thread: 'tone' }) }); break;
    case 'orbitMoon': {
      collar(); const c = curve(0.19, -0.06 * Math.sign(T.side || 1)); bag.add(K.felt(feltHex(col, col === 'wool' ? 'slate' : 'grey'), col), tubeAlong(c, 0.0085)); flat({ t: 'line', pts: c, stroke: feltHex(col, col === 'wool' ? 'slate' : 'grey'), w: 0.017, layer: 'back' });
      const e = c[c.length - 1];
      standingFelt(bag, 'moon', 0.24, hex, col, frame([e[0] + dir[0] * 0.07, e[1] + dir[1] * 0.07, 0], [dir[0] - dir[1] * 0.4, dir[1] + dir[0] * 0.4]), { D: 0.018, stitchHex: threadHex({ collection: col, felt: T.felt, thread: 'tone' }) });
      break;
    }
  }
}
void FELT; void polyArea;
