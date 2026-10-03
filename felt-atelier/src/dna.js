// Felt Atelier — character DNA, felt library, seeded randomness, randomizer + taste linter.

export const BODIES = ['cloud', 'frog', 'triangle', 'heart', 'bean', 'drop', 'crescent', 'square', 'flower', 'mochi', 'pentagon', 'pill'];
export const EYES = ['button', 'dot', 'side', 'arc', 'lash', 'line', 'halflid', 'wink'];
export const TOPPERS = ['none', 'planetStalk', 'cometTail', 'saturnRing', 'starSprout', 'moonCrest', 'orbitMoon'];
export const MOODS = ['happy', 'content', 'sleepy', 'grumpy', 'side', 'surprised', 'wink', 'smirk'];
export const MOUTHS = ['none', 'smile', 'frown', 'o', 'line', 'wobble', 'smirk'];
export const PATCHES = ['planet', 'moon', 'star', 'comet', 'orbit', 'constellation', 'none'];
export const BROWS = ['none', 'stern', 'worried'];

// Physical felt swatches (craft felt comes in fixed colours — no colour wheel).
export const FELT = {
  wool: {
    lime: '#9dbd3e', snow: '#efede6', teal: '#22707b', rose: '#c9808a', mustard: '#d3a12c', forest: '#2f6a46',
    lilac: '#b7a3d4', terracotta: '#cf6b3d', sage: '#8ea98f', orange: '#e2733a', sky: '#9fc3e0', brick: '#b5472f',
    peach: '#efb79a', gold: '#d6a743', navy: '#2d3f73', plum: '#7b4a78', cream: '#ece1c8', slate: '#8f969c',
    mint: '#9fd1bd', coral: '#e2775f', cobalt: '#3e5ea9', pink: '#e39bb2', butter: '#e7c64c', cherry: '#c3343c',
  },
  bright: {
    teal: '#13a3a3', green: '#2fa54a', red: '#e1302a', pink: '#f37fb1', grey: '#a9a9a9', blue: '#2c6fd6',
    purple: '#8d4ec6', orange: '#f5731b', cream: '#f4ead5', lime: '#98d23a', navy: '#20398b', yellow: '#f6cf27',
    sunflower: '#f7b21a', magenta: '#d2238a', sky: '#57b7ea', mint: '#5fd0a8',
  },
};
// Felt that reads well as a small patch on top of another felt.
export const PATCH_FELT = {
  wool: ['gold', 'cream', 'snow', 'lilac', 'sky', 'butter', 'coral', 'mint', 'slate', 'pink', 'navy', 'teal'],
  bright: ['yellow', 'cream', 'sunflower', 'sky', 'pink', 'purple', 'grey', 'mint', 'blue', 'orange'],
};

// ---------- seeded randomness ----------
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function rng(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.weighted = (obj) => { const e = Object.entries(obj); let t = e.reduce((s, [, w]) => s + w, 0) * r(); for (const [k, w] of e) { t -= w; if (t <= 0) return k; } return e[e.length - 1][0]; };
  return r;
}
export const dnaHash = (dna) => hashStr(JSON.stringify(dna));

