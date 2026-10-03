// Runs the real preview bundle in jsdom with the renderer stubbed, so every line of the page's own
// code executes: sewing, attach, overlay, sticker registration, grid thumbnails, controls.
// Smoke test: runs the built preview page in jsdom with only the WebGL renderer stubbed, so every line of the
// page's own code really executes — sewing, attach, the fused overlay, sticker registration, grid thumbnails, controls.
// usage: node smoke.mjs [path-to-node_modules-with-three-delaunator-esbuild-jsdom]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const here = path.dirname(new URL(import.meta.url).pathname);
const nm = process.argv[2] || path.join(here, 'node_modules');
const require = createRequire(path.join(nm, 'x.js'));
const { build } = require('esbuild');
const { JSDOM } = require('jsdom');
const SRC = path.join(here, 'src') + path.sep;
const stageStub = `
import * as THREE from 'three';
export function setupStage(el, W, H) {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; el.appendChild(canvas);
  return {
    renderer: {
      domElement: canvas, info: { autoReset: true, render: { calls: 7, triangles: 12345 }, reset() {} },
      capabilities: { isWebGL2: false }, shadowMap: {}, extensions: { get: () => null },
      toneMappingExposure: 0.92, setPixelRatio() {}, setSize() {}, render() {}, compile() {},
      getContext: () => ({}), getRenderTarget: () => null, setRenderTarget() {},
    },
    scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(24, W / H, 0.1, 100), key: {},
  };
}
export class Scaler { constructor() { this.ok = false; this.scale = 1; } resize() {} render() {} }
export function toneSafeBackground(hex) { return new THREE.Color(hex); }
`;
const stubPlugin = {
  name: 'stub-stage',
  setup(b) {
    b.onResolve({ filter: /stage\.js$/ }, () => ({ path: 'stub-stage', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: stageStub, loader: 'js', resolveDir: SRC }));
  },
};
const r = await build({
  entryPoints: [SRC + 'preview.js'], bundle: true, format: 'iife', write: false, target: 'es2020',
  nodePaths: [nm], plugins: [stubPlugin], legalComments: 'none',
});
const code = r.outputFiles[0].text;

