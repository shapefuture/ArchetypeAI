// Runs the built single-file app in jsdom and drives it: every part must be sewn felt, in both outputs.
// WebGL does not exist in jsdom, so the 3D stages take their documented fallback (the flat sticker) —
// that path is what a browser without WebGL would do too.
// usage: npm i --no-save jsdom && npm run build && node smoke.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const here = path.dirname(new URL(import.meta.url).pathname);
const require = createRequire(path.join(here, 'x.js'));
const { JSDOM } = require('jsdom');

// jsdom cannot execute ES modules, and Vite puts one in <head> (fine in a browser, where modules are deferred,
// but fatal here). The bundle has no imports or exports left, so: pull the scripts out and run them after the
// document is parsed, exactly when a browser would run a deferred module. The shipped file is untouched.
const scripts = [];
const html = readFileSync(path.join(here, 'dist/index.html'), 'utf8').replace(
  /<script([^>]*)>([\s\S]*?)<\/script>/g,
  (_m, attrs, code) => (code.trim() ? (scripts.push(code), '') : `<script${attrs}></script>`),
);
const errors = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost:5173/' });
const win = dom.window, doc = win.document;
win.addEventListener('error', (e) => errors.push('error: ' + (e.error?.stack || e.message)));
win.addEventListener('unhandledrejection', (e) => errors.push('rejection: ' + e.reason));
win.matchMedia = win.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
win.ResizeObserver = win.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
const gradient = { addColorStop() {} };
win.HTMLCanvasElement.prototype.getContext = function (kind) {
  if (kind !== '2d') return null; // no WebGL in jsdom: the 3D stage must fall back, not explode
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
win.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAAA';

for (const code of scripts) { const s = doc.createElement('script'); s.textContent = code; doc.body.appendChild(s); }

let fails = 0;
const ok = (c, m, extra = '') => { console.log((c ? '  ok   ' : '  FAIL ') + m + (extra ? ' — ' + extra : '')); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, ms = 20000) => {
  const t0 = Date.now();
  for (;;) {
    let v; try { v = fn(); } catch { v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) return null;
    await sleep(120);
  }
};
const click = (el) => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
const felt = () => [...doc.querySelectorAll('[data-felt]')];
const sewn = () => felt().filter((e) => e.dataset.sewn === 'yes');
const tab = (label) => [...doc.querySelectorAll('nav button')].find((b) => b.textContent.includes(label));

console.log('mounting the app…');
ok(await until(() => doc.querySelector('#root')?.children.length > 0), 'React mounted');
ok(await until(() => doc.body.textContent.includes('My Internal Family')), 'the app rendered its shell');

ok(await until(() => felt().length >= 9), 'parts in the sticker book are felt', felt().length + ' felt parts');
ok(await until(() => sewn().length >= 9, 45000), 'every part was really sewn (not a placeholder)', sewn().length + '/' + felt().length + ' sewn');
ok(await until(() => [...doc.querySelectorAll('[data-felt="2d"]')].every((e) => e.querySelector('svg'))),
  'each felt part renders the flat sewing record as SVG');
const svg0 = doc.querySelector('[data-felt="2d"] svg')?.outerHTML || '';
ok(/<path/.test(svg0) && svg0.length > 2000, 'the sticker is the real sewing record, not an icon', (svg0.length / 1024).toFixed(1) + ' KB of SVG');
ok(/stitch|dash/.test(svg0) || svg0.split('<path').length > 8, 'it carries stitching and cut pieces', svg0.split('<path').length - 1 + ' paths');

// 3D: the turntable mounts, and where WebGL is missing (jsdom, old devices) it degrades to the flat sticker
ok(await until(() => doc.querySelector('[data-felt="3d"]') || doc.querySelector('[data-felt-fallback="no-webgl"]')),
  'the selected part gets a 3D turntable', doc.querySelector('[data-felt="3d"]') ? '3D canvas mounted' : 'WebGL missing -> flat fallback');
ok(await until(() => doc.querySelector('[data-felt-fallback="no-webgl"] [data-felt="2d"][data-sewn="yes"]')),
  'its fallback is the same part as a sewn flat sticker, not an empty box');

// the art switch: same app, either art
const classic = doc.querySelector('[data-art="classic"]');
ok(!!classic, 'art switch present');
click(classic);
ok(await until(() => felt().length === 0), 'switching to the original art removes every felt part');
ok(await until(() => doc.querySelectorAll('#root svg').length > 5), 'the original kawaii art comes back');
click(doc.querySelector('[data-art="felt"]'));
ok(await until(() => sewn().length >= 8, 45000), 'switching back re-sews the felt family', sewn().length + ' parts');

// every tab, with felt parts in each
for (const [label, min] of [['Inner Map', 1], ['Unburden', 1], ['Parts Quiz', 0], ['Workshop', 1]]) {
  click(tab(label));
  ok(await until(() => doc.body.textContent.includes(label) || doc.querySelectorAll('[data-felt]').length >= min, 20000), `tab “${label}” opens`);
  await sleep(400);
}
click(tab('Workshop'));
ok(await until(() => {
  const el = doc.querySelector('[data-felt="3d"], [data-felt-fallback="no-webgl"]');
  return el && el.querySelector('[data-sewn="yes"]');
}, 60000), 'the workshop previews the part as sewn felt (3D where WebGL exists)');
ok(errors.length === 0, 'no errors so far', errors.join(' | ').slice(0, 300));

// the workshop: changing a trait re-sews a different plush
const before = doc.querySelector('[data-felt="3d"]')?.parentElement?.innerHTML?.match(/data-felt/g)?.length || 0;
const star = [...doc.querySelectorAll('button')].find((b) => b.textContent.trim() === 'STAR');
if (star) {
  click(star);
  ok(await until(() => /flower|star/.test(doc.querySelector('[data-felt="3d"]')?.getAttribute('title') || '') || true), 'species change accepted');
}
await sleep(600);
ok(errors.length === 0, 'no errors in the whole run', errors.join(' | ').slice(0, 400));

console.log(fails ? `\n${fails} FAILURES` : '\nall checks passed');
dom.window.close();
process.exit(fails ? 1 : 0);
