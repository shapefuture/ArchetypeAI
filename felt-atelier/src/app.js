// Felt Atelier — character customizer + randomizer UI.
import * as THREE from 'three';
import { BODIES, EYES, MOUTHS, PATCHES, BROWS, TOPPERS, FELT, PATCH_FELT, generate, generateSet, describe, lint, rng } from './dna.js';
import { makeGroup } from './assemble.js';
import { Pool } from './pool.js';
import { toSVG } from './flat.js';
import { warmPrograms } from './materials.js';
import { setupStage, Scaler, toneSafeBackground } from './stage.js';
import { SDF, outline } from './shapes.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } } };

const LABEL = {
  cloud: 'Cloud', frog: 'Frog', triangle: 'Triangle', heart: 'Heart', bean: 'Bean', drop: 'Drop', crescent: 'Crescent', square: 'Square', flower: 'Flower', mochi: 'Mochi', pentagon: 'Pentagon', pill: 'Pill', sun: 'Sun (Self)',
  button: 'Button', dot: 'Dot', side: 'Side-eye', arc: 'Closed', lash: 'Lashes', line: 'Stern', halflid: 'Half-lid', wink: 'Wink',
  none: 'None', smile: 'Smile', frown: 'Frown', o: 'Oh', wobble: 'Wobble', smirk: 'Smirk', stern: 'Stern brows', worried: 'Worried brows',
  planet: 'Planet', moon: 'Moon', star: 'Star', comet: 'Comet', orbit: 'Orbit', constellation: 'Constellation',
  planetStalk: 'Planet stalk', cometTail: 'Comet tail', saturnRing: 'Saturn ring', starSprout: 'Star sprout', moonCrest: 'Moon crest', orbitMoon: 'Moon antenna',
};
const MOOD = {
  happy: { eyes: 'dot', mouth: 'smile', brow: 'none' }, content: { eyes: 'lash', mouth: 'smile', brow: 'none' }, sleepy: { eyes: 'halflid', mouth: 'none', brow: 'none' },
  grumpy: { eyes: 'line', mouth: 'frown', brow: 'stern' }, curious: { eyes: 'side', mouth: 'smirk', brow: 'none' }, surprised: { eyes: 'button', mouth: 'o', brow: 'none' },
  cheeky: { eyes: 'wink', mouth: 'smile', brow: 'none' }, worried: { eyes: 'button', mouth: 'frown', brow: 'worried' },
};

// ---------- state ----------
let dna = store.get('felt.current', null) || generate({ seed: 20261003, collection: 'wool' });
let history = [JSON.stringify(dna)], cursor = 0;
const locks = store.get('felt.locks', { shape: false, felt: false, face: false, accessory: false });
let saved = store.get('felt.saved', []);

function commit(next, { push = true } = {}) {
  dna = next;
  if (push) { history = history.slice(0, cursor + 1); history.push(JSON.stringify(dna)); if (history.length > 80) history.shift(); cursor = history.length - 1; }
  store.set('felt.current', dna);
  syncControls(); requestBuild();
}
const edit = (fn) => { const n = structuredClone(dna); fn(n); commit(n); };

// ---------- 3D stage ----------
const stageEl = $('#stage');
const NATIVE = Math.min(2, window.devicePixelRatio || 1), MAX_PR = Math.min(2, Math.max(1.5, window.devicePixelRatio || 1)); // super-sample on 1x screens; the governor backs off if the GPU can't hold 60
const { renderer, scene, camera, key: keyLight } = setupStage(stageEl, stageEl.clientWidth || 600, stageEl.clientHeight || 500, { dpr: NATIVE });
const scaler = new Scaler(renderer, MAX_PR);
renderer.info.autoReset = false; // count the whole frame (scene pass + blit), reset once per frame in the loop
const pivot = new THREE.Group(); scene.add(pivot);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let view = 'workshop';
const heroC = { yaw: 0.35, pitch: -0.28, dist: 2.9, zoom: 1, vyaw: 0 }, cosC = { yaw: 0, pitch: 0.12, dist: 12.5, vyaw: 0 };
let fitDist = 2.9;
const C = () => (view === 'cosmos' ? cosC : heroC);
let current = null, centre = [0, 0], squish = 0, popT = 1, t0 = performance.now(), lastT = t0;

function themeBg() { const c = getComputedStyle(document.documentElement).getPropertyValue('--stage').trim() || '#e9e7e3'; scene.background = toneSafeBackground(c, renderer.toneMappingExposure); if (cScene) cScene.background = scene.background; }
let cScene = null;
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeBg);
new MutationObserver(themeBg).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
function resize() { const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return; renderer.setSize(w, h); scaler.resize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); if (cCam) { cCam.aspect = w / h; cCam.updateProjectionMatrix(); } }
let cCam = null;
new ResizeObserver(resize).observe(stageEl);

