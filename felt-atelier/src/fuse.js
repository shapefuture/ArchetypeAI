// Fuse — bind the 2D sewing record back onto the 3D plush.
//
// One sewing pass emits two things: real geometry (stuffed domes, a blanket-stitched rim, cut felt pieces, thread)
// and a flat draw record of everything it sewed. This module lifts that flat record back into 3D — z comes from the
// same inflation formula the builder stuffs the body with — and projects it through the live camera. So the 2D paths
// can be drawn straight onto the render, and the flat sticker can be registered to the silhouette. One record two ways,
// which is what makes the 2D and the 3D character the same object instead of two drawings that agree.
import * as THREE from 'three';
import { sdfGrid, normals } from './shapes.js';

const FELT_THICK = 0.0045; // the felt's own thickness, as the builder lays it down
const SETTLE = 0.9;        // stuffing settles: the relaxed dome sits just under the raw one

/**
 * Height of the stuffed front dome, rebuilt from the seam outline and the DNA's depth.
 * Mirrors Piece.raw()/relax() closely enough to land the flat record on the surface it was sewn onto.
 */
export function domeSampler(poly, depth, { cs = 0.0075, pad = 0.02 } = {}) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of poly) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const nx = Math.max(8, Math.ceil((x1 - x0 + 2 * pad) / cs) + 1), ny = Math.max(8, Math.ceil((y1 - y0 + 2 * pad) / cs) + 1);
  const sd = sdfGrid(poly, x0 - pad, y0 - pad, nx, ny, cs);
  let maxD = 0;
  for (let i = 0; i < sd.length; i++) if (sd[i] > maxD) maxD = sd[i];
  const R = maxD * 1.02, D = depth * 0.46 * Math.min(1.1, R / 0.22);
  const g = { x0: x0 - pad, y0: y0 - pad, cs, nx, ny, sd };
  const at = (x, y) => {
    const fx = (x - g.x0) / g.cs, fy = (y - g.y0) / g.cs;
    if (fx < 0 || fy < 0 || fx >= g.nx - 1 || fy >= g.ny - 1) return -1;
    const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, S = g.sd, k = j * g.nx + i;
    return (S[k] * (1 - u) + S[k + 1] * u) * (1 - v) + (S[k + g.nx] * (1 - u) + S[k + g.nx + 1] * u) * v;
  };
  const z = (x, y) => {
    const d = at(x, y);
    if (d <= 0) return 0;
    const s = Math.min(d / Math.max(0.02, R), 1);
    return D * Math.pow(1 - Math.pow(1 - s, 2.4), 0.55) * SETTLE + FELT_THICK * Math.min(1, d / 0.02);
  };
  z.R = R; z.D = D;
  return z;
}

/** Flat draw record -> overlay items, in body space. Sizes stay in body units and become pixels on projection. */
export function overlayItems(flat, dome) {
  const out = [];
  for (const rec of flat) {
    const front = rec.layer === 'front' || rec.layer === 'top';
    const lift = (x, y) => (front && dome ? dome(x, y) : 0);
    if (rec.t === 'body') {
      out.push({ kind: 'path', name: 'seam', closed: true, stroke: rec.thread, w: 0.011, fill: 'none', front: false, pts: rec.pts.map(([x, y]) => [x, y, 0]) });
      const nr = normals(rec.pts), step = Math.max(1, Math.round(0.05 / 0.0085)), pts = [];
      for (let i = 0; i < rec.pts.length; i += step) {
        const [x, y] = rec.pts[i], [nx, ny] = nr[i];
        pts.push([x - nx * 0.004, y - ny * 0.004, 0], [x + nx * 0.036, y + ny * 0.036, 0]);
      }
      out.push({ kind: 'pairs', name: 'ticks', stroke: rec.thread, w: 0.011, fill: 'none', front: false, pts });
    } else if (rec.t === 'poly') {
      out.push({ kind: 'path', name: 'piece', closed: true, fill: rec.fill, fillOpacity: 0.4, stroke: 'rgba(20,18,22,.45)', w: 0.0035, front, pts: rec.pts.map(([x, y]) => [x, y, lift(x, y)]) });
    } else if (rec.t === 'dash') {
      out.push({ kind: 'path', name: 'stitch', closed: false, stroke: rec.stroke, w: rec.w, dash: rec.dash, gap: rec.gap, front, pts: rec.pts.map(([x, y]) => [x, y, lift(x, y)]) });
    } else if (rec.t === 'line') {
      out.push({ kind: 'path', name: 'thread', closed: false, stroke: rec.stroke, w: rec.w, front, pts: rec.pts.map(([x, y]) => [x, y, lift(x, y)]) });
    } else if (rec.t === 'dot') {
      out.push({ kind: 'dot', name: 'knot', fill: rec.fill, r: rec.r, front, pts: [[rec.x, rec.y, lift(rec.x, rec.y)]] });
    }
  }
  for (const it of out) it.sp = new Float64Array(it.pts.length * 2);
  return out;
}

