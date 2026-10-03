// Felt Atelier — character customizer + randomizer UI.
import * as THREE from 'three';
import { BODIES, EYES, MOUTHS, PATCHES, BROWS, TOPPERS, FELT, PATCH_FELT, generate, describe, lint } from './dna.js';
import { buildCharacter } from './builder.js';
import { setupStage } from './stage.js';
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
  syncControls(); scheduleBuild();
}
const edit = (fn) => { const n = structuredClone(dna); fn(n); commit(n); };

// ---------- 3D stage ----------
const stageEl = $('#stage');
const { renderer, scene, camera } = setupStage(stageEl, stageEl.clientWidth || 600, stageEl.clientHeight || 500, { dpr: Math.min(2, devicePixelRatio || 1) });
const pivot = new THREE.Group(); scene.add(pivot);
let current = null, yaw = 0.35, pitch = -0.28, vyaw = 0, dist = 2.9, squish = 0, t0 = performance.now();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function themeBg() { const c = getComputedStyle(document.documentElement).getPropertyValue('--stage').trim() || '#e9e7e3'; scene.background = new THREE.Color(c); }
themeBg(); matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeBg);
new MutationObserver(themeBg).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

function resize() { const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stageEl);

function disposeGroup(g) { g.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); if (o.material.vertexColors) o.material.dispose(); } }); }
let buildTimer = 0, building = false;
function scheduleBuild(delay = 90) { clearTimeout(buildTimer); $('#sewing').hidden = false; buildTimer = setTimeout(build, delay); }
function build() {
  building = true;
  const s = performance.now();
  try {
    const g = buildCharacter(dna);
    if (current) { pivot.remove(current); disposeGroup(current); }
    current = g; pivot.add(g);
    // centre the character in the frame
    const box = new THREE.Box3().setFromObject(g); const c = box.getCenter(new THREE.Vector3()); g.position.sub(c.setZ(0));
    $('#msg').textContent = `${describe(dna)} · sewn in ${Math.round(performance.now() - s)} ms`;
    const v = lint(dna); $('#lint').textContent = v.length ? 'Note: ' + v.join('; ') : '';
  } catch (e) { $('#msg').textContent = 'Could not sew this combination: ' + e.message; }
  building = false; $('#sewing').hidden = true;
}

