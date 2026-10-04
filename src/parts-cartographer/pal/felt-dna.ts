import { generate, BODIES } from '../../../felt-atelier/src/dna.js';
import { hashStr } from '../core/ports';
import type { Traits, Part } from './traits';

/** Stable identity from the existing traits. The merged Atelier owns all geometry and materials. */
export function feltDna(traits: Traits, part?: Pick<Part, 'id' | 'family' | 'archetype'>) {
  const shape = traits.shape === 'egg' ? 'drop' : traits.shape;
  const dna = generate({ seed: traits.characterSeed ?? hashStr(JSON.stringify(traits)), collection: 'wool' });
  if (BODIES.includes(shape)) dna.body.t = shape;
  dna.felt = /^#[\da-f]{6}$/i.test(traits.color) ? traits.color : dna.felt;
  const eyes = { ovals: 'button', googly: 'side', closed: 'arc', wink: 'wink', tiny: 'dot' }[traits.eyes] ?? traits.eyes;
  dna.eyes = { ...dna.eyes, style: eyes, size: .95, brow: traits.mouth === 'flat' ? 'stern' : 'none' };
  dna.mouth.style = ({ flat: 'line', grin: 'smirk' }[traits.mouth] ?? traits.mouth);
  // Existing headgear maps to sewn celestial accessories. New topper names pass through unchanged.
  dna.topper = { felt: 'gold', felt2: 'cream', side: 0, tilt: 0, ...dna.topper,
    t: ({ beret: 'moonCrest', halo: 'saturnRing', horns: 'planetStalk', party: 'starSprout', none: 'none' }[traits.head] ?? traits.head) };
  dna.facewear = traits.face;
  dna.bow = traits.bow;
  dna.cheeks = traits.cheeks;
  dna.thread = 'tone';
  return dna;
}