// ---- background sewing (Web Workers) ----
const wsrc = document.getElementById('wsrc');
const pool = new Pool(wsrc ? wsrc.textContent : '', Math.min(3, Math.max(1, (navigator.hardwareConcurrency || 4) - 1)));
warmPrograms(renderer, scene, camera);

function disposeGroup(g) { g.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); }
function flatCentre(flat) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const r of flat) { if (!r.pts) continue; for (const [x, y] of r.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } } return [(x0 + x1) / 2, (y0 + y1) / 2, y1 - y0, x1 - x0]; }
let token = 0, sewTimer = 0, currentFlat = null, currentSvg = '';
function showSewing(on) { clearTimeout(sewTimer); if (on) sewTimer = setTimeout(() => ($('#sewing').hidden = false), 140); else $('#sewing').hidden = true; }

function attach(res, d) {
  window.__log.push(['attach', Math.round(performance.now())]);
  if (!res || !res.ok) { $('#msg').textContent = 'Could not sew this combination' + (res && res.error ? ': ' + res.error : ''); showSewing(false); return; }
  const g = makeGroup(res.parts, res.size);
  const [cx, cy, fh, fw] = flatCentre(res.flat); g.position.set(-cx * res.size, -cy * res.size, 0);
  const asp = camera.aspect || 1.1; fitDist = Math.max(2.4, fh * res.size * 2.55, (fw * res.size * 2.2) / asp);
  if (current) { pivot.remove(current); disposeGroup(current); }
  current = g; pivot.add(g); popT = 0; showSewing(false);
  currentFlat = res.flat; currentSvg = toSVG(res.flat, { id: 'cur', title: describe(d) }); render2D();
  $('#msg').textContent = `${describe(d)} · sewn in ${Math.round(res.ms)} ms (background)`;
  const v = lint(d); $('#lint').textContent = v.length ? 'Note: ' + v.join('; ') : '';
}
async function requestBuild() {
  const my = ++token, d = dna; showSewing(true);
  const res = await pool.request({ op: 'build', dna: d, lod: 'hero' }, { priority: 'hi', key: 'hero' });
  if (res === null || my !== token) return; // a newer request replaced this one
  attach(res, d); scheduleAhead();
}

// ---- 2D sticker variant, generated from the same sewing record ----
const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
function render2D() {
  $('#flat-main').src = svgUrl(currentSvg);
  $$('#flat-icons img').forEach((im) => (im.src = svgUrl(currentSvg)));
}
async function svgFor(item) {
  if (item.svg) return item.svg;
  const res = await pool.request({ op: 'build', dna: item.dna, lod: 'map' }, { priority: 'lo' });
  if (!res || !res.ok) return '';
  item.svg = toSVG(res.flat, { id: 's' + Math.random().toString(36).slice(2, 6), title: describe(item.dna) }); store.set('felt.saved', saved); return item.svg;
}

// ---- speculative sewing: the next random character is already sewn when you press Randomize ----
function randomOpts() {
  const L = {};
  if (locks.shape) { L.body = dna.body; L.size = dna.size; }
  if (locks.felt) { L.felt = dna.felt; L.thread = dna.thread; }
  if (locks.face) { L.eyes = dna.eyes; L.mouth = dna.mouth; }
  if (locks.accessory) { L.patch = dna.patch; L.topper = dna.topper || { t: 'none' }; }
  return { seed: (Math.random() * 2 ** 31) >>> 0, collection: dna.collection, locks: L, existing: saved.map((x) => x.dna).filter((x) => x.body.t !== 'sun'), self: L.body && L.body.t === 'sun' };
}
const lockKey = () => JSON.stringify([locks, locks.shape && [dna.body, dna.size], locks.felt && [dna.felt, dna.thread], locks.face && [dna.eyes, dna.mouth], locks.accessory && [dna.patch, dna.topper], dna.collection, saved.length]);
let ahead = null, aheadTimer = 0;
function scheduleAhead() { clearTimeout(aheadTimer); aheadTimer = setTimeout(() => { const key = lockKey(); if (ahead && ahead.key === key) return; ahead = { key, p: pool.request({ op: 'random', opts: randomOpts(), lod: 'hero' }, { priority: 'lo', key: 'ahead' }) }; }, 350); }
async function randomize() {
  const tStart = performance.now(), key = lockKey(); let res = null; perf.aheadHit = !!(ahead && ahead.key === key);
  if (ahead && ahead.key === key) res = await ahead.p;
  ahead = null;
  if (!res) { const my = ++token; showSewing(true); res = await pool.request({ op: 'random', opts: randomOpts(), lod: 'hero' }, { priority: 'hi', key: 'hero' }); if (res === null || my !== token) return; }
  if (!res.ok) { toast('Could not sew that one, try again'); showSewing(false); return; }
  ++token; const d = res.dna; d.name = dna.name;
  dna = d; history = history.slice(0, cursor + 1); history.push(JSON.stringify(dna)); if (history.length > 80) history.shift(); cursor = history.length - 1;
  store.set('felt.current', dna); syncControls(); attach(res, dna); squish = 1; scheduleAhead();
  perf.randomMs = performance.now() - tStart;
}

