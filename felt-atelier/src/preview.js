// Felt Atelier — self-contained preview.
//
// One sewing pass, two views, fused: the character is real stuffed-felt geometry (two cut pieces inflated into
// domes, blanket-stitched at the rim, felt eyes and patches laid on the surface), and the flat 2D sticker is the
// same sewing record. Here the 2D record is projected back through the live 3D camera, so you can see the paths
// riding the plush, and the sticker can be registered to the silhouette behind a split slider.
import * as THREE from 'three';
import { FELT, generate, generateSet, describe, lint, dnaHash, feltHex, threadHex } from './dna.js';
import { makeGroup } from './assemble.js';
import { Pool } from './pool.js';
import { toSVG } from './flat.js';
import { warmPrograms } from './materials.js';
import { setupStage, Scaler, toneSafeBackground } from './stage.js';
import { domeSampler, overlayItems, projectItems, pixelsPerUnit, facing, svgViewBox, userBox, pathOf } from './fuse.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- stage ----------
const stageEl = $('#stage'), box = $('.stagebox');
const NATIVE = Math.min(2, window.devicePixelRatio || 1), MAX_PR = Math.min(2, Math.max(1.5, window.devicePixelRatio || 1));
const { renderer, scene, camera } = setupStage(stageEl, stageEl.clientWidth || 640, stageEl.clientHeight || 520, { dpr: NATIVE });
const scaler = new Scaler(renderer, MAX_PR);
renderer.info.autoReset = false;
const pivot = new THREE.Group(); scene.add(pivot);         // the hero on its turntable
const root = new THREE.Group(); scene.add(root);           // off-stage stand-in for 3D thumbnails
const pool = new Pool(document.getElementById('wsrc').textContent, Math.min(3, Math.max(1, (navigator.hardwareConcurrency || 4) - 1)));
warmPrograms(renderer, scene, camera);

// ---------- state ----------
let dna = generate({ seed: 20261003, collection: 'wool' });
let current = null, currentSvg = '', svgBox = null, items = [], seamItem = null, userSeam = null, dome = null, fitDist = 2.9;
let lod = 'hero', fuse = false, trace = false, split = 50, spin = false, fuseEase = 0, token = 0, popT = 1;
const cam = { yaw: 0.34, pitch: -0.24, dist: 3.2, zoom: 1, vyaw: 0 };

function themeBg() {
  const c = getComputedStyle(document.documentElement).getPropertyValue('--stage').trim() || '#e9e7e3';
  scene.background = toneSafeBackground(c, renderer.toneMappingExposure);
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeBg);
themeBg();

function resize() {
  const w = stageEl.clientWidth, h = stageEl.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h); scaler.resize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stageEl);

// ---------- sew ----------
function flatCentre(flat) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const r of flat) { if (!r.pts) continue; for (const [x, y] of r.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
  return [(x0 + x1) / 2, (y0 + y1) / 2, y1 - y0, x1 - x0];
}
function disposeGroup(g) { g.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); }
function ungroup(g) { root.remove(g); disposeGroup(g); }

function attach(r, d) {
  if (!r || !r.ok) { toast('Could not sew that one — try another'); showSewing(false); return; }
  const g = makeGroup(r.parts, r.size);
  const [cx, cy, fh, fw] = flatCentre(r.flat);
  g.position.set(-cx * r.size, -cy * r.size, 0);
  const asp = camera.aspect || 1.2;
  fitDist = Math.max(2.4, fh * r.size * 2.55, (fw * r.size * 2.2) / asp);
  if (current) { pivot.remove(current); disposeGroup(current); }
  current = g; pivot.add(g); popT = 0;
  dna = d;
  currentSvg = toSVG(r.flat, { id: 'cur', title: describe(d) });
  svgBox = svgViewBox(currentSvg);
  $('#sticker').innerHTML = currentSvg;
  $('#flat2d').innerHTML = toSVG(r.flat, { id: 'flat', title: describe(d) });
  const bodyRec = r.flat.find((x) => x.t === 'body');
  dome = bodyRec ? domeSampler(bodyRec.pts, d.body.depth) : null;
  items = overlayItems(r.flat, dome);
  seamItem = items.find((i) => i.name === 'seam') || null;
  userSeam = seamItem ? userBox(seamItem) : null;
  buildOvDom();
  fillStats(r, d);
  $('#desc').textContent = describe(d);
  $('#dna').textContent = JSON.stringify(d, null, 1);
  const v = lint(d);
  $('#lint').textContent = v.length ? 'Note: ' + v.join('; ') : 'On model: every taste rule passes.';
  showSewing(false);
}