function loop(now) {
  const t = (now - t0) / 1000;
  if (!dragging) { yaw += vyaw; vyaw *= 0.94; if (spin && !reduced) yaw += 0.004; }
  pivot.rotation.set(pitch, yaw + (reduced ? 0 : Math.sin(t * 0.6) * 0.04), 0);
  squish *= 0.88; const br = reduced ? 0 : Math.sin(t * 1.7) * 0.008;
  pivot.scale.set(1 + squish * 0.06, 1 - squish * 0.08 + br, 1 + squish * 0.04);
  camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// orbit controls (pointer + wheel + pinch)
let dragging = false, lx = 0, ly = 0, moved = 0, spin = store.get('felt.spin', false);
const ptrs = new Map(); let pinch0 = 0;
const cv = renderer.domElement; cv.style.touchAction = 'none';
cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); dragging = true; lx = e.clientX; ly = e.clientY; moved = 0; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
cv.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0) dist = Math.min(6, Math.max(1.6, dist * pinch0 / d)); pinch0 = d; return; }
  const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
  yaw += dx * 0.01; vyaw = dx * 0.002; pitch = Math.max(-1.3, Math.min(1.3, pitch + dy * 0.008));
});
const up = (e) => { ptrs.delete(e.pointerId); if (!ptrs.size) { dragging = false; if (moved < 6) squish = 1; } pinch0 = 0; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('wheel', (e) => { e.preventDefault(); dist = Math.min(6, Math.max(1.6, dist * (1 + e.deltaY * 0.001))); }, { passive: false });
cv.addEventListener('dblclick', () => { yaw = 0; pitch = 0; dist = 2.9; vyaw = 0; });

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
function slider(id, get, set) { const el = $('#' + id); el.addEventListener('input', () => { const n = structuredClone(dna); set(n, +el.value); dna = n; store.set('felt.current', dna); scheduleBuild(140); }); el.addEventListener('change', () => commit(dna)); el._sync = () => { el.value = get(); }; return el; }

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
function randomize() {
  const L = {};
  if (locks.shape) { L.body = dna.body; L.size = dna.size; }
  if (locks.felt) { L.felt = dna.felt; L.thread = dna.thread; }
  if (locks.face) { L.eyes = dna.eyes; L.mouth = dna.mouth; }
  if (locks.accessory) { L.patch = dna.patch; L.topper = dna.topper || { t: 'none' }; }
  const seed = (Math.random() * 2 ** 31) >>> 0;
  let n;
  try { n = generate({ seed, collection: dna.collection, locks: L, existing: saved.map((s) => s.dna).filter((d) => d.body.t !== 'sun'), self: L.body?.t === 'sun' }); }
  catch { n = generate({ seed, collection: dna.collection, locks: L, self: L.body?.t === 'sun' }); }
  n.name = dna.name; commit(n); squish = 1;
}
$('#dice').addEventListener('click', randomize);
$('#undo').addEventListener('click', () => { if (cursor > 0) { cursor--; commit(JSON.parse(history[cursor]), { push: false }); } });
$('#redo').addEventListener('click', () => { if (cursor < history.length - 1) { cursor++; commit(JSON.parse(history[cursor]), { push: false }); } });
$('#spin').addEventListener('click', () => { spin = !spin; store.set('felt.spin', spin); syncControls(); });
$('#front').addEventListener('click', () => { yaw = 0; pitch = 0; vyaw = 0; dist = 2.9; });
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'r' || e.key === ' ') { e.preventDefault(); randomize(); }
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

// constellation shelf
function renderShelf() {
  const el = $('#shelf'); el.innerHTML = '';
  if (!saved.length) { el.innerHTML = '<p class="empty">Saved parts appear here. Sew one you like, then press Save to shelf.</p>'; return; }
  saved.forEach((s, i) => {
    const b = document.createElement('div'); b.className = 'shelf-item';
    b.innerHTML = `<button type="button" class="load"><img alt="${describe(s.dna)}" src="${s.img}"><span>${(s.dna.name || LABEL[s.dna.body.t]).replace(/</g, '&lt;')}</span></button><button type="button" class="del" aria-label="Remove from shelf">×</button>`;
    $('.load', b).addEventListener('click', () => commit(structuredClone(s.dna)));
    $('.del', b).addEventListener('click', () => { saved.splice(i, 1); store.set('felt.saved', saved); renderShelf(); });
    el.appendChild(b);
  });
}
function snapshot() {
  const p = pivot.rotation.clone(), sc = pivot.scale.clone(), d = dist;
  pivot.rotation.set(-0.2, 0.25, 0); pivot.scale.set(1, 1, 1); camera.position.set(0, 0, 2.7); camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  const src = renderer.domElement, c = document.createElement('canvas'), S = 160; c.width = c.height = S;
  const k = Math.min(src.width, src.height); c.getContext('2d').drawImage(src, (src.width - k) / 2, (src.height - k) / 2, k, k, 0, 0, S, S);
  pivot.rotation.copy(p); pivot.scale.copy(sc); dist = d;
  return c.toDataURL('image/jpeg', 0.82);
}
$('#save').addEventListener('click', () => {
  if (building) return;
  saved.unshift({ dna: structuredClone(dna), img: snapshot() }); saved = saved.slice(0, 24);
  store.set('felt.saved', saved); renderShelf(); toast('Saved to shelf');
});

let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), 2200); }

syncControls(); renderShelf(); resize(); build(); requestAnimationFrame(loop);
window.__ready = true;
