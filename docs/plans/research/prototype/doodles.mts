// 2D doodles drawn from the real plush. Each character's traits go through the app's own feltDna mapping,
// the Felt Atelier engine sews it (buildData), and the doodle is drawn from that sewing record, the same
// record felt-atelier/src/flat.js uses for the felt sticker. So any part a person crafts gets its doodle:
// same outline, face, patch and topper; flat felt colour and an ink line instead of felt and stitches.
//
// Usage (repo root, after npm ci): npx tsx docs/plans/research/prototype/doodles.mts > docs/plans/research/prototype/doodles.svg
import { generate } from '../../../../felt-atelier/src/dna.js';
import { buildData } from '../../../../felt-atelier/src/builder.js';
import { feltDna } from '../../../../src/parts-cartographer/pal/felt-dna';
import { PARTS, MOODS } from './cast';
import { toDoodleSymbol } from './doodle-core';

const symbols: string[] = [];
for (const [id, traits] of Object.entries(PARTS)) symbols.push(toDoodleSymbol(id, buildData(feltDna(traits), { lod: 'map' }).flat));
MOODS.forEach(([id, body, color, eyes, brow, mouth, topper], i) => {
  const dna: any = generate({ seed: 4000 + i * 97, collection: 'wool' });
  dna.body = { ...dna.body, t: body, lean: 0 };
  dna.felt = color;
  dna.eyes = { ...dna.eyes, style: eyes, brow, gaze: eyes === 'side' ? [1, 0] : [0, 0], lid: eyes === 'halflid' ? 0.5 : 0 };
  dna.mouth = { style: mouth };
  dna.cheeks = true;
  dna.patch = { ...dna.patch, t: 'none' };
  dna.topper = topper === 'none' ? { t: 'none' } : { t: topper, felt: 'gold', felt2: 'cream', side: 0, tilt: 0 };
  symbols.push(toDoodleSymbol(id, buildData(dna, { lod: 'map' }).flat));
});
process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>\n${symbols.join('\n')}\n</defs></svg>\n`);