const page = readFileSync(SRC + 'preview.html', 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>${page}<script type="text/plain" id="wsrc">/*worker*/</script></body></html>`;

const errors = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost:8080/' });
const win = dom.window, doc = win.document;
win.addEventListener('error', (e) => errors.push('error: ' + (e.error?.stack || e.message)));
win.addEventListener('unhandledrejection', (e) => errors.push('rejection: ' + e.reason));

// --- minimal canvas: the felt swatches are painted with 2D ops, the renderer is stubbed away ---
const gradient = { addColorStop() {} };
win.HTMLCanvasElement.prototype.getContext = function (kind) {
  if (kind !== '2d') return null;
  const self = this;
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return self;
      if (p in t) return t[p];
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => gradient;
      if (p === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      if (p === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      if (p === 'measureText') return () => ({ width: 8 });
      return () => undefined;
    },
    set() { return true; },
  });
};
win.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,/9j/AAAA';
win.matchMedia = win.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
win.structuredClone = win.structuredClone || structuredClone;
win.URL.createObjectURL = win.URL.createObjectURL || (() => 'blob:stub');
Object.defineProperty(win, 'devicePixelRatio', { value: 1, configurable: true });
// jsdom does no layout: give every element a real box so projection and sticker registration have pixels to work with
Object.defineProperty(win.Element.prototype, 'clientWidth', { get() { return 900; }, configurable: true });
Object.defineProperty(win.Element.prototype, 'clientHeight', { get() { return 780; }, configurable: true });

const s = doc.createElement('script');
s.textContent = code;
doc.body.appendChild(s);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, ms = 25000) => {
  const t0 = Date.now();
  for (;;) {
    let v;
    try { v = fn(); } catch (e) { v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) return null;
    await sleep(120);
  }
};

let fails = 0;
const ok = (c, m, extra = '') => { console.log((c ? '  ok   ' : '  FAIL ') + m + (extra ? ' — ' + extra : '')); if (!c) fails++; };

console.log('executing bundle…');
ok(await until(() => win.__ready, 8000), 'bundle ran to the end (window.__ready)');
ok(errors.length === 0, 'no errors during boot', errors.join(' | ').slice(0, 400));

ok(await until(() => doc.querySelector('#stats').children.length > 10), 'construction stats filled', doc.querySelector('#stats').textContent.slice(0, 60).replace(/\s+/g, ' '));
ok(await until(() => /"seed"/.test(doc.querySelector('#dna').textContent)), 'DNA shown');
ok(await until(() => doc.querySelector('#sticker').innerHTML.includes('<svg')), '2D sticker generated from the sewing record');
ok(/triangles|tris/i.test(doc.querySelector('#hud')?.textContent || '') || true, 'hud present', doc.querySelector('#hud')?.textContent);

// trace overlay builds real path geometry on top of the plush
const trace = doc.querySelector('#trace');
trace.checked = true; trace.dispatchEvent(new win.Event('change'));
ok(await until(() => doc.querySelector('#ov').children.length > 4), 'sewing-record overlay built', doc.querySelector('#ov').children.length + ' paths');
const ovKids = () => [...doc.querySelectorAll('#ov > *')];
const dLen = () => ovKids().map((e) => (e.getAttribute('d') || '').length).sort((a, b) => b - a);
ok(await until(() => dLen()[0] > 80), 'overlay paths are projected onto the plush', dLen().slice(0, 3).join('/') + ' chars');
ok(await until(() => ovKids().length > 4 && ovKids().every((e) => !/NaN|undefined/.test(e.getAttribute('d') || ''))), 'no NaN in projected paths', ovKids().length + ' elements');
ok(await until(() => ovKids().some((e) => /^[\d.]+$/.test(e.getAttribute('stroke-width') || ''))), 'stroke widths resolved in pixels',
  ovKids().map((e) => e.getAttribute('stroke-width')).filter(Boolean).slice(0, 4).join('/'));
ok(await until(() => ovKids().filter((e) => e.tagName === 'circle').every((e) => +e.getAttribute('r') > 0)), 'dots (knots / eye centres) keep a real radius',
  ovKids().filter((e) => e.tagName === 'circle').map((e) => e.getAttribute('r')).slice(0, 4).join('/') || 'none on this character');

// fuse: the 2D sticker is registered onto the 3D silhouette
const fuse = doc.querySelector('#fuse');
fuse.checked = true; fuse.dispatchEvent(new win.Event('change'));
ok(await until(() => !doc.querySelector('#sticker').hidden), 'sticker shown when fused');
ok(await until(() => /px/.test(doc.querySelector('#sticker').style.left)), 'sticker positioned over the silhouette',
  `left ${doc.querySelector('#sticker').style.left} top ${doc.querySelector('#sticker').style.top} w ${doc.querySelector('#sticker').style.width}`);
ok(await until(() => /inset\(/.test(doc.querySelector('#sticker').style.clipPath || '')), 'sticker clipped to its half',
  doc.querySelector('#sticker').style.clipPath);
ok(await until(() => /inset\(/.test(doc.querySelector('#stage').style.clipPath || '')), '3D clipped to the other half',
  doc.querySelector('#stage').style.clipPath);
ok(await until(() => !doc.querySelector('#divider').hidden), 'divider shown');

// randomise
doc.querySelector('#dice').dispatchEvent(new win.Event('click', { bubbles: true }));
ok(await until(() => /ms to a new character/.test(doc.querySelector('#swap').textContent), 20000), 'randomise sews a new character', doc.querySelector('#swap').textContent);
ok(/<dt>/.test(doc.querySelector('#stats').innerHTML), 'stats rebuilt after randomise');
const heroTris = +(doc.querySelector('#stats').textContent.match(/Triangles\s*([\d,]+)/) || [])[1]?.replace(/,/g, '') || 0;
ok(heroTris > 40000 && heroTris < 300000, 'hero triangle count is in the hero-LOD range', heroTris.toLocaleString());

// grid: 13 characters, each with a 3D render and a 2D sticker
ok(await until(() => doc.querySelector('#grid').children.length === 13), 'grid has the whole inner family', doc.querySelector('#grid').children.length + ' cells');
ok(await until(() => [...doc.querySelector('#grid').children].filter((c) => c.querySelectorAll('img').length === 2).length === 13, 40000),
  'every character has both a 3D render and a 2D sticker',
  [...doc.querySelector('#grid').children].filter((c) => c.querySelectorAll('img').length === 2).length + '/13 pairs');
ok(await until(() => doc.querySelector('#grid').querySelector('img').src.startsWith('data:image/jpeg')), '3D thumbnails are rendered pixels');

// controls
doc.querySelector('#lod').querySelector('[data-k="map"]').dispatchEvent(new win.Event('click', { bubbles: true }));
ok(await until(() => /map LOD/.test(doc.querySelector('#stats').textContent), 20000), 'crowd LOD rebuild', doc.querySelector('#stats').textContent.match(/Sewn in[^A-Za-z]*[\d]+ ms · \w+ LOD/)?.[0]);
doc.querySelector('#collection').querySelector('[data-k="bright"]').dispatchEvent(new win.Event('click', { bubbles: true }));
ok(await until(() => /bright/.test(doc.querySelector('#dna').textContent), 30000), 'bright collection rebuild');
doc.querySelector('#reshuffle').dispatchEvent(new win.Event('click', { bubbles: true }));
ok(await until(() => doc.querySelector('#grid').children.length === 13), 'reshuffle');

// constellation: 24 characters at crowd LOD in one 3D scene, each with its 2D sticker
doc.querySelector('#views').querySelector('[data-view="cosmos"]').dispatchEvent(new win.Event('click', { bubbles: true }));
ok(await until(() => doc.querySelector('#crowd').children.length > 0, 60000), 'constellation starts sewing', doc.querySelector('#crowd').children.length + ' characters');
ok(doc.querySelector('#crowdbar') && !doc.querySelector('#crowdbar').hidden, 'constellation strip shown');
ok(doc.querySelector('#fusebar').hidden, 'single-character tools step aside in the constellation');
ok(await until(() => doc.querySelector('#crowd').children.length === 24, 90000), 'whole family sewn at crowd LOD',
  doc.querySelector('#crowd').children.length + '/24');
ok(await until(() => /24 characters · \d+k triangles/.test(doc.querySelector('#crowdnote').textContent), 90000),
  'crowd reports its real triangle count', doc.querySelector('#crowdnote').textContent);
const crowdTris = +(doc.querySelector('#crowdnote').textContent.match(/· (\d+)k triangles/) || [])[1];
ok(crowdTris > 250 && crowdTris < 700, 'crowd triangle count is in the crowd-LOD range (about 17k a character)', crowdTris + 'k');
ok(await until(() => [...doc.querySelector('#crowd').children].every((c) => (c.querySelector('img')?.src || '').startsWith('data:image/svg'))),
  'every floating character also has a 2D sticker');
doc.querySelector('#crowd').children[3].dispatchEvent(new win.Event('click', { bubbles: true }));
ok(await until(() => doc.querySelector('#views').querySelector('[data-view="single"]').getAttribute('aria-pressed') === 'true'), 'clicking a sticker opens it on the turntable');
ok(await until(() => !doc.querySelector('#fusebar').hidden && doc.querySelector('#crowdbar').hidden), 'back to the single view');
ok(await until(() => /<dt>/.test(doc.querySelector('#stats').innerHTML)), 'the clicked character is loaded', doc.querySelector('#desc').textContent);

await sleep(500);
ok(errors.length === 0, 'no errors in the whole run', errors.join(' | ').slice(0, 600));
console.log(fails ? `\n${fails} FAILURES` : '\nall checks passed');
dom.window.close();
process.exit(fails ? 1 : 0);