function buildOvDom() {
  const ov = $('#ov'); ov.innerHTML = '';
  for (const it of items) {
    const el = document.createElementNS(NS, it.kind === 'dot' ? 'circle' : 'path');
    if (it.kind === 'dot') { el.setAttribute('fill', it.fill); el.setAttribute('stroke', 'rgba(20,18,22,.4)'); el.setAttribute('stroke-width', '0.8'); }
    else {
      el.setAttribute('fill', it.fill || 'none');
      if (it.stroke) el.setAttribute('stroke', it.stroke);
      el.setAttribute('stroke-linejoin', 'round'); el.setAttribute('stroke-linecap', 'round');
    }
    it.el = el; ov.appendChild(el);
  }
}

// ---------- stats: this is a real object, not a picture of one ----------
function swatch(hex) { return `<i class="sw" style="background:${hex}"></i>`; }
function fillStats(r, d) {
  let tris = 0;
  for (const p of r.parts) {
    const n = p.attrs ? (p.attrs.position ? p.attrs.position.length / 3 : 0) : (p.geo ? p.geo.attributes.position.count / 3 : 0);
    tris += n;
  }
  const pieces = r.flat.filter((x) => x.t === 'poly').length + 1;
  const stitches = r.flat.filter((x) => x.t === 'line' || x.t === 'dash' || x.t === 'dot').length;
  const rows = [
    ['Character', describe(d)],
    ['Seed', `${d.seed} · hash ${dnaHash(d).toString(16)}`],
    ['Body', `${d.body.t} · ${d.body.w.toFixed(2)}×${d.body.h.toFixed(2)} · ${(d.body.depth * 100).toFixed(0)}% W thick`],
    ['Felt', swatch(feltHex(d.collection, d.felt)) + `${d.collection}.${d.felt}`],
    ['Thread', swatch(threadHex(d)) + (d.thread === 'cream' ? 'cream' : 'tone-on-tone')],
    ['Triangles', Math.round(tris).toLocaleString()],
    ['Draw calls', `${r.parts.length} — one per material`],
    ['Felt pieces', `${pieces} cut`],
    ['Stitches', `${stitches} sewn + rim`],
    ['2D records', `${r.flat.length} in the draw list`],
    ['Sewn in', `${Math.round(r.ms)} ms · ${lod} LOD`],
  ];
  $('#stats').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
}

// ---------- 2D over 3D ----------
function updateOverlayDom() {
  const S = pixelsPerUnit(seamItem), f = facing(current.matrixWorld, camera.position);
  for (const it of items) {
    const el = it.el;
    if (!el) continue;
    if (it.kind === 'dot') {
      el.setAttribute('cx', it.sp[0].toFixed(1)); el.setAttribute('cy', it.sp[1].toFixed(1));
      el.setAttribute('r', Math.max(1, it.r * S * 0.9).toFixed(1));
    } else {
      el.setAttribute('d', pathOf(it));
      el.setAttribute('stroke-width', Math.max(0.7, (it.w || 0.004) * S).toFixed(2));
      if (it.dash) el.setAttribute('stroke-dasharray', `${(it.dash * S).toFixed(1)} ${(it.gap * S).toFixed(1)}`);
    }
    // records sewn on the front are behind the felt when the plush turns away
    el.setAttribute('opacity', it.front ? (f > 0.02 ? (it.fillOpacity ?? 0.92) : 0) : (it.fillOpacity ?? 0.92));
  }
}
function updateSticker() {
  const wrap = $('#sticker'), dv = $('#divider');
  if (!fuse || !svgBox || !userSeam || !seamItem) { wrap.hidden = true; dv.hidden = true; stageEl.style.clipPath = 'none'; return; }
  wrap.hidden = false; dv.hidden = false;
  const [bx0, by0, bx1, by1] = seamItem.box;
  const px = (bx0 + bx1) / 2, py = (by0 + by1) / 2;
  const uw = userSeam.x1 - userSeam.x0;
  const S = uw > 0 ? (bx1 - bx0) / uw : 300;
  const ux = (userSeam.x0 + userSeam.x1) / 2, uy = (userSeam.y0 + userSeam.y1) / 2;
  const W = stageEl.clientWidth, left = px - (ux - svgBox.x) * S, top = py - (uy - svgBox.y) * S;
  wrap.style.width = svgBox.w * S + 'px'; wrap.style.height = svgBox.h * S + 'px';
  wrap.style.left = left + 'px'; wrap.style.top = top + 'px';
  const cut = (W * split) / 100;
  stageEl.style.clipPath = `inset(0 ${Math.max(0, W - cut)}px 0 0)`;
  wrap.style.clipPath = `inset(0 0 0 ${Math.max(0, cut - left)}px)`;
  dv.style.left = cut + 'px';
}