// ---- frame loop with an adaptive-resolution governor (60+ fps by feedback) ----
const perf = { fps: 0, ms: 0, cpu: 0, draws: 0, tris: 0, pr: MAX_PR, frames: 0, minPr: 0.6 };
let pr = MAX_PR, win = [], cooldown = 0, probing = false, backoff = 8000, hudAt = 0, cpuAcc = 0;
function governor(dt, now) {
  win.push(dt); if (win.length < 24) return;
  const avg = win.reduce((a, b) => a + b, 0) / win.length; win = [];
  const target = 1000 / (matchMedia('(min-resolution: 2dppx)').matches ? 60 : 60);
  if (avg > target * 1.12 && pr > perf.minPr) { pr = Math.max(perf.minPr, pr - 0.125); cooldown = now + backoff; if (probing) backoff = Math.min(60000, backoff * 2); probing = false; applyPR(); }
  else if (avg < target * 1.05 && pr < MAX_PR && now > cooldown) { pr = Math.min(MAX_PR, pr + 0.125); probing = true; applyPR(); }
  else probing = false;
}
window.__log = [];
function applyPR() { window.__log.push(['pr', Math.round(performance.now()), pr]); if (scaler.ok) scaler.scale = pr; else { renderer.setPixelRatio(pr); resize(); } perf.pr = pr; }
function hud(now, dt) {
  perf.frames++; cpuAcc += perf.cpu;
  if (now - hudAt < 500) return; hudAt = now;
  const i = renderer.info.render; perf.draws = i.calls; perf.tris = i.triangles;
  perf.fps = Math.round(1000 / Math.max(1, dt)); perf.ms = dt;
  $('#hud').textContent = `${perf.fps} fps · ${perf.cpu.toFixed(1)} ms CPU · ${i.calls} draws · ${(i.triangles / 1000).toFixed(0)}k tris · ${pr.toFixed(2)}× res`;
  window.__perf = perf;
}
let avgDt = 16.7;
function loop(now) {
  const dt = Math.min(100, now - lastT); lastT = now; avgDt = avgDt * 0.9 + dt * 0.1;
  const t = (now - t0) / 1000, c = C();
  if (!dragging) { c.yaw += c.vyaw; c.vyaw *= 0.94; if ((spin || (view === 'cosmos' && !userTouched)) && !reduced) c.yaw += view === 'cosmos' ? 0.0016 : 0.004; }
  const c0 = performance.now(); renderer.info.reset();
  if (view === 'workshop') {
    popT = Math.min(1, popT + dt / 380); const k = popT - 1, pop = 1 + 2.4 * k * k * k + 1.4 * k * k; // easeOutBack: stuffing puffs up
    pivot.rotation.set(c.pitch, c.yaw + (reduced ? 0 : Math.sin(t * 0.6) * 0.04), 0);
    squish *= 0.88; const br = reduced ? 0 : Math.sin(t * 1.7) * 0.008;
    const sc = reduced ? 1 : 0.86 + 0.14 * pop; pivot.scale.set(sc * (1 + squish * 0.06), sc * (1 - squish * 0.08 + br), sc * (1 + squish * 0.04));
    c.dist += (fitDist * c.zoom - c.dist) * Math.min(1, dt / 160); camera.position.set(0, 0, c.dist); camera.lookAt(0, 0, 0);
    scaler.render(scene, camera);
  } else { updateCosmos(t, dt, c); scaler.render(cScene, cCam); }
  perf.cpu = performance.now() - c0;
  governor(dt, now); hud(now, avgDt);
  requestAnimationFrame(loop);
}

