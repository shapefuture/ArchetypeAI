import { buildData } from './src/builder.js';
import { generateSet } from './src/dna.js';
const set = generateSet({ seed: 3, collection: 'wool', n: 23 });
for (const lod of ['hero', 'map']) {
  let tm = 0, tris = 0, parts = 0, bytes = 0, worst = 0;
  for (const d of set) { const t = performance.now(); const r = buildData(d, { lod }); const dt = performance.now() - t; tm += dt; worst = Math.max(worst, dt); parts += r.parts.length; for (const p of r.parts) { tris += p.geo.getAttribute('position').count / 3; for (const a of Object.values(p.geo.attributes)) bytes += a.array.byteLength; } }
  console.log(lod, 'chars', set.length, 'avg ms', (tm / set.length).toFixed(0), 'worst ms', worst.toFixed(0), 'avg tris', Math.round(tris / set.length), 'draw calls/char', (parts / set.length).toFixed(1), 'avg KB', Math.round(bytes / set.length / 1024));
}