// ---------- frame loop ----------
const perf = { fps: 0, cpu: 0, draws: 0, tris: 0, pr: MAX_PR };
let pr = MAX_PR, win = [], cooldown = 0, probing = false, backoff = 8000, hudAt = 0, lastT = performance.now(), avgDt = 16.7;
const t0 = lastT;
function applyPR() { if (scaler.ok) scaler.scale = pr; else { renderer.setPixelRatio(pr); resize(); } perf.pr = pr; }
function governor(dt, now) {
  win.push(dt); if (win.length < 24) return;
  const avg = win.reduce((a, b) => a + b, 0) / win.length; win = [];
  if (avg > 18.7 && pr > 0.6) { pr = Math.max(0.6, pr - 0.125); cooldown = now + backoff; if (probing) backoff = Math.min(60000, backoff * 2); probing = false; applyPR(); }
  else if (avg < 17.5 && pr < MAX_PR && now > cooldown) { pr = Math.min(MAX_PR, pr + 0.125); probing = true; applyPR(); }
  else probing = false;
}
function hud(now) {
  if (now - hudAt < 400) return; hudAt = now;
  const i = renderer.info.render; perf.draws = i.calls; perf.tris = i.triangles;
  perf.fps = Math.round(1000 / Math.max(1, avgDt));
  $('#hud').textContent = `${perf.fps} fps · ${perf.cpu.toFixed(1)} ms CPU · ${i.calls} draws · ${(i.triangles / 1000).toFixed(0)}k tris · ${pr.toFixed(2)}× res`;
}
function loop(now) {
  const dt = Math.min(100, now - lastT); lastT = now; avgDt = avgDt * 0.9 + dt * 0.1;
  const t = (now - t0) / 1000;
  if (!dragging) {
    cam.yaw += cam.vyaw; cam.vyaw *= 0.94;
    if (spin && !reduced) cam.yaw += 0.0045;
    if (fuseEase > 0) {
      cam.yaw += -cam.yaw * 0.12; cam.pitch += -cam.pitch * 0.12;
      if (Math.abs(cam.yaw) < 0.003 && Math.abs(cam.pitch) < 0.003) { cam.yaw = 0; cam.pitch = 0; fuseEase = 0; }
    }
  }
  popT = Math.min(1, popT + dt / 380);
  const k = popT - 1, pop = 1 + 2.4 * k * k * k + 1.4 * k * k;
  pivot.rotation.set(cam.pitch, cam.yaw + (reduced ? 0 : Math.sin(t * 0.6) * 0.035), 0);
  pivot.scale.setScalar(0.86 + 0.14 * pop);
  cam.dist += (fitDist * cam.zoom - cam.dist) * Math.min(1, dt / 160);
  camera.position.set(0, 0, cam.dist); camera.lookAt(0, 0, 0);
  const c0 = performance.now();
  renderer.info.reset();
  scaler.render(scene, camera);
  perf.cpu = performance.now() - c0;
  if (current && (fuse || trace)) {
    projectItems(items, current.matrixWorld, camera, stageEl.clientWidth, stageEl.clientHeight);
    if (trace) updateOverlayDom();
    if (fuse) updateSticker();
  }
  governor(dt, now); hud(now);
  requestAnimationFrame(loop);
}

