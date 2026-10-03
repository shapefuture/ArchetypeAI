// IFS character -> Felt DNA. Same character, same felt part, every reload: the seed is the hash of the
// character's id, and the felt colour is locked to the nearest real swatch to the colour the app already
// uses for that part. Everything else (body, eyes, mouth, patch, topper) is the engine's own generator,
// steered by the part's role, so managers read angular, exiles read small and soft, the Self is the sun.
import type { IFSCharacter } from '../data/characters';
import type { CustomSpecies, CustomExpression, CustomAccessory } from '../components/CustomSticker';
import { generate, hashStr, nearestFelt, safeGenerate, type Dna } from './engine';

type Role = 'Self' | 'Manager' | 'Firefighter' | 'Exile';
const ENGINE_ROLE: Record<Role, 'manager' | 'firefighter' | 'exile' | 'resource'> = {
  Self: 'resource',         // the Self is generated with self:true, which forces the layered sun
  Manager: 'manager',
  Firefighter: 'firefighter',
  Exile: 'exile',
};
// role -> the moods that read right for that kind of part, picked deterministically per character
const MOODS: Record<Role, string[]> = {
  Self: ['content'],
  Manager: ['worried', 'grumpy', 'content', 'smirk'],
  Firefighter: ['surprised', 'cheeky', 'happy', 'smirk'],
  Exile: ['sleepy', 'grumpy', 'worried', 'happy'],
};
const AXES: Record<Role, { agency: number; temperature: number; focus: number; attachment: number }> = {
  Self: { agency: 0, temperature: 0.2, focus: 0, attachment: 0.5 },
  Manager: { agency: -0.45, temperature: 0, focus: 0.5, attachment: 0.2 },     // active, angular, watchful
  Firefighter: { agency: 0.55, temperature: 0.5, focus: -0.3, attachment: 0 }, // impulsive, warm, scattered
  Exile: { agency: -0.6, temperature: -0.3, focus: -0.5, attachment: -0.5 },   // small, cool, inward
};
const SIZE: Record<Role, number> = { Self: 1.18, Manager: 1.02, Firefighter: 0.98, Exile: 0.9 };

const dnaCache = new Map<string, Dna>();

/** The felt part for one of the app's characters. Deterministic: same id, same plush. */
export function dnaFor(c: IFSCharacter): Dna {
  const hit = dnaCache.get(c.id);
  if (hit) return hit;
  const seed = hashStr(c.id) >>> 0;
  const felt = nearestFelt(c.color.primary);
  const role = c.role as Role;
  const moods = MOODS[role];
  const profile = { role: ENGINE_ROLE[role], mood: moods[seed % moods.length], axes: AXES[role] };
  const dna = safeGenerate([
    { seed, collection: felt.collection, self: role === 'Self', profile, locks: { felt: felt.name, size: SIZE[role] } },
    { seed, collection: felt.collection, self: role === 'Self', profile, locks: { felt: felt.name } },
    { seed, collection: felt.collection, self: role === 'Self', profile },
    { seed, collection: felt.collection, self: role === 'Self' },
  ]);
  dnaCache.set(c.id, dna);
  return dna;
}

// ---------- the customizer: app choices -> felt choices ----------
export const SPECIES_BODY: Record<CustomSpecies, string> = {
  hamster: 'mochi', bunny: 'bean', fox: 'triangle', ghost: 'drop', star: 'flower',
};
// eyes + mouth pairs that the engine's own taste rules allow (see EXPRESSION in dna.js)
export const EXPRESSION_FACE: Record<CustomExpression, { eyes: any; mouth: any }> = {
  happy: { eyes: { style: 'dot', size: 1.05, gap: 1, y: 0, gaze: [0, 0], lid: 0, brow: 'none' }, mouth: { style: 'smile' } },
  worried: { eyes: { style: 'button', size: 1, gap: 1, y: 0, gaze: [0, 0], lid: 0, brow: 'worried' }, mouth: { style: 'frown' } },
  grumpy: { eyes: { style: 'halflid', size: 1, gap: 1, y: 0, gaze: [0, 0], lid: 0.55, brow: 'stern' }, mouth: { style: 'frown' } },
  crying: { eyes: { style: 'arc', size: 1, gap: 1, y: 0, gaze: [0, 0], lid: 0, brow: 'none' }, mouth: { style: 'frown' } },
  excited: { eyes: { style: 'button', size: 1.15, gap: 1.05, y: 0.02, gaze: [0, 0.1], lid: 0, brow: 'none' }, mouth: { style: 'o' } },
};
// accessories become real felt pieces: a sewn-on patch, or something stitched standing off the seam
export const ACCESSORY_PIECE: Record<CustomAccessory, { patch?: string; topper?: string }> = {
  none: {},
  clipboard: { patch: 'constellation' },
  cookies: { patch: 'orbit' },
  shield: { patch: 'planet' },
  blanket: { patch: 'moon' },
  teddy: { patch: 'planet' },
  lantern: { topper: 'starSprout' },
  heart: { patch: 'star' },
};

export type CustomPick = { name: string; role: Role; species: CustomSpecies; expression: CustomExpression; accessory: CustomAccessory; color: string; id: string };

export function dnaForCustom(pick: CustomPick): Dna {
  const seed = hashStr(pick.id || pick.name || 'part') >>> 0;
  const felt = nearestFelt(pick.color);
  const face = EXPRESSION_FACE[pick.expression];
  const piece = ACCESSORY_PIECE[pick.accessory];
  const isSelf = pick.role === 'Self';
  const body = isSelf ? undefined : { t: SPECIES_BODY[pick.species], w: 1, h: 1, depth: 0.33, lean: 0, wobble: 0.7 };
  const profile = {
    role: ENGINE_ROLE[pick.role],
    mood: MOODS[pick.role][seed % MOODS[pick.role].length],
    axes: AXES[pick.role],
  };
  // most locked first; if the engine's taste rules cannot satisfy a combination, give up the locks one at a time
  const dna = safeGenerate([
    { seed, collection: felt.collection, self: isSelf, profile, locks: { felt: felt.name, size: SIZE[pick.role], body, eyes: isSelf ? undefined : face.eyes, mouth: isSelf ? undefined : face.mouth } },
    { seed, collection: felt.collection, self: isSelf, profile, locks: { felt: felt.name, size: SIZE[pick.role], body } },
    { seed, collection: felt.collection, self: isSelf, profile, locks: { felt: felt.name, size: SIZE[pick.role] } },
    { seed, collection: felt.collection, self: isSelf, profile },
    { seed, collection: felt.collection, self: isSelf },
  ]);
  if (!isSelf) {
    dna.patch = { ...dna.patch, t: piece.patch && !piece.topper ? piece.patch : 'none' };
    dna.topper = { ...dna.topper, t: piece.topper ?? 'none' };
  }
  return dna;
}
