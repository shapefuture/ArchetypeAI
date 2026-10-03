// Felt + thread materials. Procedural "material kit": wool fibre albedo with heathering,
// fibre height -> normal map, plied-thread twist. Cached per swatch.
import * as THREE from 'three';
import { rng } from './dna.js';

const cache = new Map();
const SIZE = 512;

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

function fibreCanvas(hex, { heather = 0.5, seed = 7, size = SIZE } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const [r, gg, b] = hexRgb(hex);
  g.fillStyle = hex; g.fillRect(0, 0, size, size);
  const R = rng(seed);
  // low-frequency mottling (felt density variation)
  for (let i = 0; i < 90; i++) {
    const x = R() * size, y = R() * size, rad = 30 + R() * 90, k = (R() - 0.5) * 0.1;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    const col = k > 0 ? `rgba(255,255,255,${k})` : `rgba(0,0,0,${-k})`;
    grd.addColorStop(0, col); grd.addColorStop(1, 'rgba(0,0,0,0)');
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { g.save(); g.translate(ox, oy); g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.restore(); }
  }
  // fibres
  const N = 34000;
  for (let i = 0; i < N; i++) {
    const x = R() * size, y = R() * size, a = R() * Math.PI * 2, L = 5 + R() * 18 * (R() < 0.2 ? 2 : 1);
    const curl = (R() - 0.5) * 1.6;
    let k = (R() - 0.5) * 0.22;
    let cr = r * (1 + k), cg = gg * (1 + k), cb = b * (1 + k);
    if (R() < heather * 0.18) { const s = (R() - 0.5) * 70; cr += s; cg += s * 0.6; cb -= s * 0.4; } // stray off-tone fibre
    if (R() < heather * 0.05) { const w = R() < 0.5 ? 235 : 40; cr = (cr + w) / 2; cg = (cg + w) / 2; cb = (cb + w) / 2; }
    g.strokeStyle = `rgba(${clamp(cr)},${clamp(cg)},${clamp(cb)},${0.18 + R() * 0.35})`;
    g.lineWidth = 0.5 + R() * 0.9;
    const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L, mx = (x + x2) / 2 + Math.cos(a + 1.57) * curl * L * 0.3, my = (y + y2) / 2 + Math.sin(a + 1.57) * curl * L * 0.3;
    for (const ox of (x < 30 || x > size - 30 ? [-size, 0, size] : [0])) for (const oy of (y < 30 || y > size - 30 ? [-size, 0, size] : [0])) {
      g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(mx + ox, my + oy, x2 + ox, y2 + oy); g.stroke();
    }
  }
  // matted clumps
  for (let i = 0; i < 8; i++) {
    const x = R() * size, y = R() * size, rad = 6 + R() * 8, k = (R() - 0.3) * 0.08;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad); grd.addColorStop(0, `rgba(${clamp(r * (1 + k))},${clamp(gg * (1 + k))},${clamp(b * (1 + k))},0.55)`); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // pills
  for (let i = 0; i < 40; i++) {
    const x = R() * size, y = R() * size, rad = 1 + R() * 1.8, k = 0.05 + R() * 0.08;
    g.fillStyle = `rgba(${clamp(r * (1 + k))},${clamp(gg * (1 + k))},${clamp(b * (1 + k))},0.8)`;
    g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
  }
  return c;
}

function heightCanvas(seed = 3, size = SIZE) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, size, size);
  const R = rng(seed);
  for (let i = 0; i < 30000; i++) {
    const x = R() * size, y = R() * size, a = R() * Math.PI * 2, L = 3 + R() * 13;
    g.strokeStyle = `rgba(${R() < 0.6 ? 255 : 0},${R() < 0.6 ? 255 : 0},255,${0.08 + R() * 0.16})`;
    g.strokeStyle = R() < 0.62 ? `rgba(255,255,255,${0.1 + R() * 0.18})` : `rgba(0,0,0,${0.08 + R() * 0.12})`;
    g.lineWidth = 0.6 + R() * 1.0;
    for (const ox of (x < 20 || x > size - 20 ? [-size, 0, size] : [0])) for (const oy of (y < 20 || y > size - 20 ? [-size, 0, size] : [0])) {
      g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L); g.stroke();
    }
  }
  for (let i = 0; i < 70; i++) { const x = R() * size, y = R() * size; g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(x, y, 1.2 + R() * 2, 0, 7); g.fill(); }
  return c;
}

function toNormal(hc, strength = 2.2) {
  const s = hc.width, src = hc.getContext('2d').getImageData(0, 0, s, s).data;
  const c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d'); const out = g.createImageData(s, s);
  const H = (x, y) => src[(((y + s) % s) * s + ((x + s) % s)) * 4] / 255;
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * s + x) * 4;
    out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0); return c;
}