const _v = new THREE.Vector3();

/** Project every item through the live camera into stage pixels. Fills item.sp and item.box. */
export function projectItems(items, matrix, camera, W, H) {
  for (const it of items) {
    const sp = it.sp, pts = it.pts;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      _v.set(p[0], p[1], p[2]).applyMatrix4(matrix).project(camera);
      const sx = (_v.x * 0.5 + 0.5) * W, sy = (-_v.y * 0.5 + 0.5) * H;
      sp[i * 2] = sx; sp[i * 2 + 1] = sy;
      if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy;
    }
    it.box = [x0, y0, x1, y1];
  }
}

/** Screen pixels per body unit, measured on the seam outline (the one thing both views share exactly). */
export function pixelsPerUnit(seamItem) {
  if (!seamItem) return 300;
  let x0 = 1e9, x1 = -1e9;
  for (const [x] of seamItem.pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  const units = x1 - x0;
  if (!(units > 0)) return 300;
  return (seamItem.box[2] - seamItem.box[0]) / units;
}

/** Is the plush showing us its front? (Back-facing 2D records are the ones sewn on the reverse.) */
export function facing(matrix, cameraPos) {
  const n = _v.set(0, 0, 1).transformDirection(matrix);
  return n.dot(_camDir(cameraPos, matrix));
}
const _p = new THREE.Vector3();
function _camDir(cameraPos, matrix) {
  _p.setFromMatrixPosition(matrix);
  return _p.subVectors(cameraPos, _p).normalize();
}

/** viewBox of a generated sticker, so it can be registered to the projected silhouette. */
export function svgViewBox(svg) {
  const m = /viewBox="([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)"/.exec(svg);
  return m ? { x: +m[1], y: +m[2], w: +m[3], h: +m[4] } : null;
}

/** Bounding box of an item in sticker user units (y flipped, as the SVG is drawn with y down). */
export function userBox(item) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of item.pts) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    const sy = -y; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy;
  }
  return { x0, y0, x1, y1 };
}

/** Build the SVG `d` for an item from its projected points. */
export function pathOf(item, close = false) {
  const sp = item.sp, n = item.pts.length;
  if (!n) return '';
  let d = '';
  if (item.kind === 'pairs') {
    for (let i = 0; i + 1 < n; i += 2) d += `M${sp[i * 2].toFixed(1)} ${sp[i * 2 + 1].toFixed(1)}L${sp[i * 2 + 2].toFixed(1)} ${sp[i * 2 + 3].toFixed(1)}`;
    return d;
  }
  for (let i = 0; i < n; i++) d += (i ? 'L' : 'M') + sp[i * 2].toFixed(1) + ' ' + sp[i * 2 + 1].toFixed(1);
  return d + (close || item.closed ? 'Z' : '');
}