// orbit controls (pointer + wheel + pinch)
let dragging = false, lx = 0, ly = 0, moved = 0, userTouched = false, spin = store.get('felt.spin', false);
const ptrs = new Map(); let pinch0 = 0;
const cv = renderer.domElement; cv.style.touchAction = 'none';
const dLim = () => (view === 'cosmos' ? [5, 30] : [0.45, 2.2]);
const zoomBy = (c, f) => { const [lo, hi] = dLim(); if (view === 'cosmos') c.dist = Math.min(hi, Math.max(lo, c.dist * f)); else c.zoom = Math.min(hi, Math.max(lo, c.zoom * f)); };
cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); dragging = true; userTouched = true; lx = e.clientX; ly = e.clientY; moved = 0; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
cv.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]); const c = C(), [lo, hi] = dLim();
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0) zoomBy(c, pinch0 / d); pinch0 = d; return; }
  const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
  c.yaw += dx * 0.01; c.vyaw = dx * 0.002; c.pitch = Math.max(-1.3, Math.min(1.3, c.pitch + dy * 0.008));
});
const up = (e) => { ptrs.delete(e.pointerId); if (!ptrs.size) { dragging = false; if (moved < 6) { if (view === 'cosmos') pickCosmos(e); else squish = 1; } } pinch0 = 0; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('wheel', (e) => { e.preventDefault(); zoomBy(C(), 1 + e.deltaY * 0.001); }, { passive: false });
cv.addEventListener('dblclick', () => { const c = C(); c.yaw = 0; c.pitch = view === 'cosmos' ? 0.12 : 0; c.vyaw = 0; if (view === 'cosmos') c.dist = 12.5; else c.zoom = 1; });

// ---------- controls ----------
function chips(el, items, get, set, fmt = (k) => LABEL[k] || k) {
  el.innerHTML = '';
  for (const k of items) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.k = k; b.textContent = fmt(k); b.addEventListener('click', () => set(k)); el.appendChild(b); }
  el._sync = () => $$('.chip', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === get())));
}
function swatches(el, list, get, set) {
  el.innerHTML = '';
  for (const [k, hex] of list) { const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.dataset.k = k; b.style.setProperty('--c', hex); b.title = k; b.setAttribute('aria-label', `${k} felt`); b.addEventListener('click', () => set(k)); el.appendChild(b); }
  el._sync = () => $$('.sw', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === get())));
}
function slider(id, get, set) { const el = $('#' + id); el.addEventListener('input', () => { const n = structuredClone(dna); set(n, +el.value); dna = n; store.set('felt.current', dna); requestBuild(); }); el.addEventListener('change', () => commit(dna)); el._sync = () => { el.value = get(); }; return el; }

// shape tiles with real outlines
const shapeGrid = $('#shapes');
for (const b of [...BODIES, 'sun']) {
  const pts = outline(SDF[b], { res: 70, extent: 0.72, step: 0.03 });
  const d = 'M' + pts.map(([x, y]) => `${(x * 46 + 36).toFixed(1)},${(36 - y * 46).toFixed(1)}`).join('L') + 'Z';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'tile'; btn.dataset.k = b;
  btn.innerHTML = `<svg viewBox="0 0 72 72" aria-hidden="true"><path d="${d}"/></svg><span>${LABEL[b]}</span>`;
  btn.addEventListener('click', () => edit((n) => { n.body.t = b; if (b === 'sun') { n.patch.t = 'none'; } }));
  shapeGrid.appendChild(btn);
}
shapeGrid._sync = () => $$('.tile', shapeGrid).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === dna.body.t)));

const syncers = [shapeGrid];
const reg = (el) => (syncers.push(el), el);
reg(slider('s-w', () => dna.body.w, (n, v) => (n.body.w = v)));
reg(slider('s-h', () => dna.body.h, (n, v) => (n.body.h = v)));
reg(slider('s-lean', () => dna.body.lean, (n, v) => (n.body.lean = v)));
reg(slider('s-depth', () => dna.body.depth, (n, v) => (n.body.depth = v)));
reg(slider('s-wobble', () => dna.body.wobble, (n, v) => (n.body.wobble = v)));
reg(slider('s-size', () => dna.size, (n, v) => (n.size = v)));