function tex(canvas, srgb, rep = 1) {
  const t = new THREE.CanvasTexture(canvas); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
  t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
}

let feltNormal = null, fuzzAlpha = null;
function sharedFeltNormal() { if (!feltNormal) feltNormal = tex(toNormal(heightCanvas()), false); return feltNormal; }
function sharedFuzz() {
  if (fuzzAlpha) return fuzzAlpha;
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, s, s); const R = rng(11);
  for (let i = 0; i < 9000; i++) { const x = R() * s, y = R() * s, a = R() * 6.28, L = 2 + R() * 9; g.strokeStyle = `rgba(255,255,255,${0.35 + R() * 0.6})`; g.lineWidth = 0.5 + R() * 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  fuzzAlpha = tex(c, false); return fuzzAlpha;
}

// Shared fibre-luminance maps (one per collection). Colour is a per-material tint, so a new felt colour costs a few
// microseconds instead of re-painting 34k fibres (TRIZ 10: prior action; TRIZ 1: segment colour from texture).
const greyMaps = {};
export function greyFelt(collection = 'wool') {
  if (!greyMaps[collection]) greyMaps[collection] = tex(fibreCanvas('#f4f4f4', { heather: collection === 'wool' ? 1 : 0.35, seed: collection === 'wool' ? 41 : 43 }), true);
  return greyMaps[collection];
}
export function feltMaterial(hex, { collection = 'wool', vertexColors = false } = {}) {
  const key = 'felt' + hex + collection + vertexColors;
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial({
    map: greyFelt(collection), normalMap: sharedFeltNormal(), normalScale: new THREE.Vector2(0.8, 0.8),
    color: new THREE.Color(hex), roughness: 1, metalness: 0, envMapIntensity: 0.26, vertexColors,
  });
  cache.set(key, m); return m;
}

export function fuzzMaterial(hex) {
  const key = 'fuzz' + hex; if (cache.has(key)) return cache.get(key);
  const col = new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.12);
  const m = new THREE.MeshStandardMaterial({ color: col, alphaMap: sharedFuzz(), transparent: true, opacity: 0.55, depthWrite: false, roughness: 1, side: THREE.DoubleSide });
  cache.set(key, m); return m;
}

let twist = null;
function twistTex() {
  if (twist) return twist;
  const w = 64, h = 64, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
  for (let i = -4; i < 8; i++) { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(i * 12, 0); g.lineTo(i * 12 + 40, h); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(i * 12 + 6, 0); g.lineTo(i * 12 + 46, h); g.stroke(); }
  twist = tex(c, true); return twist;
}
let twistN = null;
function twistNormal() {
  if (twistN) return twistN;
  const s = 64, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
  for (let i = -4; i < 8; i++) { const grd = g.createLinearGradient(i * 12, 0, i * 12 + 12, 0); grd.addColorStop(0, '#303030'); grd.addColorStop(0.5, '#ffffff'); grd.addColorStop(1, '#303030'); g.strokeStyle = grd; g.lineWidth = 10; g.beginPath(); g.moveTo(i * 12, 0); g.lineTo(i * 12 + 40, s); g.stroke(); }
  twistN = tex(toNormal(c, 3), false); return twistN;
}

export function threadMaterial(hex) {
  const key = 'thread' + hex; if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex), map: twistTex(), normalMap: twistNormal(), normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.62, sheen: 0.8, sheenRoughness: 0.4, sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#fff'), 0.5), envMapIntensity: 0.7 });
  cache.set(key, m); return m;
}


/** Pre-compile every shader program the app will use, so the first Randomize never stalls on the driver. */
export function warmPrograms(renderer, scene, camera) {
  const g = new THREE.PlaneGeometry(0.01, 0.01), dummies = [];
  const add = (m) => { const o = new THREE.Mesh(g, m); o.position.set(0, 0, -50); scene.add(o); dummies.push(o); };
  for (const col of ['wool', 'bright']) { add(feltMaterial('#888888', { collection: col })); add(feltMaterial('#ffffff', { collection: col, vertexColors: true })); }
  add(threadMaterial('#aaaaaa')); add(fuzzMaterial('#aaaaaa'));
  const e = new THREE.MeshStandardMaterial({ color: '#fff', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, roughness: 1 }); add(e);
  const v = new THREE.MeshStandardMaterial({ vertexColors: true, map: greyFelt('wool'), roughness: 1 }); add(v);
  renderer.compile(scene, camera);
  for (const o of dummies) scene.remove(o);
}