// ---------- colour helpers (OKLab) ----------
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export function oklab(hex) {
  const [r, g, b] = hex2rgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export const deltaE = (a, b) => { const A = oklab(a), B = oklab(b); return 100 * Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
export const feltHex = (collection, id) => /^#[\da-f]{6}$/i.test(id) ? id : FELT[collection]?.[id] || '#999999';
export function threadHex(dna) {
  if (dna.thread && dna.thread.startsWith('#')) return dna.thread;
  if (dna.thread === 'cream') return '#f2ead6';
  // tone-on-tone: a lighter, slightly desaturated shade of the body felt
  const [r, g, b] = hex2rgb(feltHex(dna.collection, dna.felt));
  const L = oklab(feltHex(dna.collection, dna.felt))[0];
  const k = L < 0.62 ? 0.45 : -0.45; // tone-on-tone: one clear shade lighter on deep felt, deeper on pale felt
  const mix = (c) => Math.round(255 * Math.min(1, Math.max(0, k > 0 ? c + (1 - c) * k : c * (1 + k))));
  return '#' + [r, g, b].map(mix).map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ---------- template metadata (eye line, size class, patch zones) ----------
// coordinates in unit body space (width ~1, centred), y up.
export const TEMPLATE = {
  cloud:    { eyeY: 0.02, eyeGap: 0.4, small: false, zones: [[0.26, -0.06], [-0.26, -0.06], [0.12, 0.2], [-0.3, 0.06]] },
  frog:     { eyeY: 0.27, eyeGap: 0.54, small: false, zones: [[0.24, -0.14], [-0.24, -0.14]], bumpEyes: true },
  triangle: { eyeY: -0.04, eyeGap: 0.3, small: false, zones: [[0.17, -0.2], [-0.17, -0.2]] },
  heart:    { eyeY: 0.06, eyeGap: 0.4, small: false, zones: [[0.2, -0.1], [-0.2, -0.1], [0.25, 0.2], [-0.25, 0.2]] },
  bean:     { eyeY: 0.04, eyeGap: 0.42, small: false, zones: [[0.3, -0.06], [-0.3, -0.05], [0.33, 0.1]] },
  drop:     { eyeY: -0.1, eyeGap: 0.28, small: true, zones: [[0.12, -0.27], [-0.12, -0.27]] },
  crescent: { eyeY: 0.0, eyeGap: 0.16, small: true, zones: [[-0.12, -0.27], [-0.2, 0.2]], eyeX: -0.25 },
  square:   { eyeY: 0.06, eyeGap: 0.42, small: false, zones: [[0.22, -0.18], [-0.22, -0.18], [0.24, 0.22], [-0.25, 0.2]] },
  flower:   { eyeY: 0.04, eyeGap: 0.36, small: false, zones: [[0.24, -0.2], [-0.24, -0.2], [0.0, 0.3]] },
  mochi:    { eyeY: 0.02, eyeGap: 0.4, small: false, zones: [[0.26, -0.08], [-0.26, -0.08], [0.0, 0.22]] },
  pentagon: { eyeY: 0.04, eyeGap: 0.38, small: false, zones: [[0.2, -0.17], [-0.2, -0.17], [0.0, 0.26]] },
  pill:     { eyeY: 0.04, eyeGap: 0.42, small: false, zones: [[0.32, -0.02], [-0.32, -0.02], [0.33, 0.08]] },
  sun:      { eyeY: 0.03, eyeGap: 0.28, small: false, zones: [[0.15, -0.14]] },
};

// Expression pairs that read clearly (eyes → allowed mouths).
const EXPRESSION = {
  button: ['none', 'smile', 'o', 'line', 'smirk', 'frown'],
  dot: ['none', 'smile', 'frown', 'line', 'o'],
  side: ['none', 'line', 'smirk', 'smile'],
  arc: ['none', 'smile', 'frown'],
  lash: ['none', 'smile'],
  line: ['none', 'line', 'frown'],
  halflid: ['none', 'line', 'smirk', 'frown'],
  wink: ['smile', 'smirk', 'none'],
};
const BROW_OK = { stern: ['button', 'dot', 'line', 'halflid'], worried: ['button', 'dot', 'side'] };

// Soft psychology priors (axes in -1..1, role).
const ROLE_BODIES = {
  manager: { square: 3, pentagon: 3, triangle: 3, pill: 2, bean: 1, mochi: 1 },
  firefighter: { flower: 3, frog: 2, bean: 2, triangle: 1, heart: 1, cloud: 1 },
  exile: { drop: 3, crescent: 3, cloud: 3, mochi: 3, bean: 1 },
  resource: { heart: 3, frog: 3, bean: 2, cloud: 1, flower: 1 },
};
const WARM = { wool: ['terracotta', 'mustard', 'orange', 'rose', 'brick', 'coral', 'peach', 'butter', 'cherry', 'pink', 'gold'], bright: ['red', 'orange', 'pink', 'yellow', 'sunflower', 'magenta'] };
const COOL = { wool: ['teal', 'sky', 'sage', 'lilac', 'navy', 'mint', 'cobalt', 'forest', 'plum', 'slate', 'lime', 'snow'], bright: ['teal', 'blue', 'purple', 'navy', 'sky', 'mint', 'green', 'lime', 'grey'] };

/**
 * Random, on-model character. profile: {role, axes:{agency,temperature,focus,attachment}} (all optional).
 * existing: DNA[] already in this user's constellation (for uniqueness). locks: {slot: value} kept as-is.
 */
export function generate({ seed = 1, collection = 'wool', profile = {}, existing = [], locks = {}, self = false } = {}) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const r = rng(seed + attempt * 7919);
    const ax = profile.axes || {};
    const role = profile.role;
    // body
    let bodyT = locks.body?.t;
    if (!bodyT) {
      const w = {}; BODIES.forEach((b) => (w[b] = 1));
      if (role && ROLE_BODIES[role]) Object.entries(ROLE_BODIES[role]).forEach(([b, v]) => (w[b] += v * 2));
      if (ax.agency !== undefined) { // active -> angular, receptive -> rounded
        const act = -ax.agency;
        ['triangle', 'pentagon', 'square', 'flower'].forEach((b) => (w[b] *= 1 + Math.max(0, act)));
        ['cloud', 'mochi', 'heart', 'drop', 'crescent'].forEach((b) => (w[b] *= 1 + Math.max(0, -act)));
      }
      const used = existing.map((d) => d.body.t);
      BODIES.forEach((b) => { const n = used.filter((u) => u === b).length; if (n >= 2) w[b] = 0; else if (n === 1 && used.length < 12) w[b] = 0; });
      bodyT = self ? 'sun' : r.weighted(w);
    }
    const body = locks.body || { t: bodyT, w: +r.range(0.92, 1.1).toFixed(3), h: +r.range(0.92, 1.1).toFixed(3), depth: +r.range(0.28, 0.38).toFixed(3), lean: +r.range(-0.12, 0.12).toFixed(3), wobble: +r.range(0.4, 1).toFixed(3) };
    // felt
    let felt = locks.felt;
    if (!felt) {
      let pool = Object.keys(FELT[collection]);
      if (ax.temperature !== undefined) {
        const warm = ax.temperature > 0.15, cool = ax.temperature < -0.15;
        if (warm || cool) pool = (warm ? WARM : COOL)[collection].concat(pool.filter(() => r() < 0.15));
      }
      felt = self ? (collection === 'wool' ? 'butter' : 'yellow') : r.pick(pool);
    }
    const thread = locks.thread || (collection === 'wool' ? (r() < 0.22 ? 'cream' : 'tone') : 'cream');
    // eyes
    const tm = TEMPLATE[body.t];
    let eyes = locks.eyes;
    if (!eyes) {
      const ew = { button: 4.5, dot: 1.4, side: 1.2, arc: 1.0, lash: 0.6, line: 0.5, halflid: 1.0, wink: 0.6 };
      if (tm.small) { ew.button *= 0.8; ew.dot *= 1.5; }
      if (tm.bumpEyes) { ew.button *= 3; }
      if (ax.attachment !== undefined) { if (ax.attachment > 0.3) { ew.button *= 2.5; } if (ax.attachment < -0.3) { ew.halflid *= 3; ew.dot *= 1.5; ew.side *= 2; } }
      if (ax.focus !== undefined) { if (ax.focus > 0.3) ew.side *= 3; if (ax.focus < -0.3) { ew.arc *= 2.5; ew.lash *= 1.5; } }
      if (role === 'exile') { ew.arc *= 1.6; ew.halflid *= 1.4; }
      if (role === 'manager') { ew.line *= 2; ew.halflid *= 1.5; }
      const used = existing.map((d) => d.eyes.style);
      EYES.forEach((e) => { if (used.filter((u) => u === e).length >= (e === 'button' ? 6 : 3)) ew[e] = 0; });
      const MOOD_EYES = { happy: ['button', 'button', 'dot'], content: ['lash', 'arc', 'button'], sleepy: ['halflid', 'arc'], grumpy: ['halflid', 'line', 'button'], side: ['side'], surprised: ['button'], wink: ['wink'], smirk: ['button', 'halflid', 'side'] };
      const mood = profile.mood;
      const usedE = existing.map((d) => d.eyes.style); const okE = (e) => usedE.filter((u) => u === e).length < (e === 'button' ? 6 : e === 'dot' ? 3 : 2);
      const style = self ? 'arc' : mood ? r.pick(MOOD_EYES[mood].filter(okE).length ? MOOD_EYES[mood].filter(okE) : ['button', 'dot']) : r.weighted(ew);
      let brow = 'none';
      if (profile.mood === 'grumpy' && BROW_OK.stern.includes(style)) brow = 'stern';
      else if (profile.mood) brow = 'none';
      else
      if (BROW_OK.stern.includes(style) && r() < (role === 'manager' ? 0.4 : 0.12)) brow = 'stern';
      else if (BROW_OK.worried.includes(style) && r() < (ax.attachment > 0.3 ? 0.45 : 0.1)) brow = 'worried';
      const big = style === 'button' || style === 'side' || style === 'halflid';
      eyes = { style, wide: profile.mood === 'surprised', size: +r.range(big ? 0.85 : 0.9, big ? 1.15 : 1.15).toFixed(3), gap: +r.range(0.85, 1.12).toFixed(3), y: +r.range(-0.03, 0.03).toFixed(3), gaze: style === 'side' ? [r() < 0.5 ? -1 : 1, 0] : [+r.range(-0.3, 0.3).toFixed(2), +r.range(-0.25, 0.15).toFixed(2)], lid: style === 'halflid' ? +r.range(0.4, 0.6).toFixed(2) : 0, brow };
    }
    let mouth = locks.mouth;
    if (!mouth) {
      const allowed = EXPRESSION[eyes.style];
      const MOOD_MOUTH = { happy: ['smile', 'smile', 'none'], content: ['smile', 'none'], sleepy: ['none'], grumpy: ['frown', 'line', 'none'], side: ['smirk', 'line', 'none'], surprised: ['o'], wink: ['smile', 'smirk'], smirk: ['smirk'] };
      const style = self ? 'smile' : profile.mood ? r.pick(MOOD_MOUTH[profile.mood]) : (r() < 0.35 ? 'none' : r.pick(allowed.filter((m) => m !== 'none')));
      mouth = { style: allowed.includes(style) ? style : 'none' };
    }
    let patch = locks.patch;
    if (!patch) {
      const pw = { planet: 3, moon: 2.5, star: 2.5, comet: 2, orbit: 1.2, constellation: 2, none: 0.25 };
      if (role === 'firefighter') pw.comet *= 2.5;
      if (role === 'exile') pw.moon *= 2;
      if (role === 'manager') pw.planet *= 1.6;
      const t = self ? 'none' : r.weighted(pw);
      const base = feltHex(collection, felt);
      const cands = PATCH_FELT[collection].filter((p) => p !== felt && deltaE(feltHex(collection, p), base) > 18);
      const zone = Math.floor(r() * tm.zones.length);
      patch = { t, felt: r.pick(cands.length ? cands : PATCH_FELT[collection]), felt2: r.pick(PATCH_FELT[collection]), zone, rot: Math.round(r.range(-25, 25)), scale: +r.range(0.75, 1.2).toFixed(3) };
    }
    let topper = locks.topper;
    if (!topper) {
      const tw = { planetStalk: 2, cometTail: 2, saturnRing: 1.6, starSprout: 1.6, moonCrest: 1.2, orbitMoon: 1.3 };
      if (role === 'firefighter') tw.cometTail *= 2.5;
      if (role === 'exile') { tw.moonCrest *= 2; tw.orbitMoon *= 1.5; }
      const used = existing.map((d) => d.topper?.t).filter(Boolean);
      Object.keys(tw).forEach((k) => { if (used.filter((u) => u === k).length >= 2) tw[k] = 0; });
      const want = !self && !locks.patch && r() < 0.5;
      topper = want ? { t: r.weighted(tw), felt: r.pick(PATCH_FELT[collection].filter((p) => p !== felt)), felt2: r.pick(PATCH_FELT[collection]), side: +r.range(-0.35, 0.35).toFixed(2), tilt: +r.range(-0.3, 0.3).toFixed(2) } : { t: 'none' };
      if (topper.t === 'cometTail') topper.felt = collection === 'wool' ? r.pick(['orange', 'gold', 'coral']) : r.pick(['orange', 'yellow', 'sunflower']);
    }
    if (topper.t !== 'none' && !locks.patch && r() < 0.8) patch = { ...patch, t: 'none' };
    const size = locks.size ?? +((role === 'exile' ? r.range(0.88, 0.96) : role === 'manager' ? r.range(0.98, 1.08) : r.range(0.92, 1.04)) * (TEMPLATE[body.t].small ? 1.14 : 1)).toFixed(3);
    const dna = { v: 2, render: 1, seed: (seed + attempt * 7919) >>> 0, collection, body, felt, thread, eyes, mouth, patch, topper, extra: { seam: !self && body.t === 'pill' && r() < 0.5, knots: 0 }, size, earned: [] };
    if (!lint(dna, existing).length) return dna;
  }
  throw new Error('generator could not satisfy taste rules');
}

/** Taste + uniqueness rules. Returns a list of violations (empty = on-model). */
export function lint(dna, existing = []) {
  const v = [];
  const base = feltHex(dna.collection, dna.felt);
  if (dna.patch.t !== 'none' && deltaE(feltHex(dna.collection, dna.patch.felt), base) < 18) v.push('patch felt too close to body felt');
  if (!EXPRESSION[dna.eyes.style]?.includes(dna.mouth.style)) v.push('eye/mouth pair does not read');
  if (dna.eyes.brow !== 'none' && !BROW_OK[dna.eyes.brow]?.includes(dna.eyes.style)) v.push('brow incompatible with eyes');
  if (dna.body.t === 'sun' && existing.some((d) => d.body.t === 'sun')) v.push('only one Self (sun) per constellation');
  if (TEMPLATE[dna.body.t].small && dna.eyes.style === 'button' && dna.eyes.size > 1.05) v.push('eyes too big for small body');
  for (const d of existing) {
    if (d.body.t === dna.body.t && d.felt === dna.felt) v.push('duplicate body+felt in constellation');
    else if (deltaE(feltHex(d.collection, d.felt), base) < 6 && d.body.t === dna.body.t) v.push('near-duplicate character');
  }
  return v;
}

/** A whole constellation: one Self + n parts, unique and varied. */
export function generateSet({ seed = 1, collection = 'wool', n = 12, profiles = [] } = {}) {
  const r = rng(seed * 977 + 13);
  const out = [generate({ seed, collection, self: true })];
  // mood mix: ~40% happy/content, rest spread
  const moods = ['happy', 'content', 'happy', 'sleepy', 'grumpy', 'side', 'surprised', 'wink', 'smirk', 'happy', 'content', 'sleepy'];
  for (let i = moods.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [moods[i], moods[j]] = [moods[j], moods[i]]; }
  // felt spread across value: >=3 deep, all clearly different
  const all = Object.keys(FELT[collection]).filter((k) => k !== out[0].felt);
  const L = (k) => oklab(FELT[collection][k])[0];
  const deep = all.filter((k) => L(k) < 0.56), rest = all.filter((k) => L(k) >= 0.56);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const felts = [];
  for (const k of shuffle(deep)) { if (felts.length >= 3) break; if (felts.every((f) => deltaE(FELT[collection][f], FELT[collection][k]) > 16)) felts.push(k); }
  for (const k of shuffle(rest).concat(shuffle(deep))) { if (felts.length >= n) break; if (!felts.includes(k) && felts.every((f) => deltaE(FELT[collection][f], FELT[collection][k]) > 14)) felts.push(k); }
  const order = shuffle(felts);
  for (let i = 0; i < n; i++) out.push(generate({ seed: seed * 31 + i * 101 + 7, collection, profile: { mood: moods[i % moods.length], ...(profiles[i] || {}) }, existing: out.slice(1), locks: order[i] ? { felt: order[i] } : {} }));
  return out;
}

export function describe(dna) {
  const eyes = { button: 'button eyes', dot: 'dot eyes', side: 'sideways glance', arc: 'sleepy closed eyes', lash: 'closed eyes with lashes', line: 'stern line eyes', halflid: 'half-lidded eyes', wink: 'a wink' }[dna.eyes.style];
  const patch = dna.patch.t === 'none' ? '' : ` and a ${dna.patch.t} patch`;
  return `A ${dna.felt} felt ${dna.body.t === 'sun' ? 'sun' : dna.body.t} with ${eyes}${patch}`;
}