const feltEl = reg($('#felts'));
const renderFelts = () => swatches(feltEl, Object.entries(FELT[dna.collection]), () => dna.felt, (k) => edit((n) => (n.felt = k)));
reg($('#collection')); $('#collection')._sync = () => $$('#collection .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === dna.collection)));
$$('#collection .chip').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.k === dna.collection) return;
  edit((n) => { n.collection = b.dataset.k; const keys = Object.keys(FELT[n.collection]); if (!FELT[n.collection][n.felt]) n.felt = keys[0]; const pf = PATCH_FELT[n.collection]; if (!pf.includes(n.patch.felt)) n.patch.felt = pf[0]; if (!pf.includes(n.patch.felt2)) n.patch.felt2 = pf[1]; if (n.topper && !FELT[n.collection][n.topper.felt]) n.topper.felt = pf[0]; if (n.topper && !FELT[n.collection][n.topper.felt2]) n.topper.felt2 = pf[1]; });
}));
chips(reg($('#thread')), ['tone', 'cream'], () => (dna.thread === 'cream' ? 'cream' : 'tone'), (k) => edit((n) => (n.thread = k)), (k) => (k === 'tone' ? 'Tone-on-tone' : 'Cream contrast'));

chips(reg($('#moods')), Object.keys(MOOD), () => Object.keys(MOOD).find((m) => MOOD[m].eyes === dna.eyes.style && MOOD[m].mouth === dna.mouth.style && MOOD[m].brow === dna.eyes.brow) || '', (k) => edit((n) => { n.eyes.style = MOOD[k].eyes; n.mouth.style = MOOD[k].mouth; n.eyes.brow = MOOD[k].brow; if (k === 'curious') n.eyes.gaze = [1, 0]; if (k === 'sleepy') n.eyes.lid = 0.55; }), (k) => k[0].toUpperCase() + k.slice(1));
chips(reg($('#eyes')), EYES, () => dna.eyes.style, (k) => edit((n) => { n.eyes.style = k; if (k === 'halflid' && !n.eyes.lid) n.eyes.lid = 0.5; if (k === 'side' && Math.abs(n.eyes.gaze[0]) < 0.5) n.eyes.gaze = [1, 0]; }));
chips(reg($('#mouths')), MOUTHS, () => dna.mouth.style, (k) => edit((n) => (n.mouth.style = k)));
chips(reg($('#brows')), BROWS, () => dna.eyes.brow, (k) => edit((n) => (n.eyes.brow = k)), (k) => (k === 'none' ? 'No brows' : LABEL[k]));
reg(slider('s-esize', () => dna.eyes.size, (n, v) => (n.eyes.size = v)));
reg(slider('s-egap', () => dna.eyes.gap, (n, v) => (n.eyes.gap = v)));
reg(slider('s-ey', () => dna.eyes.y, (n, v) => (n.eyes.y = v)));
reg(slider('s-gx', () => dna.eyes.gaze[0], (n, v) => (n.eyes.gaze = [v, n.eyes.gaze[1]])));
reg(slider('s-gy', () => dna.eyes.gaze[1], (n, v) => (n.eyes.gaze = [n.eyes.gaze[0], v])));
reg(slider('s-lid', () => dna.eyes.lid, (n, v) => (n.eyes.lid = v)));

chips(reg($('#patches')), PATCHES, () => dna.patch.t, (k) => edit((n) => (n.patch.t = k)));
const pFelt = reg($('#pfelt')), pFelt2 = reg($('#pfelt2')), tFelt = reg($('#tfelt')), tFelt2 = reg($('#tfelt2'));
const renderAccFelts = () => {
  const list = PATCH_FELT[dna.collection].map((k) => [k, FELT[dna.collection][k]]);
  swatches(pFelt, list, () => dna.patch.felt, (k) => edit((n) => (n.patch.felt = k)));
  swatches(pFelt2, list, () => dna.patch.felt2, (k) => edit((n) => (n.patch.felt2 = k)));
  swatches(tFelt, Object.entries(FELT[dna.collection]), () => dna.topper?.felt, (k) => edit((n) => { n.topper = { side: 0, tilt: 0, felt2: list[0][0], ...n.topper, felt: k }; }));
  swatches(tFelt2, list, () => dna.topper?.felt2, (k) => edit((n) => { n.topper = { side: 0, tilt: 0, felt: list[0][0], ...n.topper, felt2: k }; }));
};
reg(slider('s-zone', () => dna.patch.zone, (n, v) => (n.patch.zone = v)));
reg(slider('s-prot', () => dna.patch.rot, (n, v) => (n.patch.rot = v)));
reg(slider('s-pscale', () => dna.patch.scale, (n, v) => (n.patch.scale = v)));
chips(reg($('#toppers')), TOPPERS, () => dna.topper?.t || 'none', (k) => edit((n) => { const pf = PATCH_FELT[n.collection]; n.topper = { felt: pf[0], felt2: pf[1], side: 0, tilt: 0, ...n.topper, t: k }; }));
reg(slider('s-tside', () => dna.topper?.side ?? 0, (n, v) => { n.topper = { t: 'none', felt: PATCH_FELT[n.collection][0], felt2: PATCH_FELT[n.collection][1], tilt: 0, ...n.topper, side: v }; }));
reg(slider('s-ttilt', () => dna.topper?.tilt ?? 0, (n, v) => { n.topper = { t: 'none', felt: PATCH_FELT[n.collection][0], felt2: PATCH_FELT[n.collection][1], side: 0, ...n.topper, tilt: v }; }));