// ---------- orbit ----------
let dragging = false, lx = 0, ly = 0, moved = 0;
const ptrs = new Map(); let pinch0 = 0;
box.addEventListener('pointerdown', (e) => {
  box.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); dragging = true; lx = e.clientX; ly = e.clientY; moved = 0; fuseEase = 0;
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); }
});
box.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (pinch0) cam.zoom = Math.min(2.2, Math.max(0.45, cam.zoom * (pinch0 / d)));
    pinch0 = d; return;
  }
  const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
  cam.yaw += dx * 0.01; cam.vyaw = dx * 0.002;
  cam.pitch = Math.max(-1.3, Math.min(1.3, cam.pitch + dy * 0.008));
});
const up = (e) => { ptrs.delete(e.pointerId); if (!ptrs.size) { dragging = false; if (moved < 6 && current) popT = 0.4; } pinch0 = 0; };
box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
box.addEventListener('wheel', (e) => { e.preventDefault(); cam.zoom = Math.min(2.2, Math.max(0.45, cam.zoom * (1 + e.deltaY * 0.001))); }, { passive: false });
box.addEventListener('dblclick', front);

function front() { fuseEase = 1; cam.vyaw = 0; }
$('#front').addEventListener('click', front);

// ---------- controls ----------
function showSewing(on) { $('#sewing').hidden = !on; }
let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), 2200); }

async function build(d, priority = 'hi', key = 'hero') {
  const my = ++token;
  if (priority === 'hi') showSewing(true);
  const r = await pool.request({ op: 'build', dna: d, lod }, { priority, key });
  if (r === null || my !== token) return null;
  return r;
}
async function load(d) { const r = await build(d); if (r) attach(r, d); scheduleAhead(); }

// speculative sewing: the next random character is already cut out before the dice is pressed
let ahead = null, aheadT = 0;
const randSeed = () => (Math.random() * 2 ** 31) >>> 0;
function scheduleAhead() {
  clearTimeout(aheadT);
  aheadT = setTimeout(() => { ahead = pool.request({ op: 'random', opts: { seed: randSeed(), collection: dna.collection, existing: gridDnas() }, lod }, { priority: 'lo', key: 'ahead' }); }, 350);
}
async function randomize() {
  const t0 = performance.now();
  let r = ahead ? await ahead.p : null;
  ahead = null;
  if (!r) { const my = ++token; showSewing(true); r = await pool.request({ op: 'random', opts: { seed: randSeed(), collection: dna.collection, existing: gridDnas() }, lod }, { priority: 'hi', key: 'hero' }); if (r === null || my !== token) return; }
  if (!r || !r.ok) { toast('Could not sew that one — try another'); showSewing(false); return; }
  ++token;
  attach(r, r.dna);
  $('#swap').textContent = `${Math.round(performance.now() - t0)} ms to a new character`;
  scheduleAhead();
}
$('#dice').addEventListener('click', randomize);
$('#spin').addEventListener('click', (e) => { spin = !spin; e.currentTarget.setAttribute('aria-pressed', String(spin)); });
$$('#lod .chip').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.k === lod) return;
  lod = b.dataset.k;
  $$('#lod .chip').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === lod)));
  load(dna);
}));
$$('#collection .chip').forEach((b) => b.addEventListener('click', () => {
  const k = b.dataset.k;
  if (k === dna.collection) return;
  $$('#collection .chip').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === k)));
  pool.request({ op: 'random', opts: { seed: randSeed(), collection: k } }, { priority: 'hi', key: 'hero' }).then((r) => { if (r && r.ok) { attach(r, r.dna); scheduleAhead(); } });
  sewGrid(randSeed(), k);
}));

// fuse controls
const fuseBox = $('#fuse'), traceBox = $('#trace'), splitEl = $('#split');
fuseBox.addEventListener('change', () => {
  fuse = fuseBox.checked;
  $('.fusebar').classList.toggle('on', fuse);
  if (fuse) {
    front();                                  // face the camera so the flat sticker registers on the silhouette
    if (!trace) { trace = true; traceBox.checked = true; $('#ov').hidden = false; }
  } else {
    stageEl.style.clipPath = 'none';
  }
  updateSticker();
});
traceBox.addEventListener('change', () => { trace = traceBox.checked; $('#ov').hidden = !trace; if (!trace && !fuse) stageEl.style.clipPath = 'none'; });
splitEl.addEventListener('input', () => { split = +splitEl.value; });

