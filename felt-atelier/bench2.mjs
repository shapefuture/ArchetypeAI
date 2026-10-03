import { buildData } from './src/builder.js';
import { generateSet } from './src/dna.js';
const set = generateSet({ seed: 3, collection: 'wool', n: 23 });
for (const lod of ['hero', 'map']) {
  const by = {}; let n = 0;
  for (const d of set) { n++; for (const p of buildData(d, { lod }).parts) { const k = p.key[0] + (p.key[0] === 'f' && p.key.endsWith('|1') ? 'b' : ''); by[k] = (by[k] || 0) + p.geo.getAttribute('position').count / 3; } }
  console.log(lod, Object.entries(by).map(([k, v]) => `${k}:${Math.round(v / n / 100) / 10}k`).join('  '));
}
