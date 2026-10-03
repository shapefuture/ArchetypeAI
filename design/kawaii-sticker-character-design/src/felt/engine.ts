// Bridge to the Felt Atelier engine. Nothing about felt is re-implemented here: this app imports the same
// sewing code the atelier uses (felt-atelier/src), so a part in this app is the same real object — two cut
// felt pieces inflated into stuffed domes, blanket-stitched at the rim, felt eyes and patches laid on top —
// rendered two ways: real 3D geometry, or the flat 2D sticker cut from the very same sewing record.
import * as THREE from 'three';
import { buildData } from '../../../../felt-atelier/src/builder.js';
import { toSVG } from '../../../../felt-atelier/src/flat.js';
import { generate, hashStr, oklab, deltaE, FELT, dnaHash, describe, lint, feltHex } from '../../../../felt-atelier/src/dna.js';
import { makeGroup } from '../../../../felt-atelier/src/assemble.js';
import { setupStage, toneSafeBackground, Scaler } from '../../../../felt-atelier/src/stage.js';

export { THREE, buildData, toSVG, generate, hashStr, oklab, deltaE, FELT, dnaHash, describe, lint, feltHex, makeGroup, setupStage, toneSafeBackground, Scaler };

export type Dna = Record<string, any>;
export type Lod = 'hero' | 'map';
export type Sewn = { svg: string; parts: any[]; flat: any[]; size: number; ms: number; tris: number };

/** Sew one character: geometry per material key + the flat draw record + the 2D sticker, all from one pass. */
export function sew(dna: Dna, lod: Lod = 'map'): Sewn {
  const t0 = performance.now();
  const built = buildData(dna, { lod });
  let tris = 0;
  for (const p of built.parts) tris += p.geo.attributes.position.count / 3; // non-indexed triangles
  return {
    svg: toSVG(built.flat, { id: 'f' + dnaHash(dna).toString(36), title: describe(dna) }),
    parts: built.parts,
    flat: built.flat,
    size: built.size,
    ms: performance.now() - t0,
    tris,
  };
}

// ---------- progressive sewing: one character per idle slice, so the UI never stalls ----------
const cache = new Map<string, Sewn>();
type Job = { key: string; dna: Dna; lod: Lod; done: (s: Sewn) => void };
const queue: Job[] = [];
let pumping = false;
const idle: (f: () => void) => void =
  typeof requestIdleCallback === 'function' ? (f) => requestIdleCallback(() => f(), { timeout: 120 }) : (f) => setTimeout(f, 0);

function pump() {
  if (pumping) return;
  pumping = true;
  const step = () => {
    const job = queue.shift();
    if (!job) { pumping = false; return; }
    const s = cache.get(job.key) ?? sew(job.dna, job.lod);
    cache.set(job.key, s);
    job.done(s);
    idle(step);
  };
  idle(step);
}

export const sewKey = (dna: Dna, lod: Lod) => dnaHash(dna) + ':' + lod;

/** Sew, but in the background. Returns an unsubscribe. Already-sewn characters come back synchronously. */
export function sewAsync(dna: Dna, lod: Lod, done: (s: Sewn) => void): () => void {
  const key = sewKey(dna, lod);
  const hit = cache.get(key);
  if (hit) { done(hit); return () => {}; }
  const job: Job = { key, dna, lod, done };
  queue.push(job);
  pump();
  return () => {
    const i = queue.indexOf(job);
    if (i >= 0) queue.splice(i, 1);
  };
}

/** Bounding box of the flat record, used to centre the plush and to frame the camera on it. */
export function flatExtent(flat: any[]) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const r of flat) {
    if (!r.pts) continue;
    for (const [x, y] of r.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}

/**
 * Nearest real felt swatch to any colour. The app's palette is pastel and felt comes in fixed, more saturated
 * colours, so match on hue and chroma first (a lavender part stays lavender) and let lightness land wherever
 * felt actually exists — otherwise every pastel collapses to cream and the whole family looks the same.
 */
const CHROMA = 1.5;  // app pastels -> felt saturation
const WEIGHT_L = 0.3; // lightness counts, but less than hue
export function nearestFelt(hex: string, collection?: 'wool' | 'bright') {
  const [L1, a0, b0] = oklab(hex);
  const a1 = a0 * CHROMA, b1 = b0 * CHROMA;
  let best = { collection: 'wool' as 'wool' | 'bright', name: 'sage', cost: Infinity, hex: '' };
  for (const col of collection ? [collection] : (['wool', 'bright'] as const)) {
    for (const [name, swatch] of Object.entries(FELT[col] as Record<string, string>)) {
      const [L2, a2, b2] = oklab(swatch);
      const cost = Math.hypot(a1 - a2, b1 - b2) + WEIGHT_L * Math.abs(L1 - L2);
      if (cost < best.cost) best = { collection: col, name, cost, hex: swatch };
    }
  }
  return best;
}

/**
 * Sew a character, relaxing what was asked for if the combination cannot be sewn on model
 * (a locked face or body can conflict with the engine's taste rules).
 */
export function safeGenerate(attempts: any[]): Dna {
  let last: unknown = null;
  for (const a of attempts) {
    try { return generate(a); } catch (e) { last = e; }
  }
  throw last instanceof Error ? last : new Error('generator could not satisfy taste rules');
}