document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'r' || e.key === 'R') randomize();
  if (e.key === 'f' || e.key === 'F') front();
});

// ---------- 3D thumbnails: every grid character is really rendered, not illustrated ----------
function capture(r) {
  const g = makeGroup(r.parts, r.size);
  const [cx, cy, fh, fw] = flatCentre(r.flat);
  g.position.set(-cx * r.size, -cy * r.size, 0);
  const asp = camera.aspect || 1.2;
  const fit = Math.max(2.4, fh * r.size * 2.7, (fw * r.size * 2.35) / asp);
  const kr = pivot.rotation.clone(), ks = pivot.scale.clone(), kp = camera.position.clone(), kq = camera.quaternion.clone(), kv = pivot.visible;
  pivot.visible = false; root.add(g);
  camera.position.set(0, 0, fit); camera.lookAt(0, 0, 0);
  scaler.render(scene, camera);
  const src = renderer.domElement, S = 176, c = document.createElement('canvas'); c.width = c.height = S;
  const k = Math.min(src.width, src.height);
  c.getContext('2d').drawImage(src, (src.width - k) / 2, (src.height - k) / 2, k, k, 0, 0, S, S);
  ungroup(g);
  pivot.visible = kv; pivot.rotation.copy(kr); pivot.scale.copy(ks); camera.position.copy(kp); camera.quaternion.copy(kq);
  scaler.render(scene, camera); // restore the hero before the browser paints, so nothing flickers
  return c.toDataURL('image/jpeg', 0.84);
}

let gridSeq = 0, gridSet = [];
const gridDnas = () => gridSet.filter((d) => d.body.t !== 'sun');
async function sewGrid(seed, collection = dna.collection) {
  const my = ++gridSeq;
  const set = generateSet({ seed, collection, n: 12 });
  gridSet = set;
  const el = $('#grid'); el.innerHTML = '';
  set.forEach((d, i) => {
    const ph = document.createElement('div'); ph.className = 'cell loading';
    ph.innerHTML = `<span class="pair"><span class="ph3">sewing…</span><span class="ph2">sewing…</span></span><span class="meta">${d.body.t}</span>`;
    el.appendChild(ph);
  });
  const built = await Promise.all(set.map((d) => pool.request({ op: 'build', dna: d, lod: 'map' }, { priority: 'lo' })));
  for (let i = 0; i < set.length; i++) {
    if (my !== gridSeq) return;
    const r = built[i], d = set[i];
    if (!r || !r.ok) continue;
    const svg = r ? toSVG(r.flat, { id: 'g' + i, title: describe(d) }) : '';
    const img = capture(r);
    if (my !== gridSeq) return;
    const cell = el.children[i];
    cell.className = 'cell';
    cell.innerHTML = `<button type="button" class="open"><span class="pair"><img alt="3D ${describe(d)}" src="${img}"><img class="two" alt="2D ${describe(d)}" src="${svgUrl(svg)}"></span><span class="meta"><b>${d.body.t === 'sun' ? 'Self' : d.body.t}</b><i>${d.felt}</i></span></button>`;
    cell.querySelector('.open').addEventListener('click', () => load(structuredClone(d)));
  }
}
$('#reshuffle').addEventListener('click', () => sewGrid(randSeed()));

// ---------- sticker actions ----------
async function download(name, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Saved ' + name);
}
const slug = () => (dna.body.t + '-' + dna.felt).toLowerCase().replace(/[^a-z0-9]+/g, '-');
$('#svg-dl').addEventListener('click', () => download(slug() + '.svg', new Blob([currentSvg], { type: 'image/svg+xml' })));
$('#png-dl').addEventListener('click', () => {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'), w = 1024, h = Math.round((w * img.height) / img.width) || w;
    c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
    c.toBlob((b) => b && download(slug() + '.png', b));
  };
  img.onerror = () => toast('Could not rasterise the PNG');
  img.src = svgUrl(currentSvg);
});

// ---------- go ----------
resize();
load(dna);
sewGrid(20261003);
requestAnimationFrame(loop);
window.__ready = true;
