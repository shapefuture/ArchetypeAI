// Shared by the worker and the main-thread fallback: generate (optional) + sew one character.
import { buildData } from './builder.js';
import { generate } from './dna.js';
function pack(d) {
  const parts = [], transfer = [];
  for (const { key, geo } of d.parts) {
    const attrs = {};
    for (const n of ['position', 'normal', 'uv', 'color']) { const a = geo.getAttribute(n); if (a) { attrs[n] = a.array; transfer.push(a.array.buffer); } }
    parts.push({ key, attrs });
  }
  return { msg: { parts, flat: d.flat, size: d.size }, transfer };
}
export function process(data) {
  const t = performance.now();
  let dna;
  if (data.op === 'random') { try { dna = generate(data.opts); } catch { dna = generate({ ...data.opts, existing: [] }); } } else dna = data.dna;
  const { msg, transfer } = pack(buildData(dna, { lod: data.lod }));
  return { out: { ok: true, dna, ...msg, ms: performance.now() - t }, transfer };
}