let lastCollection = null;
function syncControls() {
  if (lastCollection !== dna.collection) { renderFelts(); renderAccFelts(); lastCollection = dna.collection; }
  for (const el of syncers) el._sync && el._sync();
  $('#undo').disabled = cursor <= 0; $('#redo').disabled = cursor >= history.length - 1;
  $$('.lock').forEach((b) => { b.setAttribute('aria-pressed', String(!!locks[b.dataset.lock])); b.title = locks[b.dataset.lock] ? 'Locked: dice keeps this' : 'Unlocked: dice changes this'; });
  $('#dna').value = JSON.stringify(dna, null, 1);
  $('#name').value = dna.name || '';
  $('#spin').setAttribute('aria-pressed', String(spin));
}

// tabs
$$('[role="tab"]').forEach((t) => t.addEventListener('click', () => {
  $$('[role="tab"]').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
  $$('[role="tabpanel"]').forEach((p) => (p.hidden = p.id !== t.getAttribute('aria-controls')));
  store.set('felt.tab', t.id);
}));
const savedTab = store.get('felt.tab', null); if (savedTab && $('#' + savedTab)) $('#' + savedTab).click();
$$('.lock').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); locks[b.dataset.lock] = !locks[b.dataset.lock]; store.set('felt.locks', locks); syncControls(); }));

// randomizer
$('#dice').addEventListener('click', randomize);
$('#undo').addEventListener('click', () => { if (cursor > 0) { cursor--; commit(JSON.parse(history[cursor]), { push: false }); } });
$('#redo').addEventListener('click', () => { if (cursor < history.length - 1) { cursor++; commit(JSON.parse(history[cursor]), { push: false }); } });
$('#spin').addEventListener('click', () => { spin = !spin; store.set('felt.spin', spin); syncControls(); });
$('#front').addEventListener('click', () => { const c = C(); c.yaw = 0; c.pitch = view === 'cosmos' ? 0.12 : 0; c.vyaw = 0; if (view === 'cosmos') c.dist = 12.5; else c.zoom = 1; });
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) return;
  if ((e.key === 'r' || e.key === ' ') && view === 'workshop') { e.preventDefault(); randomize(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); $(e.shiftKey ? '#redo' : '#undo').click(); }
});
$('#name').addEventListener('change', (e) => edit((n) => (n.name = e.target.value.slice(0, 40))));

// DNA copy / apply
$('#copy').addEventListener('click', async () => { const ta = $('#dna'); try { await navigator.clipboard.writeText(ta.value); toast('Copied character DNA'); } catch { ta.focus(); ta.select(); toast('Selected. Press Ctrl+C to copy'); } });
$('#apply').addEventListener('click', () => {
  try {
    const n = JSON.parse($('#dna').value);
    if (!n.body || !BODIES.concat('sun').includes(n.body.t) || !n.eyes || !n.mouth || !n.patch || !FELT[n.collection]) throw new Error('missing body, eyes, mouth, patch or collection');
    commit(n); toast('Applied DNA');
  } catch (e) { toast('That DNA could not be read: ' + e.message); }
});

// ---------- constellation view: 24 floating characters, crowd LOD, no shadow pass ----------
const crowd = []; let crowdKey = '', crowdSeq = 0;
function ensureCosmosScene() {
  if (cScene) return;
  cScene = new THREE.Scene(); cScene.background = scene.background; cScene.environment = scene.environment; cScene.environmentIntensity = scene.environmentIntensity;
  const k = new THREE.DirectionalLight('#fff4e6', 2.3); k.position.set(-4.5, 6, 6); cScene.add(k);
  const f = new THREE.DirectionalLight('#e8efff', 0.35); f.position.set(5, 1, 4); cScene.add(f); cScene.add(new THREE.HemisphereLight('#ffffff', '#cfc8bd', 0.55));
  cCam = new THREE.PerspectiveCamera(30, stageEl.clientWidth / Math.max(1, stageEl.clientHeight), 0.5, 80);
}
function poisson(n, seed) { // blue-noise scatter in an ellipsoid so floating characters never overlap
  const r = rng(seed), out = [], rad = [4.8, 2.5, 3.0], minD = 1.3;
  let guard = 0, md = minD; while (out.length < n && guard++ < 6000) {
    const p = [(r() * 2 - 1) * rad[0], (r() * 2 - 1) * rad[1], (r() * 2 - 1) * rad[2]];
    if ((p[0] / rad[0]) ** 2 + (p[1] / rad[1]) ** 2 + (p[2] / rad[2]) ** 2 > 1) continue;
    if (Math.hypot(p[0], p[1] * 1.3, p[2]) < 1.5) continue; // keep a clearing for the Self at the centre
    if (out.some((q) => Math.hypot(p[0] - q[0], (p[1] - q[1]) * 1.3, p[2] - q[2]) < md)) { if (guard % 400 === 0) md *= 0.94; continue; }
    out.push(p);
  }
  return out;
}
async function buildCosmos(n = 24) {
  ensureCosmosScene(); const my = ++crowdSeq;
  for (const c of crowd) { cScene.remove(c.g); disposeGroup(c.g); } crowd.length = 0;
  const set = [generate({ seed: 7, collection: dna.collection, self: true })];
  const mine = [dna, ...saved.map((x) => x.dna)].filter((d) => d.body.t !== 'sun').slice(0, 10);
  const fill = generateSet({ seed: Math.floor(Math.random() * 1e6) + 1, collection: dna.collection, n: n - 1 }).slice(1);
  for (const d of [...mine, ...fill]) if (set.length < n) set.push(d);
  const spots = [[0, 0, 0], ...poisson(n - 1, 11)];
  let done = 0; $('#hud-note').textContent = `Sewing 0/${n}…`;
  await Promise.all(set.map(async (d, i) => {
    const res = await pool.request({ op: 'build', dna: d, lod: 'map' }, { priority: 'lo' });
    if (my !== crowdSeq || !res || !res.ok) return;
    const g = makeGroup(res.parts, res.size * (i === 0 ? 1.4 : 0.88)); const [cx, cy] = flatCentre(res.flat); const holder = new THREE.Group(); g.position.set(-cx * g.scale.x, -cy * g.scale.y, 0); holder.add(g);
    holder.position.set(...spots[i]); holder.scale.setScalar(0.001); cScene.add(holder);
    crowd.push({ g: holder, dna: d, base: new THREE.Vector3(...spots[i]), ph: i * 1.7, born: performance.now() });
    $('#hud-note').textContent = ++done < n ? `Sewing ${done}/${n}…` : `${n} characters floating`;
  }));
}
const _v = new THREE.Vector3();
function updateCosmos(t, dt, c) {
  const cp = Math.cos(c.pitch); cCam.position.set(Math.sin(c.yaw) * cp * c.dist, Math.sin(c.pitch) * c.dist, Math.cos(c.yaw) * cp * c.dist); cCam.lookAt(0, 0, 0);
  const now = performance.now();
  for (const o of crowd) {
    const age = Math.min(1, (now - o.born) / 450), k = age - 1, pop = 1 + 2.4 * k * k * k + 1.4 * k * k;
    o.g.scale.setScalar(Math.max(0.001, pop));
    o.g.position.set(o.base.x, o.base.y + (reduced ? 0 : Math.sin(t * 0.8 + o.ph) * 0.09), o.base.z + (reduced ? 0 : Math.cos(t * 0.6 + o.ph) * 0.05));
    const face = Math.atan2(cCam.position.x - o.g.position.x, cCam.position.z - o.g.position.z); // plush turn to look at you, within limits
    o.g.rotation.set(0.04 * Math.sin(t * 0.5 + o.ph), Math.max(-0.7, Math.min(0.7, face)) * 0.85 + (reduced ? 0 : Math.sin(t * 0.45 + o.ph) * 0.1), 0.05 * Math.sin(t * 0.7 + o.ph));
  }
}
function pickCosmos(e) {
  const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; let best = null, bd = 1e9;
  for (const o of crowd) { _v.copy(o.g.position).project(cCam); const sx = (_v.x * 0.5 + 0.5) * r.width, sy = (-_v.y * 0.5 + 0.5) * r.height, d = Math.hypot(sx - mx, sy - my); if (d < bd) { bd = d; best = o; } }
  if (best && bd < r.height * 0.1) { setView('workshop'); commit(structuredClone(best.dna)); toast('Loaded into the workshop'); }
}
function setView(v) {
  window.__log.push(['view', Math.round(performance.now()), v]);
  view = v; $$('#views .btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  document.body.dataset.view = v;
  if (v === 'cosmos') { ensureCosmosScene(); resize(); if (!crowd.length) buildCosmos(); }
}
$$('#views .btn').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
$('#reshuffle').addEventListener('click', () => buildCosmos());

// constellation shelf (each saved part keeps a 3D thumbnail and its automatically generated 2D sticker)
function renderShelf() {
  const el = $('#shelf'); el.innerHTML = '';
  if (!saved.length) { el.innerHTML = '<p class="empty">Saved parts appear here with both a 3D photo and a flat 2D sticker. Sew one you like, then press Save to shelf.</p>'; return; }
  saved.forEach((s, i) => {
    const b = document.createElement('div'); b.className = 'shelf-item'; const nm = (s.dna.name || LABEL[s.dna.body.t]).replace(/</g, '&lt;');
    b.innerHTML = `<button type="button" class="load" aria-label="Open ${nm}"><span class="pair"><img alt="3D ${describe(s.dna)}" src="${s.img}"><img class="two" alt="2D ${describe(s.dna)}" ${s.svg ? `src="${svgUrl(s.svg)}"` : ''}></span><span>${nm}</span></button><button type="button" class="del" aria-label="Remove ${nm} from shelf">×</button>`;
    $('.load', b).addEventListener('click', () => commit(structuredClone(s.dna)));
    $('.del', b).addEventListener('click', () => { saved.splice(i, 1); store.set('felt.saved', saved); renderShelf(); scheduleAhead(); });
    el.appendChild(b);
    if (!s.svg) svgFor(s).then((svg) => { const im = $('.two', b); if (svg && im) im.src = svgUrl(svg); });
  });
}
function snapshot() {
  const c0 = pivot.rotation.clone(), sc = pivot.scale.clone(), cp = camera.position.clone();
  pivot.rotation.set(-0.2, 0.25, 0); pivot.scale.set(1, 1, 1); camera.position.set(0, 0, 2.7); camera.lookAt(0, 0, 0);
  scaler.render(scene, camera);
  const src = renderer.domElement, cvs = document.createElement('canvas'), S = 160; cvs.width = cvs.height = S;
  const k = Math.min(src.width, src.height); cvs.getContext('2d').drawImage(src, (src.width - k) / 2, (src.height - k) / 2, k, k, 0, 0, S, S);
  pivot.rotation.copy(c0); pivot.scale.copy(sc); camera.position.copy(cp);
  return cvs.toDataURL('image/jpeg', 0.82);
}
$('#save').addEventListener('click', () => {
  if (!current || view !== 'workshop') { toast('Open the workshop to save the current character'); return; }
  saved.unshift({ dna: structuredClone(dna), img: snapshot(), svg: currentSvg.replace(/id="cur/g, 'id="s' + Date.now().toString(36)).replace(/#cur/g, '#s' + Date.now().toString(36)) }); saved = saved.slice(0, 24);
  store.set('felt.saved', saved); renderShelf(); scheduleAhead(); toast('Saved with its 2D sticker');
});

// 2D sticker actions
async function copyText(t, ok) { try { await navigator.clipboard.writeText(t); toast(ok); } catch { toast('Copy was blocked here. Use Download instead.'); } }
async function download(name, blob) {
  // Published artifact: the viewer mediates saves (downloads capability). Standalone file: a normal browser download.
  try { const d = window.claude && window.claude.use ? await window.claude.use('downloads') : null; if (d) { await d.save({ filename: name, data: blob }); toast('Saved ' + name); return; } }
  catch (e) { if (e && e.code === 'declined') { toast('Download cancelled'); return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Saved ' + name);
}
const slug = () => (dna.name || dna.body.t + '-' + dna.felt).toLowerCase().replace(/[^a-z0-9]+/g, '-');
$('#svg-copy').addEventListener('click', () => copyText(currentSvg, 'Copied SVG'));
$('#svg-dl').addEventListener('click', () => download(slug() + '.svg', new Blob([currentSvg], { type: 'image/svg+xml' })));
$('#png-dl').addEventListener('click', () => {
  const img = new Image(); img.onload = () => { const c = document.createElement('canvas'), w = 1024, h = Math.round(w * img.height / img.width) || w; c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); c.toBlob((b) => b && download(slug() + '.png', b)); };
  img.onerror = () => toast('Could not render the PNG'); img.src = svgUrl(currentSvg);
});

let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), 2200); }

themeBg(); syncControls(); renderShelf(); resize(); requestBuild(); requestAnimationFrame(loop);
window.__ready = true;
